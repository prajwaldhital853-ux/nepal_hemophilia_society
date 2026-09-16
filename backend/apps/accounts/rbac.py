"""
RBAC matrix from plan.md §5, extended with national Admin, Website Manager,
per-user permission grants, and view-only access.
"""

from apps.accounts.models import UserRole
from apps.hospitals.models import HospitalStaffType

PERM_DASHBOARD = "dashboard"
PERM_PATIENTS_VIEW = "patients.view"
PERM_PATIENTS_SEARCH = "patients.search"
PERM_PATIENTS_CREATE = "patients.create"
PERM_PATIENTS_UPDATE = "patients.update"
PERM_PATIENTS_VERIFY = "patients.verify"
PERM_PATIENTS_DELETE = "patients.delete"
PERM_INJECTIONS_VIEW = "injections.view"
PERM_INJECTIONS_ADD = "injections.add"
PERM_INJECTIONS_UPDATE = "injections.update"
PERM_INJECTIONS_CORRECT = "injections.correct"
PERM_INJECTIONS_DELETE = "injections.delete"
PERM_TREATMENTS_VIEW = "treatments.view"
PERM_TREATMENTS_ADD = "treatments.add"
PERM_TREATMENTS_UPDATE = "treatments.update"
PERM_TREATMENTS_DELETE = "treatments.delete"
PERM_HOSPITAL_STAFF_VIEW = "hospitalStaff.view"
PERM_HOSPITAL_STAFF_MANAGE = "hospitalStaff.manage"
PERM_HOSPITAL_STAFF_DELETE = "hospitalStaff.delete"
PERM_PROVINCE_ADMINS_MANAGE = "provinceAdmins.manage"
PERM_HOSPITALS_MANAGE = "hospitals.manage"
PERM_HOSPITALS_DELETE = "hospitals.delete"
PERM_FACTORS_VIEW = "factors.view"
PERM_FACTORS_MANAGE = "factors.manage"
PERM_FACTORS_DELETE = "factors.delete"
PERM_AUDIT_VIEW = "audit.view"
PERM_REPORTS_NATIONAL = "reports.national"
PERM_REPORTS_PROVINCE = "reports.province"
PERM_REPORTS_HOSPITAL = "reports.hospital"
PERM_SETTINGS_SYSTEM = "settings.system"
PERM_WEBSITE_VIEW = "website.view"
PERM_WEBSITE_MANAGE = "website.manage"
PERM_WEBSITE_DELETE = "website.delete"
PERM_USERS_VIEW = "users.view"
PERM_USERS_MANAGE = "users.manage"
PERM_USERS_DELETE = "users.delete"
PERM_STOCK_VIEW = "stock.view"
PERM_STOCK_MANAGE = "stock.manage"
PERM_STOCK_DELETE = "stock.delete"
PERM_DOCUMENTS_ADD = "documents.add"
PERM_DOCUMENTS_DELETE = "documents.delete"
PERM_ADMINS_VIEW = "admins.view"
PERM_ADMINS_MANAGE = "admins.manage"
PERM_ADMINS_DELETE = "admins.delete"

KIND_SUPER = "super_admin"
KIND_ADMIN = "admin"
KIND_PROVINCE = "province_admin"
KIND_CENTER = "center_admin"
KIND_TREATMENT = "treatment_admin"
KIND_WEBSITE = "website_manager"

KIND_LABELS = {
    KIND_SUPER: "Super Admin",
    KIND_ADMIN: "Admin",
    KIND_PROVINCE: "Province Admin",
    KIND_CENTER: "Center Admin",
    KIND_TREATMENT: "Treatment Admin",
    KIND_WEBSITE: "Website Manager",
}

WRITE_SUFFIXES = frozenset({"create", "update", "add", "manage", "verify", "correct", "delete"})
READ_SUFFIXES = frozenset({"view", "search"})

SUPER_PERMS = frozenset(
    {
        PERM_DASHBOARD,
        PERM_PATIENTS_VIEW,
        PERM_PATIENTS_SEARCH,
        PERM_PATIENTS_CREATE,
        PERM_PATIENTS_UPDATE,
        PERM_PATIENTS_VERIFY,
        PERM_PATIENTS_DELETE,
        PERM_INJECTIONS_VIEW,
        PERM_INJECTIONS_ADD,
        PERM_INJECTIONS_UPDATE,
        PERM_INJECTIONS_CORRECT,
        PERM_INJECTIONS_DELETE,
        PERM_TREATMENTS_VIEW,
        PERM_TREATMENTS_ADD,
        PERM_TREATMENTS_UPDATE,
        PERM_TREATMENTS_DELETE,
        PERM_HOSPITAL_STAFF_VIEW,
        PERM_HOSPITAL_STAFF_MANAGE,
        PERM_HOSPITAL_STAFF_DELETE,
        PERM_PROVINCE_ADMINS_MANAGE,
        PERM_HOSPITALS_MANAGE,
        PERM_HOSPITALS_DELETE,
        PERM_FACTORS_VIEW,
        PERM_FACTORS_MANAGE,
        PERM_FACTORS_DELETE,
        PERM_AUDIT_VIEW,
        PERM_REPORTS_NATIONAL,
        PERM_REPORTS_PROVINCE,
        PERM_REPORTS_HOSPITAL,
        PERM_SETTINGS_SYSTEM,
        PERM_WEBSITE_VIEW,
        PERM_WEBSITE_MANAGE,
        PERM_WEBSITE_DELETE,
        PERM_USERS_VIEW,
        PERM_USERS_MANAGE,
        PERM_USERS_DELETE,
        PERM_STOCK_VIEW,
        PERM_STOCK_MANAGE,
        PERM_STOCK_DELETE,
        PERM_DOCUMENTS_ADD,
        PERM_DOCUMENTS_DELETE,
        PERM_ADMINS_VIEW,
        PERM_ADMINS_MANAGE,
        PERM_ADMINS_DELETE,
    }
)

ADMIN_PERMS = SUPER_PERMS - {PERM_SETTINGS_SYSTEM, PERM_INJECTIONS_CORRECT}

PROVINCE_PERMS = frozenset(
    {
        PERM_DASHBOARD,
        PERM_PATIENTS_VIEW,
        PERM_PATIENTS_SEARCH,
        PERM_PATIENTS_CREATE,
        PERM_PATIENTS_UPDATE,
        PERM_PATIENTS_VERIFY,
        PERM_PATIENTS_DELETE,
        PERM_INJECTIONS_VIEW,
        PERM_INJECTIONS_ADD,
        PERM_INJECTIONS_UPDATE,
        PERM_TREATMENTS_VIEW,
        PERM_TREATMENTS_ADD,
        PERM_TREATMENTS_UPDATE,
        PERM_HOSPITAL_STAFF_VIEW,
        PERM_HOSPITAL_STAFF_MANAGE,
        PERM_HOSPITAL_STAFF_DELETE,
        PERM_HOSPITALS_MANAGE,
        PERM_HOSPITALS_DELETE,
        PERM_FACTORS_VIEW,
        PERM_STOCK_VIEW,
        PERM_STOCK_MANAGE,
        PERM_STOCK_DELETE,
        PERM_USERS_VIEW,
        PERM_DOCUMENTS_ADD,
        PERM_DOCUMENTS_DELETE,
        PERM_REPORTS_PROVINCE,
        PERM_REPORTS_HOSPITAL,
    }
)

HOSPITAL_PERMS = frozenset(
    {
        PERM_DASHBOARD,
        PERM_PATIENTS_VIEW,
        PERM_PATIENTS_SEARCH,
        PERM_INJECTIONS_VIEW,
        PERM_INJECTIONS_ADD,
        PERM_INJECTIONS_UPDATE,
        PERM_INJECTIONS_DELETE,
        PERM_TREATMENTS_VIEW,
        PERM_TREATMENTS_ADD,
        PERM_TREATMENTS_UPDATE,
        PERM_TREATMENTS_DELETE,
        PERM_HOSPITAL_STAFF_VIEW,
        PERM_FACTORS_VIEW,
        PERM_STOCK_VIEW,
        PERM_STOCK_MANAGE,
        PERM_STOCK_DELETE,
        PERM_USERS_VIEW,
        PERM_DOCUMENTS_ADD,
        PERM_DOCUMENTS_DELETE,
        PERM_REPORTS_HOSPITAL,
    }
)

CENTER_ADMIN_EXTRA = frozenset({PERM_HOSPITAL_STAFF_MANAGE, PERM_HOSPITAL_STAFF_DELETE})

WEBSITE_PERMS = frozenset({PERM_WEBSITE_VIEW, PERM_WEBSITE_MANAGE, PERM_WEBSITE_DELETE})

PATIENT_PERMS = frozenset(
    {
        "patient.profile",
        "patient.history",
        "patient.notifications",
        "patient.documents",
        "stock.view_own_center",
    }
)

KIND_CATALOG = {
    KIND_SUPER: SUPER_PERMS,
    KIND_ADMIN: ADMIN_PERMS,
    KIND_PROVINCE: PROVINCE_PERMS,
    KIND_CENTER: HOSPITAL_PERMS | CENTER_ADMIN_EXTRA,
    KIND_TREATMENT: HOSPITAL_PERMS,
    KIND_WEBSITE: WEBSITE_PERMS,
}

ROLE_PERMS = {
    UserRole.SUPER_ADMIN: SUPER_PERMS,
    UserRole.ADMIN: ADMIN_PERMS,
    UserRole.PROVINCE_ADMIN: PROVINCE_PERMS,
    UserRole.HOSPITAL_ADMIN: HOSPITAL_PERMS,
    UserRole.WEBSITE_MANAGER: WEBSITE_PERMS,
    UserRole.PATIENT: PATIENT_PERMS,
}

PERMISSION_GROUPS = [
    {
        "page": "dashboard",
        "label": "Dashboard",
        "permissions": [{"code": PERM_DASHBOARD, "action": "view", "label": "View"}],
    },
    {
        "page": "patients",
        "label": "Patients",
        "permissions": [
            {"code": PERM_PATIENTS_VIEW, "action": "view", "label": "View"},
            {"code": PERM_PATIENTS_CREATE, "action": "create", "label": "Add"},
            {"code": PERM_PATIENTS_UPDATE, "action": "update", "label": "Update"},
            {"code": PERM_PATIENTS_DELETE, "action": "delete", "label": "Delete"},
            {"code": PERM_PATIENTS_SEARCH, "action": "view", "label": "Search by ID"},
            {"code": PERM_PATIENTS_VERIFY, "action": "update", "label": "Verify"},
        ],
    },
    {
        "page": "injections",
        "label": "Injections",
        "permissions": [
            {"code": PERM_INJECTIONS_VIEW, "action": "view", "label": "View"},
            {"code": PERM_INJECTIONS_ADD, "action": "create", "label": "Add"},
            {"code": PERM_INJECTIONS_UPDATE, "action": "update", "label": "Update"},
            {"code": PERM_INJECTIONS_DELETE, "action": "delete", "label": "Delete"},
            {"code": PERM_INJECTIONS_CORRECT, "action": "update", "label": "Correct other centers"},
        ],
    },
    {
        "page": "treatments",
        "label": "Treatments",
        "permissions": [
            {"code": PERM_TREATMENTS_VIEW, "action": "view", "label": "View"},
            {"code": PERM_TREATMENTS_ADD, "action": "create", "label": "Add"},
            {"code": PERM_TREATMENTS_UPDATE, "action": "update", "label": "Update"},
            {"code": PERM_TREATMENTS_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
    {
        "page": "hospitalStaff",
        "label": "Hospital staff",
        "permissions": [
            {"code": PERM_HOSPITAL_STAFF_VIEW, "action": "view", "label": "View"},
            {"code": PERM_HOSPITAL_STAFF_MANAGE, "action": "create", "label": "Add"},
            {"code": PERM_HOSPITAL_STAFF_MANAGE, "action": "update", "label": "Update"},
            {"code": PERM_HOSPITAL_STAFF_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
    {
        "page": "admins",
        "label": "Admin accounts",
        "permissions": [
            {"code": PERM_ADMINS_VIEW, "action": "view", "label": "View"},
            {"code": PERM_ADMINS_MANAGE, "action": "create", "label": "Add"},
            {"code": PERM_ADMINS_MANAGE, "action": "update", "label": "Update"},
            {"code": PERM_ADMINS_DELETE, "action": "delete", "label": "Delete"},
            {"code": PERM_PROVINCE_ADMINS_MANAGE, "action": "update", "label": "Manage Province Admins"},
        ],
    },
    {
        "page": "hospitals",
        "label": "Hospitals",
        "permissions": [
            {"code": PERM_HOSPITALS_MANAGE, "action": "create", "label": "Add"},
            {"code": PERM_HOSPITALS_MANAGE, "action": "update", "label": "Update"},
            {"code": PERM_HOSPITALS_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
    {
        "page": "stock",
        "label": "Stock",
        "permissions": [
            {"code": PERM_STOCK_VIEW, "action": "view", "label": "View"},
            {"code": PERM_STOCK_MANAGE, "action": "create", "label": "Add"},
            {"code": PERM_STOCK_MANAGE, "action": "update", "label": "Update"},
            {"code": PERM_STOCK_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
    {
        "page": "factors",
        "label": "Factor catalog",
        "permissions": [
            {"code": PERM_FACTORS_VIEW, "action": "view", "label": "View"},
            {"code": PERM_FACTORS_MANAGE, "action": "create", "label": "Add"},
            {"code": PERM_FACTORS_MANAGE, "action": "update", "label": "Update"},
            {"code": PERM_FACTORS_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
    {
        "page": "documents",
        "label": "Documents",
        "permissions": [
            {"code": PERM_DOCUMENTS_ADD, "action": "create", "label": "Add"},
            {"code": PERM_DOCUMENTS_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
    {
        "page": "reports",
        "label": "Reports",
        "permissions": [
            {"code": PERM_REPORTS_HOSPITAL, "action": "view", "label": "View"},
            {"code": PERM_REPORTS_PROVINCE, "action": "view", "label": "Province reports"},
            {"code": PERM_REPORTS_NATIONAL, "action": "view", "label": "National reports"},
        ],
    },
    {
        "page": "audit",
        "label": "Audit logs",
        "permissions": [{"code": PERM_AUDIT_VIEW, "action": "view", "label": "View"}],
    },
    {
        "page": "users",
        "label": "Users directory",
        "permissions": [
            {"code": PERM_USERS_VIEW, "action": "view", "label": "View"},
            {"code": PERM_USERS_MANAGE, "action": "create", "label": "Add"},
            {"code": PERM_USERS_MANAGE, "action": "update", "label": "Update"},
            {"code": PERM_USERS_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
    {
        "page": "settings",
        "label": "System settings",
        "permissions": [
            {"code": PERM_SETTINGS_SYSTEM, "action": "view", "label": "View"},
            {"code": PERM_SETTINGS_SYSTEM, "action": "update", "label": "Update"},
        ],
    },
    {
        "page": "website",
        "label": "Website content",
        "permissions": [
            {"code": PERM_WEBSITE_VIEW, "action": "view", "label": "View"},
            {"code": PERM_WEBSITE_MANAGE, "action": "create", "label": "Add"},
            {"code": PERM_WEBSITE_MANAGE, "action": "update", "label": "Update"},
            {"code": PERM_WEBSITE_DELETE, "action": "delete", "label": "Delete"},
        ],
    },
]

PERMISSION_LABELS = {
    PERM_DASHBOARD: "View dashboard",
    PERM_PATIENTS_VIEW: "View patients",
    PERM_PATIENTS_SEARCH: "Search patients by ID",
    PERM_PATIENTS_CREATE: "Add patients",
    PERM_PATIENTS_UPDATE: "Update patients",
    PERM_PATIENTS_VERIFY: "Verify patients",
    PERM_PATIENTS_DELETE: "Delete patients",
    PERM_INJECTIONS_VIEW: "View injections",
    PERM_INJECTIONS_ADD: "Add injections",
    PERM_INJECTIONS_UPDATE: "Update injections",
    PERM_INJECTIONS_CORRECT: "Correct injections (other centers)",
    PERM_INJECTIONS_DELETE: "Delete injections",
    PERM_TREATMENTS_VIEW: "View treatments",
    PERM_TREATMENTS_ADD: "Add treatments",
    PERM_TREATMENTS_UPDATE: "Update treatments",
    PERM_TREATMENTS_DELETE: "Delete treatments",
    PERM_HOSPITAL_STAFF_VIEW: "View hospital staff",
    PERM_HOSPITAL_STAFF_MANAGE: "Add and update hospital staff",
    PERM_HOSPITAL_STAFF_DELETE: "Delete hospital staff",
    PERM_ADMINS_VIEW: "View admin directory",
    PERM_ADMINS_MANAGE: "Add and update admins",
    PERM_ADMINS_DELETE: "Delete admins",
    PERM_PROVINCE_ADMINS_MANAGE: "Manage Province Admins",
    PERM_HOSPITALS_MANAGE: "Add and update hospitals",
    PERM_HOSPITALS_DELETE: "Delete hospitals",
    PERM_STOCK_VIEW: "View stock",
    PERM_STOCK_MANAGE: "Add and update stock",
    PERM_STOCK_DELETE: "Delete stock",
    PERM_FACTORS_VIEW: "View factor catalog",
    PERM_FACTORS_MANAGE: "Add and update factor catalog",
    PERM_FACTORS_DELETE: "Delete factor catalog",
    PERM_DOCUMENTS_ADD: "Add patient documents",
    PERM_DOCUMENTS_DELETE: "Delete patient documents",
    PERM_REPORTS_HOSPITAL: "View hospital reports",
    PERM_REPORTS_PROVINCE: "View province reports",
    PERM_REPORTS_NATIONAL: "View national reports",
    PERM_AUDIT_VIEW: "View audit logs",
    PERM_USERS_VIEW: "View users directory",
    PERM_USERS_MANAGE: "Add and update users",
    PERM_USERS_DELETE: "Delete users",
    PERM_SETTINGS_SYSTEM: "Change system settings",
    PERM_WEBSITE_VIEW: "View website content",
    PERM_WEBSITE_MANAGE: "Add and update website content",
    PERM_WEBSITE_DELETE: "Delete website content",
}

NAV_PERMISSIONS = {
    "/dashboard": PERM_DASHBOARD,
    "/dashboard/patients": PERM_PATIENTS_VIEW,
    "/dashboard/admins": PERM_ADMINS_VIEW,
    "/dashboard/hospitals": PERM_HOSPITAL_STAFF_VIEW,
    "/dashboard/hospitals/treatment-admins": PERM_HOSPITAL_STAFF_VIEW,
    "/dashboard/hospitals/center-admins": PERM_HOSPITAL_STAFF_VIEW,
    "/dashboard/stock": PERM_STOCK_VIEW,
    "/dashboard/injections": PERM_INJECTIONS_VIEW,
    "/dashboard/users": PERM_USERS_VIEW,
    "/dashboard/reports": PERM_REPORTS_HOSPITAL,
    "/dashboard/audit": PERM_AUDIT_VIEW,
    "/dashboard/settings": PERM_SETTINGS_SYSTEM,
    "/dashboard/website": PERM_WEBSITE_VIEW,
    "/dashboard/news": PERM_WEBSITE_VIEW,
    "/dashboard/events": PERM_WEBSITE_VIEW,
    "/dashboard/gallery": PERM_WEBSITE_VIEW,
    "/dashboard/resources": PERM_WEBSITE_VIEW,
}

ADMIN_ROLES = (
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PROVINCE_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.WEBSITE_MANAGER,
)


def is_read_perm(code: str) -> bool:
    if code == PERM_DASHBOARD:
        return True
    if code in (PERM_REPORTS_NATIONAL, PERM_REPORTS_PROVINCE, PERM_REPORTS_HOSPITAL):
        return True
    suffix = code.rsplit(".", 1)[-1] if "." in code else code
    return suffix in READ_SUFFIXES


def is_write_perm(code: str) -> bool:
    suffix = code.rsplit(".", 1)[-1] if "." in code else code
    return suffix in WRITE_SUFFIXES or code == PERM_SETTINGS_SYSTEM


def account_kind(user) -> str | None:
    if not user:
        return None
    role = getattr(user, "role", None)
    if role == UserRole.SUPER_ADMIN:
        return KIND_SUPER
    if role == UserRole.ADMIN:
        return KIND_ADMIN
    if role == UserRole.PROVINCE_ADMIN:
        return KIND_PROVINCE
    if role == UserRole.WEBSITE_MANAGER:
        return KIND_WEBSITE
    if role == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        if profile and profile.staff_type == HospitalStaffType.CENTER_ADMIN:
            return KIND_CENTER
        return KIND_TREATMENT
    return None


def catalog_for_kind(kind: str) -> frozenset:
    return KIND_CATALOG.get(kind, frozenset())


def default_permissions_for_kind(kind: str) -> list[str]:
    return sorted(catalog_for_kind(kind))


def is_active_admin(user) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "role", None) not in ADMIN_ROLES:
        return False
    if hasattr(user, "is_active_account") and not user.is_active_account:
        return False
    return True


def is_national_scope(user) -> bool:
    return getattr(user, "role", None) in (UserRole.SUPER_ADMIN, UserRole.ADMIN)


def default_role_permissions(user) -> set[str]:
    kind = account_kind(user)
    if kind:
        return set(catalog_for_kind(kind))
    return set(ROLE_PERMS.get(getattr(user, "role", None), ()))


def assigned_permission_codes(user) -> list[str]:
    extra = getattr(user, "extra_permissions", None) or []
    catalog = default_role_permissions(user)
    if extra:
        return sorted(catalog.intersection(extra))
    return sorted(catalog)


def permissions_for(user) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "role", None) == UserRole.PATIENT:
        return sorted(PATIENT_PERMS)
    if hasattr(user, "is_active_account") and not user.is_active_account:
        return []
    perms = set(assigned_permission_codes(user))
    if getattr(user, "view_only", False):
        perms = {code for code in perms if is_read_perm(code)}
    return sorted(perms)


def has_perm(user, permission: str) -> bool:
    return permission in permissions_for(user)


def province_id_for(user):
    if getattr(user, "role", None) == UserRole.PROVINCE_ADMIN:
        from django.core.exceptions import ObjectDoesNotExist

        try:
            return user.province_admin.province_id
        except ObjectDoesNotExist:
            return None
    if getattr(user, "role", None) == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        if profile:
            return profile.hospital.province_id
    return None


def hospital_id_for(user):
    if getattr(user, "role", None) == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        return getattr(profile, "hospital_id", None)
    return None


def nav_allowed(user) -> list[str]:
    perms = set(permissions_for(user))
    hrefs = []
    for href, need in NAV_PERMISSIONS.items():
        if need in perms:
            hrefs.append(href)
            continue
        if need == PERM_WEBSITE_VIEW and PERM_WEBSITE_MANAGE in perms:
            hrefs.append(href)
    return hrefs


def assignable_kinds(actor) -> list[str]:
    kind = account_kind(actor)
    if kind == KIND_SUPER:
        return [KIND_SUPER, KIND_ADMIN, KIND_PROVINCE, KIND_CENTER, KIND_TREATMENT, KIND_WEBSITE]
    if kind == KIND_ADMIN:
        return [KIND_ADMIN, KIND_PROVINCE, KIND_CENTER, KIND_TREATMENT, KIND_WEBSITE]
    if kind == KIND_PROVINCE:
        return [KIND_CENTER, KIND_TREATMENT]
    if kind == KIND_CENTER:
        return [KIND_TREATMENT]
    return []


def grantable_codes(actor, target_kind: str) -> set[str]:
    catalog = set(catalog_for_kind(target_kind))
    if account_kind(actor) == KIND_SUPER and not getattr(actor, "view_only", False):
        return catalog
    actor_codes = set(assigned_permission_codes(actor))
    if getattr(actor, "view_only", False):
        actor_codes = {code for code in actor_codes if is_read_perm(code)}
    return catalog.intersection(actor_codes)


def can_manage_kind(actor, target_kind: str) -> bool:
    return target_kind in assignable_kinds(actor)


def can_manage_user(actor, target) -> bool:
    if not actor or not target:
        return False
    if getattr(actor, "pk", None) == getattr(target, "pk", None):
        return False
    target_kind = account_kind(target)
    if not target_kind or not can_manage_kind(actor, target_kind):
        return False
    actor_kind = account_kind(actor)
    if actor_kind == KIND_PROVINCE:
        return province_id_for(actor) and province_id_for(actor) == province_id_for(target)
    if actor_kind == KIND_CENTER:
        return (
            target_kind == KIND_TREATMENT
            and hospital_id_for(actor)
            and hospital_id_for(actor) == hospital_id_for(target)
        )
    return True


def can_delete_user(actor, target) -> bool:
    """True when actor may permanently remove a managed admin account (not themselves)."""
    if not can_manage_user(actor, target):
        return False
    if getattr(actor, "view_only", False):
        return False
    target_kind = account_kind(target)
    if target_kind == KIND_SUPER and account_kind(actor) != KIND_SUPER:
        return False
    if target_kind in (KIND_CENTER, KIND_TREATMENT):
        return has_perm(actor, PERM_HOSPITAL_STAFF_DELETE)
    return has_perm(actor, PERM_ADMINS_DELETE)


def capabilities(user) -> dict:
    perms = permissions_for(user)
    kind = account_kind(user)
    return {
        "permissions": perms,
        "nav": nav_allowed(user),
        "viewOnly": bool(getattr(user, "view_only", False)),
        "kind": kind,
        "scope": {
            "kind": kind or (user.role if user else None),
            "provinceId": province_id_for(user) if user else None,
            "hospitalId": hospital_id_for(user) if user else None,
        },
    }
