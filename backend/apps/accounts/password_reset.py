from __future__ import annotations

import secrets
import string
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from apps.accounts.models import UserRole

User = get_user_model()

OTP_TTL_MINUTES = 5
RESET_TOKEN_TTL_MINUTES = 15
MAX_VERIFY_ATTEMPTS = 5
MAX_OTP_REQUESTS_PER_HOUR = 5


def generate_reset_otp() -> str:
    alphabet = string.ascii_letters + string.digits
    body = "".join(secrets.choice(alphabet) for _ in range(6))
    return f"{body}#"


def find_admin_by_email(email: str):
    ident = (email or "").strip()
    if not ident:
        return None
    return (
        User.objects.filter(email__iexact=ident, is_active=True, is_active_account=True)
        .exclude(role=UserRole.PATIENT)
        .exclude(email="")
        .first()
    )


def otp_requests_in_last_hour(email: str) -> int:
    from apps.accounts.models import AdminPasswordResetOTP

    since = timezone.now() - timedelta(hours=1)
    return AdminPasswordResetOTP.objects.filter(email__iexact=email.strip(), created_at__gte=since).count()


def invalidate_pending_otps(user) -> None:
    from apps.accounts.models import AdminPasswordResetOTP

    AdminPasswordResetOTP.objects.filter(user=user, consumed_at__isnull=True).update(consumed_at=timezone.now())


def create_password_reset_otp(user, email: str, ip: str | None = None):
    from apps.accounts.models import AdminPasswordResetOTP

    invalidate_pending_otps(user)
    raw_otp = generate_reset_otp()
    row = AdminPasswordResetOTP.objects.create(
        user=user,
        email=email.strip().lower(),
        otp_hash=make_password(raw_otp),
        expires_at=timezone.now() + timedelta(minutes=OTP_TTL_MINUTES),
        ip=ip,
    )
    return row, raw_otp


def send_reset_otp_email(user, email: str, otp: str) -> None:
    subject = "NHMS Admin password reset code"
    body = (
        f"Hello {user.get_full_name() or user.get_username()},\n\n"
        f"Your Nepal Hemophilia Digital Management System admin password reset code is:\n\n"
        f"  {otp}\n\n"
        f"This code expires in {OTP_TTL_MINUTES} minutes. If you did not request this, ignore this email.\n\n"
        f"— NHMS Admin"
    )
    send_mail(
        subject,
        body,
        getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@nhms.local"),
        [email],
        fail_silently=False,
    )


def verify_reset_otp(email: str, otp: str):
    from apps.accounts.models import AdminPasswordResetOTP

    ident = (email or "").strip().lower()
    code = (otp or "").strip()
    if not ident or not code:
        return None, "Email and verification code are required."

    row = (
        AdminPasswordResetOTP.objects.select_related("user")
        .filter(email__iexact=ident, consumed_at__isnull=True, verified_at__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if not row:
        return None, "Invalid or expired verification code."

    if row.expires_at < timezone.now():
        return None, "This verification code has expired. Request a new one."

    if row.attempts >= MAX_VERIFY_ATTEMPTS:
        return None, "Too many incorrect attempts. Request a new code."

    if not check_password(code, row.otp_hash):
        row.attempts += 1
        row.save(update_fields=["attempts"])
        remaining = max(0, MAX_VERIFY_ATTEMPTS - row.attempts)
        if remaining == 0:
            return None, "Too many incorrect attempts. Request a new code."
        return None, f"Incorrect verification code. {remaining} attempt(s) left."

    row.verified_at = timezone.now()
    row.reset_token = secrets.token_urlsafe(32)
    row.save(update_fields=["verified_at", "reset_token"])
    return row, None


def consume_reset_token(reset_token: str):
    from apps.accounts.models import AdminPasswordResetOTP

    token = (reset_token or "").strip()
    if not token:
        return None, "Reset token is required."

    row = (
        AdminPasswordResetOTP.objects.select_related("user")
        .filter(reset_token=token, consumed_at__isnull=True, verified_at__isnull=False)
        .first()
    )
    if not row:
        return None, "This reset link is invalid or has already been used."

    deadline = row.verified_at + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)
    if timezone.now() > deadline:
        return None, "This reset session has expired. Request a new verification code."

    return row, None
