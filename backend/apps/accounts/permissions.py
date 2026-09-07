from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import UserRole
from apps.accounts.rbac import (
    PERM_AUDIT_VIEW,
    PERM_FACTORS_MANAGE,
    PERM_HOSPITALS_MANAGE,
    PERM_HOSPITAL_STAFF_MANAGE,
    PERM_HOSPITAL_STAFF_VIEW,
    PERM_INJECTIONS_ADD,
    PERM_INJECTIONS_CORRECT,
    PERM_INJECTIONS_VIEW,
    PERM_PATIENTS_CREATE,
    PERM_PATIENTS_UPDATE,
    PERM_PATIENTS_VERIFY,
    PERM_PATIENTS_VIEW,
    PERM_PROVINCE_ADMINS_MANAGE,
    PERM_TREATMENTS_ADD,
    PERM_TREATMENTS_VIEW,
    has_perm,
    is_active_admin,
)

ADMIN_ROLES = (UserRole.SUPER_ADMIN, UserRole.PROVINCE_ADMIN, UserRole.HOSPITAL_ADMIN)


class IsAdminRole(BasePermission):
    """Hospital, province, or super admins — patients cannot use admin APIs."""

    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return is_active_admin(request.user)


class IsSuperAdmin(BasePermission):
    message = "Super admin access required."

    def has_permission(self, request, view):
        return is_active_admin(request.user) and request.user.role == UserRole.SUPER_ADMIN


class IsPatientRole(BasePermission):
    message = "Patient account required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == UserRole.PATIENT)


class PatientPasswordUsable(BasePermission):
    """Block patient APIs until the temporary password is replaced."""

    message = "You must set a new password before using the app."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "role", None) != UserRole.PATIENT:
            return True
        return not getattr(user, "must_change_password", False)


class HasPermission(BasePermission):
    permission = ""
    message = "You do not have permission for this action."

    def has_permission(self, request, view):
        needed = getattr(view, "required_permission", None) or self.permission
        if not needed:
            return is_active_admin(request.user)
        return has_perm(request.user, needed)


class CanViewPatients(HasPermission):
    permission = PERM_PATIENTS_VIEW
    message = "You cannot view patient records."


class CanCreatePatients(HasPermission):
    permission = PERM_PATIENTS_CREATE
    message = "Only Super Admin or Province Admin can create patients."


class CanUpdatePatients(HasPermission):
    permission = PERM_PATIENTS_UPDATE
    message = "Hospital staff cannot edit the patient registry. Ask Super or Province Admin."


class CanVerifyPatients(HasPermission):
    permission = PERM_PATIENTS_VERIFY
    message = "Only Super Admin or Province Admin can verify patients."


class CanViewClinical(HasPermission):
    permission = PERM_INJECTIONS_VIEW
    message = "You cannot view clinical records."


class CanAddInjections(HasPermission):
    permission = PERM_INJECTIONS_ADD
    message = "Province Admin can monitor injections but cannot add them (plan.md §5.5)."


class CanAddTreatments(HasPermission):
    permission = PERM_TREATMENTS_ADD
    message = "Province Admin can monitor treatments but cannot add them (plan.md §5.5)."


class CanCorrectInjections(HasPermission):
    permission = PERM_INJECTIONS_CORRECT
    message = "Only Super Admin can correct records from another hospital."


class CanManageFactors(HasPermission):
    permission = PERM_FACTORS_MANAGE
    message = "Only Super Admin can manage the factor catalog."


class CanViewAudit(HasPermission):
    permission = PERM_AUDIT_VIEW
    message = "Only Super Admin can view audit logs."


class CanManageHospitals(HasPermission):
    permission = PERM_HOSPITALS_MANAGE
    message = "You cannot manage hospitals."


class CanManageProvinceAdmins(HasPermission):
    permission = PERM_PROVINCE_ADMINS_MANAGE
    message = "Only Super Admin can manage Province Admins."


class CanViewHospitalStaff(HasPermission):
    permission = PERM_HOSPITAL_STAFF_VIEW


class CanWriteHospitalStaff(BasePermission):
    message = "You do not have permission to manage hospital staff."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, PERM_HOSPITAL_STAFF_VIEW)
        return has_perm(request.user, PERM_HOSPITAL_STAFF_MANAGE)
