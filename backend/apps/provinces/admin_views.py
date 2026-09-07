from django.contrib.auth import get_user_model, password_validation
from django.db import transaction
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import CanManageProvinceAdmins
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
    return {
        "id": profile.display_id,
        "fullName": user.get_full_name() or user.username,
        "username": user.username,
        "email": user.email,
        "phone": user.mobile,
        "province": profile.province.name,
        "status": "Active" if user.is_active_account else "Inactive",
        "mustChangePassword": user.must_change_password,
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
        )
        profile = ProvinceAdmin.objects.create(user=user, province=province, display_id=next_padm_id())
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
        user.save()
        return Response({"admin": serialize_province_admin(profile)})
