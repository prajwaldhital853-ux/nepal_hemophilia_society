"""Scoped users directory for Super Admin, Admin, Province Admin, and hospital staff."""

import base64
import json

from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import LoginDeviceLock, User, UserRole
from apps.accounts.permissions import CanViewUsers, IsAdminRole
from apps.accounts.presence import online_cutoff, presence_fields
from apps.accounts.rbac import (
    KIND_LABELS,
    account_kind,
    hospital_id_for,
    is_national_scope,
    province_id_for,
)
from apps.accounts.staffing import photo_url_for, staff_queryset_for
from apps.core.pagination import parse_limit
from apps.patients.models import Patient


def _patient_queryset_for(actor):
    qs = Patient.objects.select_related("province", "primary_hospital", "user")
    if is_national_scope(actor):
        return qs
    if actor.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(actor)
        return qs.filter(province_id=pid) if pid else qs.none()
    if actor.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(actor)
        return qs.filter(primary_hospital_id=hid) if hid else qs.none()
    return qs.none()


def _display_name(user):
    if user.role == UserRole.PATIENT:
        profile = getattr(user, "patient_profile", None)
        if profile and profile.full_name:
            return profile.full_name
    return user.get_full_name() or user.username


def _serialize_patient(patient, request):
    user = patient.user
    return {
        "id": patient.unique_patient_id,
        "userId": user.pk if user else None,
        "kind": "patient",
        "role": "patient",
        "roleLabel": "Patient",
        "fullName": patient.full_name,
        "username": user.username if user else patient.unique_patient_id,
        "email": patient.email,
        "phone": patient.mobile,
        "province": patient.province.name if patient.province_id else "",
        "treatmentCenter": patient.primary_hospital.name if patient.primary_hospital_id else "",
        "status": patient.verification_status,
        **presence_fields(user),
        "joinedDate": patient.created_at.isoformat() if patient.created_at else "",
        "photoUrl": "",
        "isPatient": True,
    }


def _filter_staff_status(qs, status):
    if not status or status == "All":
        return qs
    if status == "Inactive":
        return qs.filter(is_active_account=False)
    if status == "Pending":
        return qs.filter(is_active_account=True, must_change_password=True)
    if status == "Active":
        return qs.filter(is_active_account=True, must_change_password=False)
    return qs.none()


def _encode_cursor(payload):
    raw = json.dumps(payload, separators=(",", ":"), default=str)
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(raw):
    if not raw:
        return None
    try:
        padded = raw + "=" * (-len(raw) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
    except Exception:
        return None
    if not isinstance(data, dict) or "phase" not in data:
        return None
    return data


def _staff_after(cursor):
    fn = cursor.get("fn") or ""
    ln = cursor.get("ln") or ""
    pk = cursor.get("id")
    return (
        Q(first_name__gt=fn)
        | Q(first_name=fn, last_name__gt=ln)
        | Q(first_name=fn, last_name=ln, id__gt=pk)
    )


def _patient_after(cursor):
    name = cursor.get("name") or ""
    pk = cursor.get("id")
    return Q(full_name__gt=name) | Q(full_name=name, id__gt=pk)


def _page_directory(staff_qs, patient_qs, request, *, include_staff, include_patients):
    """Staff (by name) then patients (by name), one database page at a time."""
    limit = parse_limit(request)
    cursor = _decode_cursor(request.query_params.get("cursor"))
    staff_rows = []
    patient_rows = []

    take_staff = include_staff and (cursor is None or cursor.get("phase") == "staff")
    if take_staff:
        qs = staff_qs.order_by("first_name", "last_name", "id")
        if cursor and cursor.get("phase") == "staff" and not cursor.get("start"):
            qs = qs.filter(_staff_after(cursor))
        staff_rows = list(qs[: limit + 1])
        if len(staff_rows) > limit:
            page = staff_rows[:limit]
            last = page[-1]
            return page, [], _encode_cursor(
                {"phase": "staff", "fn": last.first_name or "", "ln": last.last_name or "", "id": last.id}
            ), limit

    remaining = limit - len(staff_rows)
    if include_patients:
        qs = patient_qs.order_by("full_name", "id")
        if cursor and cursor.get("phase") == "patient" and not cursor.get("start"):
            qs = qs.filter(_patient_after(cursor))
        probe = max(remaining, 0) + 1
        fetched = list(qs[:probe])
        patient_rows = fetched[:remaining]
        if len(fetched) > remaining:
            if patient_rows:
                last = patient_rows[-1]
                next_cursor = _encode_cursor(
                    {"phase": "patient", "name": last.full_name or "", "id": last.id}
                )
            else:
                next_cursor = _encode_cursor({"phase": "patient", "start": True})
            return staff_rows, patient_rows, next_cursor, limit

    return staff_rows, patient_rows, None, limit


def _serialize_staff_row(user, request):
    from apps.accounts.staffing import serialize_staff

    row = serialize_staff(user, request)
    return {
        "id": row["id"],
        "userId": row["userId"],
        "kind": row["kind"],
        "role": row["role"],
        "roleLabel": row["roleLabel"],
        "fullName": row["fullName"],
        "username": row["username"],
        "email": row["email"],
        "phone": row["phone"],
        "province": row["province"],
        "treatmentCenter": row["treatmentCenter"],
        "status": row["status"],
        **presence_fields(user),
        "joinedDate": row.get("joinedDate") or "",
        "photoUrl": row.get("photoUrl") or photo_url_for(user, request),
        "viewOnly": row.get("viewOnly"),
        "isPatient": False,
        "canDelete": row.get("canDelete"),
    }


class UsersDirectoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanViewUsers]

    def get(self, request):
        kind = str(request.query_params.get("kind") or "").strip()
        search = str(request.query_params.get("search") or "").strip()
        province = str(request.query_params.get("province") or "").strip()
        status = str(request.query_params.get("status") or "").strip()
        date_from = str(request.query_params.get("from") or "").strip()
        date_to = str(request.query_params.get("to") or "").strip()

        staff_qs = staff_queryset_for(request.user)
        if kind and kind != "patient" and kind != "All":
            if kind == "center_admin":
                staff_qs = staff_qs.filter(hospital_admin__staff_type="center_admin")
            elif kind == "treatment_admin":
                staff_qs = staff_qs.filter(hospital_admin__staff_type="treatment_admin")
            else:
                staff_qs = staff_qs.filter(role=kind)
        if province and province != "All":
            staff_qs = staff_qs.filter(
                Q(province_admin__province__name=province) | Q(hospital_admin__hospital__province__name=province)
            )
        if search:
            staff_qs = staff_qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(username__icontains=search)
                | Q(staff_id__icontains=search)
            )
        if date_from:
            staff_qs = staff_qs.filter(date_joined__date__gte=date_from)
        if date_to:
            staff_qs = staff_qs.filter(date_joined__date__lte=date_to)
        staff_qs = _filter_staff_status(staff_qs, status)

        include_staff = kind in ("", "All", "all") or kind not in ("patient",)
        include_patients = kind in ("", "All", "all", "patient")
        patients = _patient_queryset_for(request.user)
        if include_patients:
            if province and province != "All":
                patients = patients.filter(province__name=province)
            if search:
                patients = patients.filter(
                    Q(full_name__icontains=search)
                    | Q(email__icontains=search)
                    | Q(unique_patient_id__icontains=search)
                    | Q(mobile__icontains=search)
                )
            if date_from:
                patients = patients.filter(created_at__date__gte=date_from)
            if date_to:
                patients = patients.filter(created_at__date__lte=date_to)
            if status and status != "All":
                patients = patients.filter(verification_status=status)
        else:
            patients = patients.none()
        if not include_staff:
            staff_qs = staff_qs.none()

        staff_count = staff_qs.count()
        patient_count = patients.count()
        active_count = staff_qs.filter(is_active_account=True, must_change_password=False).count()
        active_count += patients.filter(verification_status="Active").count()

        staff_page, patient_page, next_cursor, limit = _page_directory(
            staff_qs,
            patients,
            request,
            include_staff=include_staff,
            include_patients=include_patients,
        )
        page_rows = [_serialize_staff_row(user, request) for user in staff_page]
        page_rows.extend(_serialize_patient(patient, request) for patient in patient_page)

        login_users = User.objects.exclude(role=UserRole.PATIENT)
        if not is_national_scope(request.user):
            if request.user.role == UserRole.PROVINCE_ADMIN:
                pid = province_id_for(request.user)
                login_users = login_users.filter(
                    Q(pk=request.user.pk)
                    | Q(hospital_admin__hospital__province_id=pid)
                    | Q(province_admin__province_id=pid)
                )
            elif request.user.role == UserRole.HOSPITAL_ADMIN:
                hid = hospital_id_for(request.user)
                login_users = login_users.filter(Q(pk=request.user.pk) | Q(hospital_admin__hospital_id=hid))
        else:
            if account_kind(request.user) != "super_admin":
                login_users = login_users.exclude(role=UserRole.SUPER_ADMIN)

        now = timezone.now()
        patient_users = _patient_queryset_for(request.user).filter(user__isnull=False).values("user_id")
        tracked = User.objects.filter(Q(pk__in=login_users.values("pk")) | Q(pk__in=patient_users)).filter(
            last_login__isnull=False
        )
        if kind == "patient":
            tracked = tracked.filter(role=UserRole.PATIENT)
        elif kind and kind not in ("All", "all"):
            tracked = tracked.exclude(role=UserRole.PATIENT)
        login_tracking = [
            {
                "id": user.pk,
                "name": _display_name(user),
                "role": "Patient" if user.role == UserRole.PATIENT else KIND_LABELS.get(account_kind(user), user.role),
                "username": user.username,
                **presence_fields(user, now),
                "active": user.is_active_account,
            }
            for user in tracked.select_related("patient_profile", "hospital_admin", "province_admin").order_by(
                F("last_seen_at").desc(nulls_last=True), "-last_login"
            )[:100]
        ]
        cutoff = online_cutoff(now)
        presence_counts = tracked.aggregate(
            online=Count("pk", filter=Q(last_seen_at__gte=cutoff) & (Q(last_logout_at__isnull=True) | Q(last_logout_at__lt=F("last_seen_at")))),
            today=Count("pk", filter=Q(last_login__date=timezone.localdate(now)) | Q(last_seen_at__date=timezone.localdate(now))),
        )

        device_qs = LoginDeviceLock.objects.select_related("user").all()
        if not is_national_scope(request.user):
            allowed_ids = list(login_users.values_list("id", flat=True))
            device_qs = device_qs.filter(user_id__in=allowed_ids)
        devices = [
            {
                "deviceId": row.device_id[:12] + "…" if len(row.device_id) > 12 else row.device_id,
                "identifier": row.identifier,
                "user": row.user.get_username() if row.user_id else "",
                "failedAttempts": row.failed_attempts,
                "lockedUntil": row.locked_until.isoformat() if getattr(row, "locked_until", None) else "",
            }
            for row in device_qs.order_by("-id")[:40]
        ]

        counts = {
            "total": staff_count + patient_count,
            "admins": staff_count,
            "patients": patient_count,
            "active": active_count,
            "online": presence_counts["online"] or 0,
            "signedInToday": presence_counts["today"] or 0,
        }
        return Response(
            {
                "users": page_rows,
                "total": staff_count + patient_count,
                "counts": counts,
                "loginTracking": login_tracking,
                "devices": devices,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )
