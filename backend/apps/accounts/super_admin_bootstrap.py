"""Create or reset the primary NHMS super-admin login."""

from __future__ import annotations

import os

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import TotpBackupCode, UserRole

SUPER_ADMIN_USERNAME = "SUPERADMIN"
LEGACY_SUPER_ADMIN_USERNAMES = ("superadmin", "super", "Superadmin", "SuperAdmin")
DEFAULT_SUPER_ADMIN_TEMP_PASSWORD = "NhmsTemp#2026"
SUPER_ADMIN_EMAIL = "superadmin@hemophilia.org.np"


def super_admin_temp_password() -> str:
    return os.getenv("SUPER_ADMIN_TEMP_PASSWORD", DEFAULT_SUPER_ADMIN_TEMP_PASSWORD).strip()


def ensure_super_admin(*, reset_password: bool = True, reset_2fa: bool = True):
    """
    Ensure SUPERADMIN exists with super_admin role and full flags.

    Returns (user, temp_password, provisioned) where provisioned is True when
    the account was newly created or renamed from a legacy super-admin username.
    """
    User = get_user_model()
    temp_password = super_admin_temp_password()
    provisioned = False

    with transaction.atomic():
        user = User.objects.filter(username=SUPER_ADMIN_USERNAME).first()
        legacy = (
            User.objects.filter(username__in=LEGACY_SUPER_ADMIN_USERNAMES)
            .exclude(pk=getattr(user, "pk", None))
            .order_by("id")
            .first()
        )

        if not user and legacy:
            user = legacy
            user.username = SUPER_ADMIN_USERNAME
            provisioned = True
        elif not user:
            user = User(
                username=SUPER_ADMIN_USERNAME,
                email=SUPER_ADMIN_EMAIL,
                first_name="Super",
                last_name="Admin",
                staff_id="SADM-00001",
            )
            provisioned = True

        if legacy and user.pk and legacy.pk != user.pk:
            legacy.is_active = False
            legacy.is_active_account = False
            legacy.save(update_fields=["is_active", "is_active_account"])

        user.email = user.email or SUPER_ADMIN_EMAIL
        user.role = UserRole.SUPER_ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.is_active_account = True
        user.staff_id = user.staff_id or "SADM-00001"
        user.view_only = False
        user.extra_permissions = []

        if reset_password:
            user.set_password(temp_password)
            user.must_change_password = False
            user.password_changed_at = None

        if reset_2fa:
            user.totp_secret_encrypted = ""
            user.totp_enabled = False
            user.totp_confirmed_at = None
            user.totp_backup_issued = False

        user.save()

        if reset_2fa and user.pk:
            TotpBackupCode.objects.filter(user=user).delete()

    return user, temp_password, provisioned
