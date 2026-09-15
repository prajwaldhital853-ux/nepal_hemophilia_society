"""Add/list patient documents without a full patient edit (plan.md medical records)."""

from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import CanAddDocuments, IsAdminRole, IsPatientRole, PatientPasswordUsable
from apps.accounts.rbac import is_national_scope, province_id_for
from apps.audit.models import AuditLog
from apps.core.clinical import can_view_patient, resolve_actor_hospital
from apps.hospitals.models import Hospital
from apps.patients.clinical_views import _get_patient_or_404
from apps.patients.models import PatientDocument
from apps.patients.serializers import serialize_patient_document, validate_document_upload
from apps.patients.views import client_ip


def resolve_document_center(user, patient, hospital_name=None):
    if user.role == UserRole.HOSPITAL_ADMIN or is_national_scope(user):
        return resolve_actor_hospital(user, hospital_name, patient=patient)
    if user.role == UserRole.PROVINCE_ADMIN:
        name = (hospital_name or "").strip()
        if name:
            hospital = Hospital.objects.filter(name=name, is_active=True).first()
            if not hospital:
                return None, "Unknown treatment center."
            return hospital, None
        return patient.primary_hospital, None
    return None, "You cannot add documents."


def _document_queryset(patient):
    return PatientDocument.objects.select_related("uploaded_by", "hospital", "patient").filter(patient=patient)


def _filter_documents(qs, params):
    center = (params.get("center") or params.get("hospitalName") or "").strip()
    search = (params.get("search") or params.get("q") or "").strip()
    date_from = (params.get("from") or params.get("dateFrom") or "").strip()
    date_to = (params.get("to") or params.get("dateTo") or "").strip()
    if center:
        qs = qs.filter(hospital__name__iexact=center)
    if search:
        qs = qs.filter(original_name__icontains=search)
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)
    return qs


class PatientDocumentsView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdminRole(), CanAddDocuments()]
        return [IsAuthenticated(), IsAdminRole()]

    def get(self, request, patient_id):
        patient = _get_patient_or_404(patient_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied("You cannot view this patient.")
        qs = _filter_documents(_document_queryset(patient), request.query_params)
        data = [serialize_patient_document(doc, request) for doc in qs]
        return Response({"documents": data, "total": len(data)})

    def post(self, request, patient_id):
        patient = _get_patient_or_404(patient_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied("You cannot add documents for this patient.")
        uploads = request.FILES.getlist("documents") or request.FILES.getlist("file")
        single = request.FILES.get("file") or request.FILES.get("document")
        if single and single not in uploads:
            uploads = list(uploads) + [single]
        if not uploads:
            raise ValidationError({"documents": "Choose at least one PDF, JPG, or PNG file."})
        hospital, err = resolve_document_center(request.user, patient, request.data.get("treatmentCenter"))
        if err:
            raise ValidationError({"treatmentCenter": err})
        created = []
        for upload in uploads:
            validate_document_upload(upload)
            doc = PatientDocument.objects.create(
                patient=patient,
                file=upload,
                original_name=upload.name,
                content_type=getattr(upload, "content_type", "") or "",
                size=getattr(upload, "size", 0) or 0,
                uploaded_by=request.user,
                hospital=hospital,
            )
            created.append(serialize_patient_document(doc, request))
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Added patient document",
            module="Patients",
            object_id=patient.unique_patient_id,
            ip=client_ip(request),
            detail=f"{len(created)} file(s) for {patient.unique_patient_id} at {hospital.name if hospital else 'n/a'}",
        )
        return Response({"documents": created, "total": len(created)}, status=201)


class PatientDocumentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def delete(self, request, patient_id, pk):
        patient = _get_patient_or_404(patient_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied()
        doc = PatientDocument.objects.filter(pk=pk, patient=patient).first()
        if not doc:
            raise NotFound("Document not found.")
        user = request.user
        if user.role == UserRole.HOSPITAL_ADMIN:
            if doc.uploaded_by_id != user.id:
                raise PermissionDenied("Hospital staff can only remove documents they uploaded.")
        elif user.role == UserRole.PROVINCE_ADMIN:
            pid = province_id_for(user)
            if patient.province_id != pid:
                raise PermissionDenied()
        elif not is_national_scope(user):
            raise PermissionDenied()
        name = doc.original_name
        doc.file.delete(save=False)
        doc.delete()
        AuditLog.objects.create(
            actor=user.get_username(),
            action="Removed patient document",
            module="Patients",
            object_id=patient.unique_patient_id,
            ip=client_ip(request),
            detail=name,
        )
        return Response({"ok": True})


class PatientMeDocumentsView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        qs = _filter_documents(_document_queryset(patient), request.query_params)
        data = [serialize_patient_document(doc, request) for doc in qs]
        return Response({"documents": data, "total": len(data)})
