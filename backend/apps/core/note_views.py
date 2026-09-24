"""Follow-up notes on patients, staff accounts, injections, treatments and bleeding episodes."""

from django.db.models import Count
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole
from apps.accounts.rbac import KIND_LABELS, KIND_SUPER, account_kind
from apps.accounts.staffing import staff_queryset_for
from apps.audit.models import AuditLog
from apps.core.clinical import can_view_patient
from apps.core.models import NoteTarget, RecordNote
from apps.core.pagination import paginate_queryset
from apps.patients.models import BleedingEpisode, Patient

MAX_NOTE_LENGTH = 4000
CLINICAL_TYPES = (NoteTarget.INJECTION, NoteTarget.TREATMENT, NoteTarget.BLEEDING)


def _client_ip(request):
    from apps.patients.views import client_ip

    try:
        return client_ip(request)
    except Exception:
        return None


def _patient_by_code(code: str) -> Patient:
    patient = Patient.objects.filter(unique_patient_id__iexact=str(code).strip()).first()
    if not patient:
        raise NotFound("Patient not found.")
    return patient


def _resolve_target(user, target_type: str, target_id: str):
    """Returns (numeric target id, patient or None, human label) after checking the actor may see the target."""
    if target_type == NoteTarget.PATIENT:
        patient = _patient_by_code(target_id)
        if not can_view_patient(user, patient):
            raise PermissionDenied("You cannot view this patient.")
        return patient.pk, patient, f"{patient.full_name} ({patient.unique_patient_id})"

    try:
        pk = int(target_id)
    except (TypeError, ValueError):
        raise NotFound("Record not found.")

    if target_type == NoteTarget.STAFF:
        staff = staff_queryset_for(user).filter(pk=pk).first()
        if not staff:
            raise PermissionDenied("You cannot view this account.")
        return pk, None, staff.get_full_name() or staff.username

    if target_type == NoteTarget.INJECTION:
        from apps.injections.views import _injection_queryset, _scope_injections

        record = _injection_queryset().filter(pk=pk).first()
        if not record or not can_view_patient(user, record.patient):
            raise NotFound("Injection not found.")
        if not _scope_injections(user, _injection_queryset().filter(pk=pk), patient_id=record.patient.unique_patient_id).exists():
            raise PermissionDenied()
        return pk, record.patient, _injection_label(record)

    if target_type == NoteTarget.TREATMENT:
        from apps.treatments.views import _scope_treatments, _treatment_queryset

        record = _treatment_queryset().filter(pk=pk).first()
        if not record or not can_view_patient(user, record.patient):
            raise NotFound("Treatment not found.")
        if not _scope_treatments(user, _treatment_queryset().filter(pk=pk), patient_id=record.patient.unique_patient_id).exists():
            raise PermissionDenied()
        return pk, record.patient, _treatment_label(record)

    if target_type == NoteTarget.BLEEDING:
        record = BleedingEpisode.objects.select_related("patient").filter(pk=pk).first()
        if not record or not can_view_patient(user, record.patient):
            raise NotFound("Bleeding episode not found.")
        return pk, record.patient, _bleeding_label(record)

    raise NotFound("Unknown note target.")


def _injection_label(record):
    when = timezone.localtime(record.administered_at).strftime("%d %b %Y") if record.administered_at else ""
    product = getattr(record.factor_medicine, "name", "") or record.factor_type
    return " · ".join(part for part in ("Injection", when, product, f"{record.dose:g} {record.unit}") if part)


def _treatment_label(record):
    when = record.treatment_date.strftime("%d %b %Y") if record.treatment_date else ""
    return " · ".join(part for part in ("Treatment", when, record.get_treatment_type_display()) if part)


def _bleeding_label(record):
    when = record.episode_date.strftime("%d %b %Y") if record.episode_date else ""
    return " · ".join(part for part in ("Bleed", when, record.site, record.severity) if part)


def _labels_for(notes):
    """Bulk-load labels for clinical targets so aggregated lists don't query per note."""
    ids = {kind: set() for kind in CLINICAL_TYPES}
    for note in notes:
        if note.target_type in ids:
            ids[note.target_type].add(note.target_id)
    labels = {}
    if ids[NoteTarget.INJECTION]:
        from apps.injections.models import InjectionRecord

        for row in InjectionRecord.objects.select_related("factor_medicine").filter(pk__in=ids[NoteTarget.INJECTION]):
            labels[(NoteTarget.INJECTION, row.pk)] = _injection_label(row)
    if ids[NoteTarget.TREATMENT]:
        from apps.treatments.models import TreatmentRecord

        for row in TreatmentRecord.objects.filter(pk__in=ids[NoteTarget.TREATMENT]):
            labels[(NoteTarget.TREATMENT, row.pk)] = _treatment_label(row)
    if ids[NoteTarget.BLEEDING]:
        for row in BleedingEpisode.objects.filter(pk__in=ids[NoteTarget.BLEEDING]):
            labels[(NoteTarget.BLEEDING, row.pk)] = _bleeding_label(row)
    return labels


def _can_modify(user, note) -> bool:
    if getattr(user, "view_only", False):
        return False
    return note.author_id == user.pk or account_kind(user) == KIND_SUPER


def _serialize(note, user, labels=None):
    author = note.author
    role = ""
    if author:
        role = KIND_LABELS.get(account_kind(author), author.get_role_display())
    return {
        "id": note.pk,
        "targetType": note.target_type,
        "targetId": note.target_id,
        "targetLabel": (labels or {}).get((note.target_type, note.target_id), ""),
        "body": note.body,
        "author": {
            "id": note.author_id,
            "name": (author.get_full_name() or author.username) if author else note.author_name or "Former staff",
            "role": role,
        },
        "createdAt": note.created_at.isoformat(),
        "updatedAt": note.updated_at.isoformat(),
        "edited": (note.updated_at - note.created_at).total_seconds() > 2,
        "canEdit": _can_modify(user, note),
    }


def _clean_body(raw) -> str:
    body = str(raw or "").strip()
    if not body:
        raise ValidationError({"error": "Write something before saving the note."})
    if len(body) > MAX_NOTE_LENGTH:
        raise ValidationError({"error": f"Notes are limited to {MAX_NOTE_LENGTH} characters."})
    return body


def _audit(request, action, note, detail=""):
    try:
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action=action,
            module="Notes",
            object_id=f"{note.target_type}:{note.target_id}",
            ip=_client_ip(request),
            detail=detail[:500],
        )
    except Exception:
        pass


class NoteListCreateView(APIView):
    """GET/POST /notes/<targetType>/<targetId>/ — for patients, ?scope=all also returns their clinical notes."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, target_type, target_id):
        pk, patient, _label = _resolve_target(request.user, target_type, target_id)
        qs = RecordNote.objects.select_related("author")
        if target_type == NoteTarget.PATIENT and request.query_params.get("scope") == "all":
            qs = qs.filter(patient=patient)
            only = request.query_params.get("type")
            if only in NoteTarget.values:
                qs = qs.filter(target_type=only)
        else:
            qs = qs.filter(target_type=target_type, target_id=pk)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        labels = _labels_for(rows)
        return Response(
            {
                "notes": [_serialize(note, request.user, labels) for note in rows],
                "nextCursor": next_cursor,
                "limit": limit,
                "canWrite": not getattr(request.user, "view_only", False),
            }
        )

    def post(self, request, target_type, target_id):
        if getattr(request.user, "view_only", False):
            raise PermissionDenied("View-only accounts cannot add notes.")
        pk, patient, label = _resolve_target(request.user, target_type, target_id)
        note = RecordNote.objects.create(
            target_type=target_type,
            target_id=pk,
            patient=patient,
            body=_clean_body(request.data.get("body")),
            author=request.user,
            author_name=request.user.get_full_name() or request.user.username,
        )
        _audit(request, "Note added", note, label)
        labels = {(note.target_type, note.target_id): label} if target_type in CLINICAL_TYPES else {}
        return Response({"note": _serialize(note, request.user, labels)}, status=201)


class NoteDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def _get(self, request, pk):
        note = RecordNote.objects.select_related("author").filter(pk=pk).first()
        if not note:
            raise NotFound("Note not found.")
        target_ref = note.patient.unique_patient_id if note.target_type == NoteTarget.PATIENT and note.patient_id else note.target_id
        _resolve_target(request.user, note.target_type, target_ref)
        if not _can_modify(request.user, note):
            raise PermissionDenied("Only the author can change this note.")
        return note

    def patch(self, request, pk):
        note = self._get(request, pk)
        note.body = _clean_body(request.data.get("body"))
        note.save(update_fields=["body", "updated_at"])
        _audit(request, "Note edited", note)
        labels = _labels_for([note])
        return Response({"note": _serialize(note, request.user, labels)})

    def delete(self, request, pk):
        note = self._get(request, pk)
        _audit(request, "Note deleted", note, note.body[:200])
        note.delete()
        return Response(status=204)


class PatientNoteCountsView(APIView):
    """GET /notes/patient/<id>/counts/ — note counts per clinical record, for badge display in tables."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, target_id):
        patient = _patient_by_code(target_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied()
        counts = {kind: {} for kind in NoteTarget.values}
        total = 0
        for row in RecordNote.objects.filter(patient=patient).values("target_type", "target_id").annotate(n=Count("id")):
            counts.setdefault(row["target_type"], {})[str(row["target_id"])] = row["n"]
            total += row["n"]
        return Response({"counts": counts, "total": total})
