from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import UserRole
from apps.accounts.rbac import (
    ADMIN_ROLES,
    PERM_AUDIT_VIEW,
    PERM_FACTORS_MANAGE,
    PERM_HOSPITALS_MANAGE,
    PERM_HOSPITAL_STAFF_MANAGE,
    PERM_HOSPITAL_STAFF_VIEW,
    PERM_INJECTIONS_ADD,
    PERM_INJECTIONS_CORRECT,
    PERM_INJECTIONS_UPDATE,
    PERM_INJECTIONS_VIEW,
    PERM_PATIENTS_CREATE,
    PERM_PATIENTS_DELETE,
    PERM_PATIENTS_UPDATE,
    PERM_PATIENTS_VERIFY,
    PERM_PATIENTS_VIEW,
    PERM_PROVINCE_ADMINS_MANAGE,
    PERM_STOCK_MANAGE,
    PERM_STOCK_VIEW,
    PERM_DOCUMENTS_ADD,
    PERM_TREATMENTS_ADD,
    PERM_TREATMENTS_VIEW,
    PERM_USERS_VIEW,
    has_perm,
    is_active_admin,
    is_national_scope,
)

__all__ = ["ADMIN_ROLES"]


def admin_must_set_password(user, view=None) -> bool:
    """True when an admin is still on the temporary password and this view is not the change-password exception."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "role", None) not in ADMIN_ROLES:
        return False
    if not getattr(user, "must_change_password", False):
        return False
    return not getattr(view, "allow_must_change_password", False)


class IsAdminRole(BasePermission):
    """Hospital, province, national, website, or super admins — patients cannot use admin APIs."""

    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        if not is_active_admin(request.user):
            return False
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        return True


class IsSuperAdmin(BasePermission):
    message = "Super admin access required."

    def has_permission(self, request, view):
        if not (is_active_admin(request.user) and request.user.role == UserRole.SUPER_ADMIN):
            return False
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        return True


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
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        needed = getattr(view, "required_permission", None) or self.permission
        if not needed:
            return is_active_admin(request.user)
        return has_perm(request.user, needed)


class CanViewPatients(HasPermission):
    permission = PERM_PATIENTS_VIEW
    message = "You cannot view patient records."


class CanCreatePatients(HasPermission):
    permission = PERM_PATIENTS_CREATE
    message = "Only Super Admin, Admin, or Province Admin can create patients."


class CanUpdatePatients(BasePermission):
    message = "You cannot edit this patient profile."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        user = request.user
        if not is_active_admin(user):
            return False
        if is_national_scope(user):
            return has_perm(user, PERM_PATIENTS_UPDATE)
        if user.role in (UserRole.HOSPITAL_ADMIN, UserRole.PROVINCE_ADMIN):
            return has_perm(user, PERM_PATIENTS_VIEW)
        return False

    def has_object_permission(self, request, view, obj):
        from apps.core.clinical import can_edit_patient

        return can_edit_patient(request.user, obj)


class CanVerifyPatients(HasPermission):
    permission = PERM_PATIENTS_VERIFY
    message = "Only Super Admin, Admin, or Province Admin can verify patients."


class CanDeletePatients(BasePermission):
    message = "You cannot delete this patient record."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        user = request.user
        if not is_active_admin(user):
            return False
        if is_national_scope(user):
            return has_perm(user, PERM_PATIENTS_DELETE)
        if user.role in (UserRole.HOSPITAL_ADMIN, UserRole.PROVINCE_ADMIN):
            return has_perm(user, PERM_PATIENTS_VIEW)
        return False

    def has_object_permission(self, request, view, obj):
        from apps.core.clinical import can_delete_patient

        return can_delete_patient(request.user, obj)


class CanViewClinical(HasPermission):
    permission = PERM_INJECTIONS_VIEW
    message = "You cannot view clinical records."


class CanViewTreatments(HasPermission):
    permission = PERM_TREATMENTS_VIEW
    message = "You cannot view treatment records."


class CanViewPatientClinicalHistory(BasePermission):
    """Patient timeline/history — requires at least injections or treatments view."""

    message = "You cannot view clinical history."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        return has_perm(request.user, PERM_INJECTIONS_VIEW) or has_perm(request.user, PERM_TREATMENTS_VIEW)


class CanUpdateInjections(HasPermission):
    permission = PERM_INJECTIONS_UPDATE
    message = "You cannot update injection records."


class CanAddInjections(BasePermission):
    message = "You cannot add injection records."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        from apps.core.clinical import can_add_clinical_record

        return can_add_clinical_record(request.user)


class CanAddTreatments(BasePermission):
    message = "You cannot add treatment records."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        from apps.core.clinical import can_add_clinical_record

        return can_add_clinical_record(request.user)


class CanCorrectInjections(HasPermission):
    permission = PERM_INJECTIONS_CORRECT
    message = "Only Super Admin can correct records from another hospital."


class CanManageFactors(HasPermission):
    permission = PERM_FACTORS_MANAGE
    message = "Only Super Admin can manage the factor catalog."


class CanViewAudit(HasPermission):
    permission = PERM_AUDIT_VIEW
    message = "Only Super Admin can view audit logs."


class CanViewUsers(HasPermission):
    permission = PERM_USERS_VIEW
    message = "You cannot view the users directory."


class CanManageHospitals(HasPermission):
    permission = PERM_HOSPITALS_MANAGE
    message = "You cannot manage hospitals."


class CanManageProvinceAdmins(HasPermission):
    permission = PERM_PROVINCE_ADMINS_MANAGE
    message = "Only Super Admin or Admin can manage Province Admins."


class CanViewHospitalStaff(HasPermission):
    permission = PERM_HOSPITAL_STAFF_VIEW


class CanWriteHospitalStaff(BasePermission):
    message = "You do not have permission to manage hospital staff."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        if request.method in SAFE_METHODS:
            return has_perm(request.user, PERM_HOSPITAL_STAFF_VIEW)
        return has_perm(request.user, PERM_HOSPITAL_STAFF_MANAGE)


class CanAddDocuments(BasePermission):
    message = "You cannot add patient documents."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        from apps.core.clinical import can_add_clinical_record

        return can_add_clinical_record(request.user)


class CanViewStock(HasPermission):
    permission = PERM_STOCK_VIEW
    message = "You cannot view stock."


class CanManageStock(HasPermission):
    permission = PERM_STOCK_MANAGE
    message = "You cannot add or adjust stock."
