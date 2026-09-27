"""JWT session validity helpers."""

from __future__ import annotations

from datetime import datetime, timezone as dt_timezone

from django.utils import timezone

from apps.accounts.models import UserRole


def session_token_stale(user, token_payload: dict) -> bool:
    """True when an admin JWT was issued before the last password rotation."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "role", None) == UserRole.PATIENT:
        return False
    rotated_at = getattr(user, "password_changed_at", None)
    if not rotated_at:
        return False
    issued_at = token_payload.get("iat")
    if not issued_at:
        return False
    issued = datetime.fromtimestamp(int(issued_at), tz=dt_timezone.utc)
    if timezone.is_naive(rotated_at):
        rotated_at = timezone.make_aware(rotated_at, dt_timezone.utc)
    return issued < rotated_at
