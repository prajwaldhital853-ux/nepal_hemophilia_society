"""Scoped users directory for Super Admin, Admin, Province Admin, and hospital staff."""

from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import LoginDeviceLock, User, UserRole
from apps.accounts.permissions import CanViewUsers, IsAdminRole
from apps.accounts.rbac import (
    KIND_LABELS,
    account_kind,
    hospital_id_for,
    is_national_scope,
    province_id_for,
)
from apps.accounts.staffing import photo_url_for, staff_queryset_for
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


def _serialize_patient(patient, request):
    user = patient.user
    last_login = ""
    if user and user.last_login:
        last_login = user.last_login.isoformat()
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
        "lastLogin": last_login,
        "joinedDate": patient.created_at.isoformat() if patient.created_at else "",
        "photoUrl": "",
        "isPatient": True,
    }


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
        "lastLogin": row.get("lastLogin") or "",
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

        rows = []
        include_staff = kind in ("", "All", "all") or kind not in ("patient",)
        include_patients = kind in ("", "All", "all", "patient")
        if include_staff:
            for user in staff_qs.order_by("first_name", "last_name", "id")[:400]:
                row = _serialize_staff_row(user, request)
                if status and status != "All" and row["status"] != status:
                    continue
                rows.append(row)

        if include_patients:
            patients = _patient_queryset_for(request.user)
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
            for patient in patients.order_by("full_name")[:400]:
                rows.append(_serialize_patient(patient, request))

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

        login_tracking = [
            {
                "id": user.pk,
                "name": user.get_full_name() or user.username,
                "role": KIND_LABELS.get(account_kind(user), user.role),
                "username": user.username,
                "lastLogin": user.last_login.isoformat() if user.last_login else "",
                "active": user.is_active_account,
            }
            for user in login_users.order_by("-last_login")[:80]
        ]

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
            "total": len(rows),
            "admins": sum(1 for row in rows if not row["isPatient"]),
            "patients": sum(1 for row in rows if row["isPatient"]),
            "active": sum(1 for row in rows if row["status"] == "Active"),
        }
        return Response({"users": rows, "total": len(rows), "counts": counts, "loginTracking": login_tracking, "devices": devices})
