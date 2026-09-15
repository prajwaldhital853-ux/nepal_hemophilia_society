from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.rbac import PERM_HOSPITAL_STAFF_MANAGE, PERM_HOSPITAL_STAFF_VIEW, has_perm
from apps.accounts.permissions import admin_must_set_password


class CanManageHospitalStaff(BasePermission):
    """Super / province admins manage staff; center admins write; treatment admins read own."""

    message = "You do not have permission to manage hospital staff."

    def has_permission(self, request, view):
        if admin_must_set_password(request.user, view):
            self.message = "You must set a new password before using the admin panel."
            return False
        if request.method in SAFE_METHODS:
            return has_perm(request.user, PERM_HOSPITAL_STAFF_VIEW)
        return has_perm(request.user, PERM_HOSPITAL_STAFF_MANAGE)
