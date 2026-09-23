from __future__ import annotations

from datetime import timedelta

from django.contrib.auth.hashers import check_password
from django.utils import timezone

PASSWORD_MAX_AGE_DAYS = int(__import__("os").getenv("PASSWORD_MAX_AGE_DAYS", "90"))
PASSWORD_HISTORY_COUNT = 5


def password_changed_reference(user):
    if getattr(user, "password_changed_at", None):
        return user.password_changed_at
    return getattr(user, "date_joined", None) or timezone.now()


def password_is_expired(user) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "must_change_password", False):
        return False
    reference = password_changed_reference(user)
    if not reference:
        return False
    return timezone.now() >= reference + timedelta(days=PASSWORD_MAX_AGE_DAYS)


def password_requires_change(user) -> bool:
    return bool(
        user
        and getattr(user, "is_authenticated", False)
        and (getattr(user, "must_change_password", False) or password_is_expired(user))
    )


def password_expires_at(user):
    reference = password_changed_reference(user)
    if not reference:
        return None
    return reference + timedelta(days=PASSWORD_MAX_AGE_DAYS)


def password_reuse_error(user, raw_password: str) -> str | None:
    if user.check_password(raw_password):
        return "New password must be different from your current password."
    from apps.accounts.models import PasswordHistory

    for entry in PasswordHistory.objects.filter(user=user).order_by("-created_at")[:PASSWORD_HISTORY_COUNT]:
        if check_password(raw_password, entry.password):
            return "New password cannot match any of your last 5 passwords."
    return None


def record_password_history(user) -> None:
    from apps.accounts.models import PasswordHistory

    if not user.password:
        return
    PasswordHistory.objects.create(user=user, password=user.password)
    stale = (
        PasswordHistory.objects.filter(user=user)
        .order_by("-created_at")
        .values_list("pk", flat=True)[PASSWORD_HISTORY_COUNT:]
    )
    if stale:
        PasswordHistory.objects.filter(pk__in=list(stale)).delete()
