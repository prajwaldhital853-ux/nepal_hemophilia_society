"""One-time 2FA backup / recovery codes for admin accounts."""

from __future__ import annotations

import re
import secrets
import string

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from apps.accounts.models import TotpBackupCode

BACKUP_CODE_COUNT = 3
_BACKUP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def normalize_backup_code(code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (code or "").upper())


def generate_backup_code() -> str:
    parts = ["".join(secrets.choice(_BACKUP_ALPHABET) for _ in range(4)) for _ in range(3)]
    return "-".join(parts)


def invalidate_all_backup_codes(user) -> None:
    TotpBackupCode.objects.filter(user=user).update(used_at=timezone.now())


def delete_all_backup_codes(user) -> None:
    TotpBackupCode.objects.filter(user=user).delete()


def issue_backup_codes(user) -> list[str]:
    """Replace all backup codes and return the plaintext values once."""
    delete_all_backup_codes(user)
    issued: list[str] = []
    for _ in range(BACKUP_CODE_COUNT):
        plain = generate_backup_code()
        issued.append(plain)
        TotpBackupCode.objects.create(
            user=user,
            code_hash=make_password(normalize_backup_code(plain)),
        )
    return issued


def verify_and_consume_backup_code(user, code: str) -> bool:
    normalized = normalize_backup_code(code)
    if len(normalized) != 12:
        return False
    for row in TotpBackupCode.objects.filter(user=user, used_at__isnull=True).order_by("id"):
        if check_password(normalized, row.code_hash):
            row.used_at = timezone.now()
            row.save(update_fields=["used_at"])
            return True
    return False


def consume_backup_code_for_recovery(user, code: str) -> bool:
    """Validate one backup code, then retire every remaining code in the batch."""
    if not verify_and_consume_backup_code(user, code):
        return False
    invalidate_all_backup_codes(user)
    return True


def unused_backup_code_count(user) -> int:
    return TotpBackupCode.objects.filter(user=user, used_at__isnull=True).count()
