"""
RBAC matrix from plan.md §5 and the project report.

Roles:
  super_admin     — entire Nepal
  province_admin  — own province only
  hospital_admin  — own hospital (Treatment Admin / Center Admin)
  patient         — own record in the patient app
"""

from apps.accounts.models import UserRole
from apps.hospitals.models import HospitalStaffType

# Permission keys used by API checks and the admin-panel drawer.
PERM_DASHBOARD = "dashboard"
PERM_PATIENTS_VIEW = "patients.view"
PERM_PATIENTS_SEARCH = "patients.search"
PERM_PATIENTS_CREATE = "patients.create"
PERM_PATIENTS_UPDATE = "patients.update"
PERM_PATIENTS_VERIFY = "patients.verify"
PERM_INJECTIONS_VIEW = "injections.view"
PERM_INJECTIONS_ADD = "injections.add"
PERM_INJECTIONS_UPDATE = "injections.update"
PERM_INJECTIONS_CORRECT = "injections.correct"
PERM_TREATMENTS_VIEW = "treatments.view"
PERM_TREATMENTS_ADD = "treatments.add"
PERM_TREATMENTS_UPDATE = "treatments.update"
PERM_HOSPITAL_STAFF_VIEW = "hospitalStaff.view"
PERM_HOSPITAL_STAFF_MANAGE = "hospitalStaff.manage"
PERM_PROVINCE_ADMINS_MANAGE = "provinceAdmins.manage"
PERM_HOSPITALS_MANAGE = "hospitals.manage"
PERM_FACTORS_VIEW = "factors.view"
PERM_FACTORS_MANAGE = "factors.manage"
PERM_AUDIT_VIEW = "audit.view"
PERM_REPORTS_NATIONAL = "reports.national"
PERM_REPORTS_PROVINCE = "reports.province"
PERM_REPORTS_HOSPITAL = "reports.hospital"
PERM_SETTINGS_SYSTEM = "settings.system"
PERM_WEBSITE_MANAGE = "website.manage"
PERM_USERS_MANAGE = "users.manage"
PERM_STOCK_VIEW = "stock.view"
PERM_ADMINS_VIEW = "admins.view"

SUPER_PERMS = frozenset(
    {
        PERM_DASHBOARD,
        PERM_PATIENTS_VIEW,
        PERM_PATIENTS_SEARCH,
        PERM_PATIENTS_CREATE,
        PERM_PATIENTS_UPDATE,
        PERM_PATIENTS_VERIFY,
        PERM_INJECTIONS_VIEW,
        PERM_INJECTIONS_ADD,
        PERM_INJECTIONS_UPDATE,
        PERM_INJECTIONS_CORRECT,
        PERM_TREATMENTS_VIEW,
        PERM_TREATMENTS_ADD,
        PERM_TREATMENTS_UPDATE,
        PERM_HOSPITAL_STAFF_VIEW,
        PERM_HOSPITAL_STAFF_MANAGE,
        PERM_PROVINCE_ADMINS_MANAGE,
        PERM_HOSPITALS_MANAGE,
        PERM_FACTORS_VIEW,
        PERM_FACTORS_MANAGE,
        PERM_AUDIT_VIEW,
        PERM_REPORTS_NATIONAL,
        PERM_REPORTS_PROVINCE,
        PERM_REPORTS_HOSPITAL,
        PERM_SETTINGS_SYSTEM,
        PERM_WEBSITE_MANAGE,
        PERM_USERS_MANAGE,
        PERM_STOCK_VIEW,
        PERM_ADMINS_VIEW,
    }
)

PROVINCE_PERMS = frozenset(
    {
        PERM_DASHBOARD,
        PERM_PATIENTS_VIEW,
        PERM_PATIENTS_SEARCH,
        PERM_PATIENTS_CREATE,
        PERM_PATIENTS_UPDATE,
        PERM_PATIENTS_VERIFY,
        PERM_INJECTIONS_VIEW,
        PERM_TREATMENTS_VIEW,
        PERM_HOSPITAL_STAFF_VIEW,
        PERM_HOSPITAL_STAFF_MANAGE,
        PERM_HOSPITALS_MANAGE,
        PERM_FACTORS_VIEW,
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
        PERM_TREATMENTS_VIEW,
        PERM_TREATMENTS_ADD,
        PERM_TREATMENTS_UPDATE,
        PERM_HOSPITAL_STAFF_VIEW,
        PERM_FACTORS_VIEW,
        PERM_REPORTS_HOSPITAL,
    }
)

CENTER_ADMIN_EXTRA = frozenset({PERM_HOSPITAL_STAFF_MANAGE})

PATIENT_PERMS = frozenset(
    {
        "patient.profile",
        "patient.history",
        "patient.notifications",
    }
)

ROLE_PERMS = {
    UserRole.SUPER_ADMIN: SUPER_PERMS,
    UserRole.PROVINCE_ADMIN: PROVINCE_PERMS,
    UserRole.HOSPITAL_ADMIN: HOSPITAL_PERMS,
    UserRole.PATIENT: PATIENT_PERMS,
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
    "/dashboard/users": PERM_USERS_MANAGE,
    "/dashboard/reports": PERM_REPORTS_HOSPITAL,
    "/dashboard/audit": PERM_AUDIT_VIEW,
    "/dashboard/settings": PERM_SETTINGS_SYSTEM,
    "/dashboard/website": PERM_WEBSITE_MANAGE,
    "/dashboard/news": PERM_WEBSITE_MANAGE,
    "/dashboard/events": PERM_WEBSITE_MANAGE,
    "/dashboard/gallery": PERM_WEBSITE_MANAGE,
    "/dashboard/resources": PERM_WEBSITE_MANAGE,
}


def is_active_admin(user) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "role", None) not in (
        UserRole.SUPER_ADMIN,
        UserRole.PROVINCE_ADMIN,
        UserRole.HOSPITAL_ADMIN,
    ):
        return False
    if hasattr(user, "is_active_account") and not user.is_active_account:
        return False
    return True


def permissions_for(user) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if hasattr(user, "is_active_account") and not user.is_active_account and user.role != UserRole.PATIENT:
        return []
    perms = set(ROLE_PERMS.get(user.role, ()))
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        if profile and profile.staff_type == HospitalStaffType.CENTER_ADMIN:
            perms |= CENTER_ADMIN_EXTRA
    return sorted(perms)


def has_perm(user, permission: str) -> bool:
    return permission in permissions_for(user)


def province_id_for(user):
    if user.role == UserRole.PROVINCE_ADMIN:
        profile = getattr(user, "province_admin", None)
        return getattr(profile, "province_id", None)
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        if profile:
            return profile.hospital.province_id
    return None


def hospital_id_for(user):
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        return getattr(profile, "hospital_id", None)
    return None


def nav_allowed(user) -> list[str]:
    perms = set(permissions_for(user))
    return [href for href, need in NAV_PERMISSIONS.items() if need in perms]


def capabilities(user) -> dict:
    perms = permissions_for(user)
    return {
        "permissions": perms,
        "nav": nav_allowed(user),
        "scope": {
            "kind": user.role if user else None,
            "provinceId": province_id_for(user) if user else None,
            "hospitalId": hospital_id_for(user) if user else None,
        },
    }
