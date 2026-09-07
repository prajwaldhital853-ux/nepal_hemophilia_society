from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsAdminRole
from apps.audit.models import AuditLog
from apps.hospitals.models import HospitalAdmin, HospitalStaffType
from apps.hospitals.permissions import CanManageHospitalStaff
from apps.hospitals.serializers import (
    HospitalStaffCreateSerializer,
    HospitalStaffSerializer,
    HospitalStaffUpdateSerializer,
)
from apps.patients.views import client_ip


def _flatten_errors(detail):
    if isinstance(detail, dict):
        parts = []
        for key, val in detail.items():
            if isinstance(val, (list, tuple)):
                parts.append(f"{key}: {' '.join(str(v) for v in val)}")
            else:
                parts.append(f"{key}: {val}")
        return " ".join(parts)
    if isinstance(detail, (list, tuple)):
        return " ".join(str(v) for v in detail)
    return str(detail)


def scoped_staff_queryset(user):
    qs = HospitalAdmin.objects.select_related("user", "hospital", "hospital__province").order_by("-user__date_joined")
    if user.role == UserRole.SUPER_ADMIN:
        return qs
    if user.role == UserRole.PROVINCE_ADMIN:
        profile = getattr(user, "province_admin", None)
        if not profile:
            return qs.none()
        return qs.filter(hospital__province_id=profile.province_id)
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        if not profile:
            return qs.none()
        qs = qs.filter(hospital_id=profile.hospital_id)
        if profile.staff_type == HospitalStaffType.TREATMENT_ADMIN:
            return qs.filter(user_id=user.id)
        return qs
    return qs.none()


def province_totals(qs):
    rows = qs.values("hospital__province__name").annotate(count=Count("id"))
    totals = {row["hospital__province__name"]: row["count"] for row in rows}
    totals["All"] = qs.count()
    return totals


class HospitalStaffViewSet(viewsets.ViewSet):
    """
    Treatment Admin & Center Admin accounts (plan.md Hospital Admin at a care center).
    """

    permission_classes = [IsAuthenticated, IsAdminRole, CanManageHospitalStaff]
    lookup_field = "display_id"
    lookup_value_regex = r"(TADM|CADM)-[0-9]+"

    def _staff_type(self):
        return self.kwargs.get("staff_type") or self.request.query_params.get("staffType")

    def _base_queryset(self):
        staff_type = self._staff_type()
        qs = scoped_staff_queryset(self.request.user)
        if staff_type in HospitalStaffType.values:
            qs = qs.filter(staff_type=staff_type)
        return qs

    def list(self, request, staff_type=None):
        qs = self._base_queryset()
        province = request.query_params.get("province", "").strip()
        if province and province != "All":
            qs = qs.filter(hospital__province__name=province)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(display_id__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(hospital__name__icontains=search)
            )

        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except ValueError:
            page = 1
        try:
            page_size = min(50, max(1, int(request.query_params.get("pageSize", 10))))
        except ValueError:
            page_size = 10

        total = qs.count()
        start = (page - 1) * page_size
        page_qs = qs[start : start + page_size]
        data = HospitalStaffSerializer(page_qs, many=True).data
        return Response(
            {
                "staff": data,
                "total": total,
                "page": page,
                "pageSize": page_size,
                "totalsByProvince": province_totals(self._base_queryset()),
            }
        )

    def retrieve(self, request, display_id=None, staff_type=None):
        profile = self._get_profile(display_id)
        return Response({"staff": HospitalStaffSerializer(profile).data})

    def create(self, request, staff_type=None):
        if request.user.role == UserRole.HOSPITAL_ADMIN:
            profile = getattr(request.user, "hospital_admin", None)
            if not profile or profile.staff_type != HospitalStaffType.CENTER_ADMIN:
                raise PermissionDenied("Only center admins can add treatment admins at their hospital.")
            staff_type = HospitalStaffType.TREATMENT_ADMIN

        if staff_type not in HospitalStaffType.values:
            return Response({"error": "Invalid staff type."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = HospitalStaffCreateSerializer(
            data=request.data,
            context={"staff_type": staff_type, "request": request},
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=status.HTTP_400_BAD_REQUEST)

        profile = serializer.save()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action=f"Created {profile.get_staff_type_display()}",
            module="Hospital Staff",
            object_id=profile.display_id,
            ip=client_ip(request),
            detail=f"{profile.display_id} at {profile.hospital.name}",
        )
        body = {"staff": HospitalStaffSerializer(profile).data}
        temp = getattr(serializer, "issued_temporary_password", None)
        if temp:
            body["credentials"] = {
                "adminId": profile.display_id,
                "username": profile.user.username,
                "email": profile.user.email,
                "temporaryPassword": temp,
            }
        return Response(body, status=status.HTTP_201_CREATED)

    def update(self, request, display_id=None, staff_type=None):
        profile = self._get_profile(display_id)
        if request.user.role == UserRole.HOSPITAL_ADMIN:
            own = getattr(request.user, "hospital_admin", None)
            if own and own.staff_type == HospitalStaffType.TREATMENT_ADMIN and profile.user_id != request.user.id:
                raise PermissionDenied("Treatment admins can only update their own profile.")

        serializer = HospitalStaffUpdateSerializer(profile, data=request.data, partial=False)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=status.HTTP_400_BAD_REQUEST)
        profile = serializer.save()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action=f"Updated {profile.get_staff_type_display()}",
            module="Hospital Staff",
            object_id=profile.display_id,
            ip=client_ip(request),
            detail=f"Updated {profile.display_id}",
        )
        body = {"staff": HospitalStaffSerializer(profile).data}
        temp = getattr(serializer, "issued_temporary_password", None)
        if temp:
            body["credentials"] = {
                "adminId": profile.display_id,
                "username": profile.user.username,
                "email": profile.user.email,
                "temporaryPassword": temp,
            }
        return Response(body)

    def _get_profile(self, display_id):
        qs = self._base_queryset()
        profile = qs.filter(display_id=display_id).first()
        if not profile:
            raise NotFound("Staff account not found.")
        return profile


class HospitalListView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def _queryset(self, request):
        from apps.hospitals.models import Hospital

        hospitals = Hospital.objects.select_related("province", "district").all()
        if request.user.role == UserRole.PROVINCE_ADMIN:
            profile = getattr(request.user, "province_admin", None)
            if profile:
                return hospitals.filter(province_id=profile.province_id)
            return hospitals.none()
        if request.user.role == UserRole.HOSPITAL_ADMIN:
            profile = getattr(request.user, "hospital_admin", None)
            if profile:
                return hospitals.filter(pk=profile.hospital_id)
            return hospitals.none()
        return hospitals

    def _serialize(self, hospital):
        return {
            "id": hospital.id,
            "name": hospital.name,
            "province": hospital.province.name,
            "district": hospital.district.name if hospital.district else "",
            "isActive": hospital.is_active,
        }

    def list(self, request):
        hospitals = self._queryset(request).filter(is_active=True)
        return Response({"hospitals": [self._serialize(h) for h in hospitals]})

    def create(self, request):
        from apps.accounts.rbac import PERM_HOSPITALS_MANAGE, has_perm, province_id_for
        from apps.hospitals.models import Hospital
        from apps.provinces.models import District, Province

        if not has_perm(request.user, PERM_HOSPITALS_MANAGE):
            raise PermissionDenied("You cannot create hospitals.")
        name = str(request.data.get("name") or "").strip()
        province_name = str(request.data.get("province") or "").strip()
        district_name = str(request.data.get("district") or "").strip()
        if not name or not province_name:
            return Response({"error": "Name and province are required."}, status=400)
        province = Province.objects.filter(name=province_name).first()
        if not province:
            return Response({"error": "Unknown province."}, status=400)
        if request.user.role == UserRole.PROVINCE_ADMIN and province.id != province_id_for(request.user):
            raise PermissionDenied("Province Admin can only add hospitals in their own province.")
        district = None
        if district_name:
            district = District.objects.filter(province=province, name=district_name).first()
            if not district:
                return Response({"error": "Unknown district for this province."}, status=400)
        hospital = Hospital.objects.create(name=name, province=province, district=district, is_active=True)
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Created hospital",
            module="Hospitals",
            object_id=str(hospital.id),
            ip=client_ip(request),
            detail=hospital.name,
        )
        return Response({"hospital": self._serialize(hospital)}, status=201)

    def update(self, request, pk=None):
        from apps.accounts.rbac import PERM_HOSPITALS_MANAGE, has_perm, province_id_for
        from apps.hospitals.models import Hospital

        if not has_perm(request.user, PERM_HOSPITALS_MANAGE):
            raise PermissionDenied("You cannot update hospitals.")
        hospital = self._queryset(request).filter(pk=pk).first()
        if not hospital:
            raise NotFound("Hospital not found.")
        if request.user.role == UserRole.PROVINCE_ADMIN and hospital.province_id != province_id_for(request.user):
            raise PermissionDenied("Hospital is outside your province.")
        name = request.data.get("name")
        active = request.data.get("isActive")
        if name:
            hospital.name = str(name).strip()
        if active is not None:
            hospital.is_active = bool(active)
        hospital.save()
        return Response({"hospital": self._serialize(hospital)})
