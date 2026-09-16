"""Create and update admin accounts with role hierarchy and assigned permissions."""

from __future__ import annotations

import json
import os
import re
from datetime import date

from django.contrib.auth import get_user_model, password_validation
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.models import UserRole
from apps.accounts.rbac import (
    KIND_ADMIN,
    KIND_CENTER,
    KIND_LABELS,
    KIND_PROVINCE,
    KIND_SUPER,
    KIND_TREATMENT,
    KIND_WEBSITE,
    PERMISSION_LABELS,
    account_kind,
    assigned_permission_codes,
    can_delete_user,
    can_manage_kind,
    can_manage_user,
    catalog_for_kind,
    grantable_codes,
    permissions_for,
    province_id_for,
)
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.patients.serializers import normalize_mobile, split_name, validate_document_upload
from apps.provinces.models import Province, ProvinceAdmin

User = get_user_model()

NEPAL_MOBILE = re.compile(r"^(97|98)\d{8}$")

KIND_TO_ROLE = {
    KIND_SUPER: UserRole.SUPER_ADMIN,
    KIND_ADMIN: UserRole.ADMIN,
    KIND_PROVINCE: UserRole.PROVINCE_ADMIN,
    KIND_CENTER: UserRole.HOSPITAL_ADMIN,
    KIND_TREATMENT: UserRole.HOSPITAL_ADMIN,
    KIND_WEBSITE: UserRole.WEBSITE_MANAGER,
}

ID_PREFIX = {
    KIND_SUPER: "SADM",
    KIND_ADMIN: "NADM",
    KIND_PROVINCE: "PADM",
    KIND_CENTER: "CADM",
    KIND_TREATMENT: "TADM",
    KIND_WEBSITE: "WADM",
}


def unique_username(base: str) -> str:
    slug = re.sub(r"[^a-z0-9._-]", "", (base or "staff").lower())[:24] or "staff"
    candidate = slug
    n = 1
    while User.objects.filter(username=candidate).exists():
        candidate = f"{slug}{n}"
        n += 1
    return candidate


def next_prefixed_id(prefix: str, queryset, field="display_id") -> str:
    latest = (
        queryset.filter(**{f"{field}__startswith": f"{prefix}-"})
        .order_by(f"-{field}")
        .values_list(field, flat=True)
        .first()
    )
    if latest:
        try:
            seq = int(str(latest).split("-")[1]) + 1
        except (IndexError, ValueError):
            seq = 1
    else:
        seq = 1
    while queryset.filter(**{field: f"{prefix}-{seq:05d}"}).exists() or User.objects.filter(
        staff_id=f"{prefix}-{seq:05d}"
    ).exists():
        seq += 1
    return f"{prefix}-{seq:05d}"


def next_staff_id(kind: str) -> str:
    prefix = ID_PREFIX[kind]
    if kind == KIND_PROVINCE:
        return next_prefixed_id(prefix, ProvinceAdmin.objects.all())
    if kind in (KIND_CENTER, KIND_TREATMENT):
        staff_type = HospitalStaffType.CENTER_ADMIN if kind == KIND_CENTER else HospitalStaffType.TREATMENT_ADMIN
        return next_prefixed_id(prefix, HospitalAdmin.objects.filter(staff_type=staff_type))
    return next_prefixed_id(prefix, User.objects.all(), field="staff_id")


def display_id_for(user) -> str:
    kind = account_kind(user)
    if kind == KIND_PROVINCE:
        profile = getattr(user, "province_admin", None)
        if profile:
            return profile.display_id
    if kind in (KIND_CENTER, KIND_TREATMENT):
        profile = getattr(user, "hospital_admin", None)
        if profile:
            return profile.display_id
    return getattr(user, "staff_id", None) or ""


def photo_url_for(user, request=None) -> str:
    photo = getattr(user, "photo", None)
    if not photo:
        return ""
    try:
        url = photo.url
    except ValueError:
        return ""
    if request is not None:
        return request.build_absolute_uri(url)
    return url


def save_admin_photo(user, upload):
    if not upload:
        return
    try:
        validate_document_upload(upload, image_only=True)
        display = display_id_for(user) or str(user.pk)
        ext = os.path.splitext(getattr(upload, "name", "") or "")[1].lower()
        if ext not in {".jpg", ".jpeg", ".png"}:
            ext = ".jpg"
        filename = f"{display}/photo{ext}"
        if user.photo:
            user.photo.delete(save=False)
        user.photo.save(filename, upload, save=True)
    except Exception as exc:
        message = str(exc)
        if "Invalid Signature" in message or "invalid signature" in message.lower():
            raise ValidationError(
                {
                    "photo": "Photo upload failed: Cloudinary credentials on the server are invalid. "
                    "Set only CLOUDINARY_URL on Render (from Cloudinary dashboard) and remove "
                    "CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET if present."
                }
            )
        raise ValidationError({"photo": f"Photo upload failed: {message}"})


def staff_payload(request) -> dict:
    data = {key: value for key, value in request.data.items()}
    raw_perms = data.get("permissions")
    if isinstance(raw_perms, str):
        text = raw_perms.strip()
        if not text:
            data["permissions"] = []
        elif text.startswith("["):
            try:
                data["permissions"] = json.loads(text)
            except json.JSONDecodeError:
                raise ValidationError({"permissions": "Invalid permissions payload."})
        else:
            data["permissions"] = [part.strip() for part in text.split(",") if part.strip()]
    photo = request.FILES.get("photo") if hasattr(request, "FILES") else None
    if photo:
        data["photo"] = photo
    return data


def resolve_user_by_display_id(display_id: str):
    if not display_id:
        return None
    prefix = display_id.split("-")[0]
    if prefix == "PADM":
        profile = ProvinceAdmin.objects.select_related("user", "province").filter(display_id=display_id).first()
        return profile.user if profile else None
    if prefix in ("TADM", "CADM"):
        profile = (
            HospitalAdmin.objects.select_related("user", "hospital", "hospital__province")
            .filter(display_id=display_id)
            .first()
        )
        return profile.user if profile else None
    return (
        User.objects.select_related(
            "hospital_admin",
            "hospital_admin__hospital",
            "hospital_admin__hospital__province",
            "province_admin",
            "province_admin__province",
        )
        .filter(staff_id=display_id)
        .first()
    )


def parse_bool(value, default=False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def coerce_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        raise ValidationError({"dateOfBirth": "Enter date of birth as YYYY-MM-DD."})


def validate_mobile(phone: str, required=False) -> str:
    mobile = normalize_mobile(phone or "")
    if not mobile:
        if required:
            raise ValidationError({"phone": "Mobile number is required."})
        return ""
    if not NEPAL_MOBILE.match(mobile):
        raise ValidationError({"phone": "Enter a valid Nepal mobile number (98/97 + 8 digits)."})
    return mobile


def validate_password(temp: str, field="temporaryPassword") -> str:
    value = str(temp or "").strip()
    if not value:
        raise ValidationError({field: "Temporary password is required."})
    try:
        password_validation.validate_password(value)
    except Exception as exc:
        messages = getattr(exc, "messages", [str(exc)])
        raise ValidationError({field: " ".join(messages)})
    return value


def apply_assigned_access(actor, user, kind: str, permissions, view_only: bool):
    catalog = catalog_for_kind(kind)
    allowed = grantable_codes(actor, kind)
    selected = {str(code).strip() for code in (permissions or []) if str(code).strip()}
    selected &= catalog
    grantable = sorted(selected & allowed)
    user.extra_permissions = grantable
    user.view_only = bool(view_only)
    user.save(update_fields=["extra_permissions", "view_only"])


def apply_profile_fields(user, data: dict):
    if "fullName" in data and data.get("fullName"):
        first, last = split_name(str(data["fullName"]))
        user.first_name = first
        user.last_name = last
    if "email" in data and data.get("email") is not None:
        email = str(data.get("email") or "").strip().lower()
        if email:
            qs = User.objects.filter(email__iexact=email).exclude(pk=user.pk)
            if qs.exists():
                raise ValidationError({"email": "This email is already used."})
            user.email = email
    if "phone" in data:
        user.mobile = validate_mobile(str(data.get("phone") or ""))
    if "dateOfBirth" in data:
        user.date_of_birth = coerce_date(data.get("dateOfBirth"))
    if "gender" in data:
        user.gender = str(data.get("gender") or "")[:20]
    if "designation" in data:
        user.designation = str(data.get("designation") or "")[:120]
    if "employeeId" in data:
        user.employee_id = str(data.get("employeeId") or "")[:40]
    if "nationalId" in data:
        user.national_id = str(data.get("nationalId") or "")[:40]
    if "officeAddress" in data:
        user.office_address = str(data.get("officeAddress") or "")
    if "notes" in data:
        user.notes = str(data.get("notes") or "")
    if data.get("status") == "Inactive":
        user.is_active_account = False
    elif data.get("status") in ("Active", "Pending"):
        user.is_active_account = True
        if data.get("status") == "Active":
            user.must_change_password = False
    user.save()


def _require_hospital(actor, data: dict, kind: str) -> Hospital:
    name = str(data.get("treatmentCenter") or data.get("hospitalName") or "").strip()
    hospital_id = data.get("hospitalId")
    hospital = None
    if hospital_id:
        hospital = Hospital.objects.filter(pk=hospital_id, is_active=True).select_related("province").first()
    elif name:
        hospital = Hospital.objects.filter(name=name, is_active=True).select_related("province").first()
    actor_kind = account_kind(actor)
    if actor_kind == KIND_CENTER:
        own = getattr(actor, "hospital_admin", None)
        if not own:
            raise ValidationError({"treatmentCenter": "Your account is not linked to a treatment center."})
        hospital = own.hospital
    if not hospital:
        raise ValidationError({"treatmentCenter": "Select a treatment center."})
    if actor_kind == KIND_PROVINCE:
        pid = province_id_for(actor)
        if hospital.province_id != pid:
            raise ValidationError({"treatmentCenter": "Hospital is outside your province."})
    if actor_kind == KIND_CENTER:
        own = getattr(actor, "hospital_admin", None)
        if own and hospital.id != own.hospital_id:
            raise ValidationError({"treatmentCenter": "You can only add staff to your own center."})
    if kind == KIND_TREATMENT and actor_kind == KIND_CENTER:
        return hospital
    return hospital


def _require_province(actor, data: dict) -> Province:
    name = str(data.get("province") or "").strip()
    actor_kind = account_kind(actor)
    if actor_kind == KIND_PROVINCE:
        profile = getattr(actor, "province_admin", None)
        if not profile:
            raise ValidationError({"province": "Your account is not linked to a province."})
        return profile.province
    if not name:
        raise ValidationError({"province": "Province is required."})
    province = Province.objects.filter(name=name).first()
    if not province:
        raise ValidationError({"province": "Unknown province."})
    return province


def assert_can_create(actor, kind: str):
    if getattr(actor, "view_only", False):
        raise PermissionDenied("View-only accounts cannot create or edit admins.")
    if not can_manage_kind(actor, kind):
        raise PermissionDenied(f"You cannot create a {KIND_LABELS.get(kind, kind)}.")


@transaction.atomic
def create_staff_account(actor, data: dict):
    kind = str(data.get("kind") or data.get("roleKind") or "").strip()
    if kind not in KIND_TO_ROLE:
        raise ValidationError({"kind": "Select a valid admin role."})
    assert_can_create(actor, kind)

    full_name = str(data.get("fullName") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    if not full_name:
        raise ValidationError({"fullName": "Full name is required."})
    if not email:
        raise ValidationError({"email": "Email is required."})
    if User.objects.filter(email__iexact=email).exists():
        raise ValidationError({"email": "This email is already used."})

    phone = validate_mobile(str(data.get("phone") or ""), required=True)
    temp = validate_password(data.get("temporaryPassword"))
    first, last = split_name(full_name)
    username = unique_username(email.split("@")[0])
    role = KIND_TO_ROLE[kind]
    display_id = next_staff_id(kind)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=temp,
        first_name=first,
        last_name=last,
        role=role,
        mobile=phone,
        must_change_password=True,
        is_staff=True,
        is_active_account=True,
        date_of_birth=coerce_date(data.get("dateOfBirth")),
        gender=str(data.get("gender") or "")[:20],
        designation=str(data.get("designation") or "")[:120],
        employee_id=str(data.get("employeeId") or "")[:40],
        national_id=str(data.get("nationalId") or "")[:40],
        office_address=str(data.get("officeAddress") or ""),
        notes=str(data.get("notes") or ""),
    )

    if kind in (KIND_SUPER, KIND_ADMIN, KIND_WEBSITE):
        user.staff_id = display_id
        user.save(update_fields=["staff_id"])
    elif kind == KIND_PROVINCE:
        province = _require_province(actor, data)
        if ProvinceAdmin.objects.filter(province=province).exists():
            raise ValidationError({"province": "This province already has a Province Admin."})
        ProvinceAdmin.objects.create(user=user, province=province, display_id=display_id)
        user.staff_id = display_id
        user.save(update_fields=["staff_id"])
    else:
        hospital = _require_hospital(actor, data, kind)
        staff_type = HospitalStaffType.CENTER_ADMIN if kind == KIND_CENTER else HospitalStaffType.TREATMENT_ADMIN
        HospitalAdmin.objects.create(
            user=user,
            hospital=hospital,
            staff_type=staff_type,
            display_id=display_id,
            date_of_birth=user.date_of_birth,
            gender=user.gender,
            address=user.office_address,
        )
        user.staff_id = display_id
        user.save(update_fields=["staff_id"])

    apply_assigned_access(actor, user, kind, data.get("permissions"), parse_bool(data.get("viewOnly")))
    save_admin_photo(user, data.get("photo"))
    return user, temp


@transaction.atomic
def update_staff_account(actor, user, data: dict):
    if actor.pk == user.pk:
        raise PermissionDenied("You cannot edit your own admin account. Ask another administrator.")
    if not can_manage_user(actor, user):
        raise PermissionDenied("You cannot update this admin.")
    if getattr(actor, "view_only", False):
        raise PermissionDenied("View-only accounts cannot edit admins.")
    if account_kind(user) == KIND_SUPER and account_kind(actor) != KIND_SUPER:
        raise PermissionDenied("Only Super Admin can change a Super Admin.")

    apply_profile_fields(user, data)

    kind = account_kind(user)
    if kind in (KIND_CENTER, KIND_TREATMENT) and data.get("treatmentCenter"):
        hospital = _require_hospital(actor, data, kind)
        profile = getattr(user, "hospital_admin", None)
        if profile:
            profile.hospital = hospital
            profile.date_of_birth = user.date_of_birth
            profile.gender = user.gender
            profile.address = user.office_address
            profile.save()

    if "permissions" in data or "viewOnly" in data:
        apply_assigned_access(
            actor,
            user,
            kind,
            data.get("permissions", assigned_permission_codes(user)),
            parse_bool(data.get("viewOnly"), default=user.view_only) if "viewOnly" in data else user.view_only,
        )

    reset_temp = data.get("resetTemporaryPassword") or data.get("temporaryPassword")
    issued = None
    if reset_temp and str(reset_temp).strip() and data.get("resetPassword"):
        issued = validate_password(reset_temp, field="resetTemporaryPassword")
        user.set_password(issued)
        user.must_change_password = True
        user.password_changed_at = None
        user.save(update_fields=["password", "must_change_password", "password_changed_at"])
    elif reset_temp and str(reset_temp).strip() and "resetTemporaryPassword" in data:
        issued = validate_password(reset_temp, field="resetTemporaryPassword")
        user.set_password(issued)
        user.must_change_password = True
        user.password_changed_at = None
        user.save(update_fields=["password", "must_change_password", "password_changed_at"])

    save_admin_photo(user, data.get("photo"))
    return user, issued


@transaction.atomic
def delete_staff_account(actor, user):
    if actor.pk == user.pk:
        raise PermissionDenied("You cannot delete your own account.")
    if not can_delete_user(actor, user):
        raise PermissionDenied("You cannot delete this admin.")
    admin_id = display_id_for(user)
    name = user.get_full_name() or user.username
    kind = account_kind(user) or user.role
    user.delete()
    return admin_id, name, kind


def serialize_staff(user, request=None) -> dict:
    kind = account_kind(user) or user.role
    hospital = getattr(getattr(user, "hospital_admin", None), "hospital", None)
    province_profile = getattr(user, "province_admin", None)
    province_name = ""
    if province_profile:
        province_name = province_profile.province.name
    elif hospital:
        province_name = hospital.province.name
    codes = permissions_for(user)
    assigned = assigned_permission_codes(user)
    status = "Inactive"
    if user.is_active_account:
        status = "Pending" if user.must_change_password else "Active"
    last_login = ""
    if user.last_login:
        last_login = timezone.localtime(user.last_login).strftime("%b %d, %Y %I:%M %p")
    actor = getattr(request, "user", None) if request is not None else None
    can_delete = bool(actor and actor.is_authenticated and can_delete_user(actor, user))
    can_edit = bool(
        actor
        and actor.is_authenticated
        and actor.pk != user.pk
        and not getattr(actor, "view_only", False)
        and can_manage_user(actor, user)
    )
    return {
        "id": display_id_for(user),
        "userId": user.id,
        "kind": kind,
        "role": user.role,
        "roleLabel": KIND_LABELS.get(kind, user.get_role_display()),
        "fullName": user.get_full_name() or user.username,
        "username": user.username,
        "email": user.email,
        "phone": user.mobile,
        "dateOfBirth": user.date_of_birth.isoformat() if user.date_of_birth else "",
        "gender": user.gender,
        "designation": user.designation,
        "employeeId": user.employee_id,
        "nationalId": user.national_id,
        "officeAddress": user.office_address,
        "notes": user.notes,
        "province": province_name,
        "treatmentCenter": hospital.name if hospital else "",
        "hospitalId": hospital.id if hospital else None,
        "status": status,
        "viewOnly": bool(user.view_only),
        "permissions": assigned,
        "effectivePermissions": codes,
        "permissionLabels": [{"code": code, "label": PERMISSION_LABELS.get(code, code)} for code in codes],
        "mustChangePassword": bool(user.must_change_password),
        "photoUrl": photo_url_for(user, request),
        "lastLogin": last_login,
        "joinedDate": user.date_joined.strftime("%b %d, %Y") if user.date_joined else "",
        "canDelete": can_delete,
        "canEdit": can_edit,
    }


def staff_queryset_for(actor):
    qs = User.objects.filter(role__in=list(KIND_TO_ROLE.values())).select_related(
        "hospital_admin",
        "hospital_admin__hospital",
        "hospital_admin__hospital__province",
        "province_admin",
        "province_admin__province",
    )
    actor_kind = account_kind(actor)
    if actor_kind == KIND_SUPER:
        return qs
    if actor_kind == KIND_ADMIN:
        return qs.exclude(role=UserRole.SUPER_ADMIN)
    if actor_kind == KIND_PROVINCE:
        pid = province_id_for(actor)
        if not pid:
            return qs.none()
        return qs.filter(
            Q(pk=actor.pk)
            | Q(province_admin__province_id=pid)
            | Q(hospital_admin__hospital__province_id=pid)
        )
    if actor_kind == KIND_CENTER:
        hid = getattr(getattr(actor, "hospital_admin", None), "hospital_id", None)
        if not hid:
            return qs.none()
        return qs.filter(Q(pk=actor.pk) | Q(hospital_admin__hospital_id=hid))
    if actor_kind == KIND_TREATMENT:
        return qs.filter(pk=actor.pk)
    return qs.none()
