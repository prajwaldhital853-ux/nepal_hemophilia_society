import logging

from django.db import DatabaseError, IntegrityError
from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import admin_must_set_password
from apps.accounts.rbac import (
    KIND_LABELS,
    KIND_TREATMENT,
    PERMISSION_GROUPS,
    PERM_STOCK_DELETE,
    PERM_STOCK_MANAGE,
    account_kind,
    assignable_kinds,
    catalog_for_kind,
    grantable_codes,
    is_active_admin,
)
from apps.accounts.staffing import (
    create_staff_account,
    delete_staff_account,
    resolve_user_by_display_id,
    serialize_staff,
    staff_payload,
    staff_queryset_for,
    update_staff_account,
)
from apps.audit.models import AuditLog
from apps.patients.views import _flatten_errors, client_ip
from apps.provinces.models import ProvinceAdmin

logger = logging.getLogger(__name__)


class CanManageStaffDirectory(BasePermission):
    message = "You cannot manage admin accounts."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        if not is_active_admin(request.user):
            return False
        if request.method in SAFE_METHODS:
            return bool(assignable_kinds(request.user)) or account_kind(request.user) in (
                "super_admin",
                "admin",
                "province_admin",
                "center_admin",
            )
        return bool(assignable_kinds(request.user))


class StaffCatalogView(APIView):
    permission_classes = [IsAuthenticated, CanManageStaffDirectory]

    def get(self, request):
        actor = request.user
        kinds = assignable_kinds(actor)
        target_kind = str(request.query_params.get("kind") or "").strip()
        grantable = grantable_codes(actor, target_kind) if target_kind in kinds else set()
        groups = []
        source_groups = PERMISSION_GROUPS
        allowed_codes = grantable if target_kind else set().union(*(catalog_for_kind(kind) for kind in kinds))
        actor_grantable = set().union(*(grantable_codes(actor, kind) for kind in kinds)) if kinds else set()
        allowed_codes = allowed_codes.intersection(actor_grantable) if actor_grantable else allowed_codes
        for group in source_groups:
            perms = [item for item in group["permissions"] if item["code"] in allowed_codes]
            if perms:
                groups.append({**group, "permissions": perms})
        taken = list(ProvinceAdmin.objects.select_related("province").values_list("province__name", flat=True))
        return Response(
            {
                "assignableRoles": [
                    {
                        "kind": kind,
                        "label": KIND_LABELS[kind],
                        "requiresProvince": kind == "province_admin",
                        "requiresHospital": kind in ("center_admin", "treatment_admin"),
                        "defaults": sorted(
                            grantable_codes(actor, kind)
                            - ({PERM_STOCK_MANAGE, PERM_STOCK_DELETE} if kind == KIND_TREATMENT else set())
                        ),
                    }
                    for kind in kinds
                ],
                "permissionGroups": groups,
                "takenProvinces": taken,
                "actorKind": account_kind(actor),
            }
        )


class StaffListCreateView(APIView):
    permission_classes = [IsAuthenticated, CanManageStaffDirectory]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        qs = staff_queryset_for(request.user)
        kind = str(request.query_params.get("kind") or "").strip()
        search = str(request.query_params.get("search") or "").strip()
        province = str(request.query_params.get("province") or "").strip()
        if kind:
            if kind == "center_admin":
                qs = qs.filter(hospital_admin__staff_type="center_admin")
            elif kind == "treatment_admin":
                qs = qs.filter(hospital_admin__staff_type="treatment_admin")
            else:
                qs = qs.filter(role=kind)
        if province and province != "All":
            qs = qs.filter(
                Q(province_admin__province__name=province) | Q(hospital_admin__hospital__province__name=province)
            )
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(username__icontains=search)
                | Q(mobile__icontains=search)
                | Q(staff_id__icontains=search)
                | Q(hospital_admin__display_id__icontains=search)
                | Q(province_admin__display_id__icontains=search)
            )
        rows = [serialize_staff(user, request) for user in qs.order_by("first_name", "last_name", "id")[:300]]
        return Response({"staff": rows, "total": len(rows)})

    def post(self, request):
        try:
            user, temp = create_staff_account(request.user, staff_payload(request))
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        except PermissionDenied as exc:
            return Response({"error": str(exc.detail)}, status=403)
        except IntegrityError:
            return Response(
                {"error": "An admin with this email or ID already exists."},
                status=400,
            )
        except DatabaseError as exc:
            logger.exception("Admin create database error")
            return Response(
                {"error": f"Database error while saving admin: {exc}"},
                status=500,
            )
        except Exception as exc:
            logger.exception("Admin create failed")
            return Response({"error": str(exc)}, status=500)
        body = serialize_staff(user, request)
        try:
            AuditLog.objects.create(
                actor=request.user.get_username(),
                action=f"Created {body['roleLabel']}",
                module="Admins",
                object_id=body["id"],
                ip=client_ip(request),
                detail=user.email,
            )
        except Exception:
            logger.exception("Admin created but audit log write failed for %s", body["id"])
        return Response(
            {
                "admin": body,
                "staff": body,
                "credentials": {
                    "adminId": body["id"],
                    "username": user.username,
                    "email": user.email,
                    "temporaryPassword": temp,
                    "status": body["status"],
                    "loginWith": "username, email, or Admin ID",
                },
            },
            status=201,
        )


class StaffDetailView(APIView):
    permission_classes = [IsAuthenticated, CanManageStaffDirectory]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def _get(self, request, display_id):
        user = resolve_user_by_display_id(display_id)
        if not user:
            raise NotFound("Admin not found.")
        allowed_ids = {row.pk for row in staff_queryset_for(request.user)}
        if user.pk not in allowed_ids and user.pk != request.user.pk:
            raise PermissionDenied("You cannot view this admin.")
        return user

    def get(self, request, display_id):
        user = self._get(request, display_id)
        body = serialize_staff(user, request)
        return Response({"admin": body, "staff": body})

    def put(self, request, display_id):
        user = self._get(request, display_id)
        try:
            user, issued = update_staff_account(request.user, user, staff_payload(request))
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        except PermissionDenied as exc:
            return Response({"error": str(exc.detail)}, status=403)
        except IntegrityError:
            return Response(
                {"error": "An admin with this email or ID already exists."},
                status=400,
            )
        except DatabaseError as exc:
            logger.exception("Admin update database error")
            return Response(
                {"error": f"Database error while saving admin: {exc}"},
                status=500,
            )
        except Exception as exc:
            logger.exception("Admin update failed")
            return Response({"error": str(exc)}, status=500)
        body = serialize_staff(user, request)
        payload = {"admin": body, "staff": body}
        if issued:
            payload["credentials"] = {
                "adminId": body["id"],
                "username": user.username,
                "email": user.email,
                "temporaryPassword": issued,
            }
        return Response(payload)

    def delete(self, request, display_id):
        user = self._get(request, display_id)
        try:
            admin_id, name, kind = delete_staff_account(request.user, user)
        except PermissionDenied as exc:
            return Response({"error": str(exc.detail)}, status=403)
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action=f"Deleted {KIND_LABELS.get(kind, kind)}",
            module="Admins",
            object_id=admin_id,
            ip=client_ip(request),
            detail=name,
        )
        return Response(status=204)
