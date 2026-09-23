from django.contrib.auth import get_user_model, password_validation
from django.db import transaction
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.rbac import KIND_PROVINCE
from apps.accounts.permissions import CanManageProvinceAdmins
from apps.accounts.staffing import apply_assigned_access, coerce_date, parse_bool
from apps.audit.models import AuditLog
from apps.patients.serializers import split_name
from apps.patients.views import _flatten_errors, client_ip
from apps.provinces.models import Province, ProvinceAdmin

User = get_user_model()


def next_padm_id():
    latest = (
        ProvinceAdmin.objects.filter(display_id__startswith="PADM-")
        .order_by("-display_id")
        .values_list("display_id", flat=True)
        .first()
    )
    if latest:
        try:
            seq = int(latest.split("-")[1]) + 1
        except (IndexError, ValueError):
            seq = 1
    else:
        seq = 1
    return f"PADM-{seq:05d}"


def serialize_province_admin(profile):
    user = profile.user
    from apps.accounts.rbac import PERMISSION_LABELS, permissions_for

    return {
        "id": profile.display_id,
        "fullName": user.get_full_name() or user.username,
        "username": user.username,
        "email": user.email,
        "phone": user.mobile,
        "province": profile.province.name,
        "status": "Active" if user.is_active_account else "Inactive",
        "mustChangePassword": user.must_change_password,
        "dateOfBirth": user.date_of_birth.isoformat() if user.date_of_birth else "",
        "gender": user.gender,
        "designation": user.designation,
        "employeeId": user.employee_id,
        "nationalId": user.national_id,
        "officeAddress": user.office_address,
        "notes": user.notes,
        "viewOnly": bool(user.view_only),
        "kind": KIND_PROVINCE,
        "roleLabel": "Province Admin",
        "permissions": [PERMISSION_LABELS.get(code, code) for code in permissions_for(user)],
        "permissionCodes": permissions_for(user),
    }


class ProvinceAdminListCreateView(APIView):
    permission_classes = [IsAuthenticated, CanManageProvinceAdmins]

    def get(self, request):
        qs = ProvinceAdmin.objects.select_related("user", "province").order_by("province__name")
        return Response({"admins": [serialize_province_admin(row) for row in qs], "total": qs.count()})

    @transaction.atomic
    def post(self, request):
        full_name = str(request.data.get("fullName") or "").strip()
        email = str(request.data.get("email") or "").strip().lower()
        phone = str(request.data.get("phone") or "").strip()
        province_name = str(request.data.get("province") or "").strip()
        temp = str(request.data.get("temporaryPassword") or "").strip()
        if not full_name or not email or not province_name or not temp:
            return Response({"error": "fullName, email, province and temporaryPassword are required."}, status=400)
        province = Province.objects.filter(name=province_name).first()
        if not province:
            return Response({"error": "Unknown province."}, status=400)
        if ProvinceAdmin.objects.filter(province=province).exists():
            return Response({"error": "This province already has a Province Admin."}, status=400)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": "This email is already used."}, status=400)
        try:
            password_validation.validate_password(temp)
        except Exception as exc:
            messages = getattr(exc, "messages", [str(exc)])
            return Response({"error": " ".join(messages)}, status=400)
        first, last = split_name(full_name)
        username = email.split("@")[0]
        base = username
        n = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{n}"
            n += 1
        user = User.objects.create_user(
            username=username,
            email=email,
            password=temp,
            first_name=first,
            last_name=last,
            role=UserRole.PROVINCE_ADMIN,
            mobile=phone,
            must_change_password=True,
            is_staff=True,
            is_active_account=True,
            date_of_birth=coerce_date(request.data.get("dateOfBirth")),
            gender=str(request.data.get("gender") or "")[:20],
            designation=str(request.data.get("designation") or "")[:120],
            employee_id=str(request.data.get("employeeId") or "")[:40],
            national_id=str(request.data.get("nationalId") or "")[:40],
            office_address=str(request.data.get("officeAddress") or request.data.get("address") or ""),
            notes=str(request.data.get("notes") or ""),
        )
        profile = ProvinceAdmin.objects.create(user=user, province=province, display_id=next_padm_id())
        user.staff_id = profile.display_id
        user.save(update_fields=["staff_id"])
        apply_assigned_access(
            request.user,
            user,
            KIND_PROVINCE,
            request.data.get("permissions"),
            parse_bool(request.data.get("viewOnly")),
        )
        from apps.notifications.services import notify_staff_created

        notify_staff_created(user, actor=request.user)
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Created province admin",
            module="Admins",
            object_id=profile.display_id,
            ip=client_ip(request),
            detail=f"{profile.display_id} — {province.name}",
        )
        return Response(
            {
                "admin": serialize_province_admin(profile),
                "credentials": {
                    "adminId": profile.display_id,
                    "username": user.username,
                    "email": user.email,
                    "temporaryPassword": temp,
                },
            },
            status=201,
        )


class ProvinceAdminDetailView(APIView):
    permission_classes = [IsAuthenticated, CanManageProvinceAdmins]

    def get(self, request, display_id):
        profile = ProvinceAdmin.objects.select_related("user", "province").filter(display_id=display_id).first()
        if not profile:
            raise NotFound("Province admin not found.")
        return Response({"admin": serialize_province_admin(profile)})

    def put(self, request, display_id):
        profile = ProvinceAdmin.objects.select_related("user", "province").filter(display_id=display_id).first()
        if not profile:
            raise NotFound("Province admin not found.")
        user = profile.user
        if request.data.get("fullName"):
            first, last = split_name(str(request.data["fullName"]))
            user.first_name = first
            user.last_name = last
        if request.data.get("email"):
            user.email = str(request.data["email"]).strip().lower()
        if request.data.get("phone") is not None:
            user.mobile = str(request.data.get("phone") or "")
        if request.data.get("status") == "Inactive":
            user.is_active_account = False
        elif request.data.get("status") == "Active":
            user.is_active_account = True
        if request.data.get("designation") is not None:
            user.designation = str(request.data.get("designation") or "")[:120]
        if request.data.get("employeeId") is not None:
            user.employee_id = str(request.data.get("employeeId") or "")[:40]
        if request.data.get("nationalId") is not None:
            user.national_id = str(request.data.get("nationalId") or "")[:40]
        if request.data.get("officeAddress") is not None or request.data.get("address") is not None:
            user.office_address = str(request.data.get("officeAddress") or request.data.get("address") or "")
        if request.data.get("gender") is not None:
            user.gender = str(request.data.get("gender") or "")[:20]
        user.save()
        if "permissions" in request.data or "viewOnly" in request.data:
            apply_assigned_access(
                request.user,
                user,
                KIND_PROVINCE,
                request.data.get("permissions"),
                parse_bool(request.data.get("viewOnly"), default=user.view_only),
            )
        from apps.notifications.services import notify_staff_updated

        notify_staff_updated(user, actor=request.user)
        return Response({"admin": serialize_province_admin(profile)})
