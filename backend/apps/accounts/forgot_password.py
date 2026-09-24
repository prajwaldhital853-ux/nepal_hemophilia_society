from django.contrib.auth import password_validation
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.password_policy import password_reuse_error, record_password_history
from apps.accounts.password_reset import (
    MAX_OTP_REQUESTS_PER_HOUR,
    consume_reset_token,
    create_password_reset_otp,
    find_admin_by_email,
    otp_requests_in_last_hour,
    send_reset_otp_email,
    verify_reset_otp,
)
from apps.audit.models import AuditLog
from apps.patients.views import client_ip


def _audit_password_event(user, action: str, detail: str, request):
    AuditLog.objects.create(
        actor=user.get_username(),
        action=action,
        module="Auth",
        object_id=str(user.pk),
        ip=client_ip(request),
        detail=detail,
    )


def _format_when():
    return timezone.localtime().strftime("%d %b %Y at %H:%M")


class AdminForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email") or "").strip()
        if not email:
            return Response({"error": "Email is required."}, status=400)

        user = find_admin_by_email(email)
        if not user:
            return Response(
                {"error": "No admin account is registered with this email.", "otpSent": False},
                status=404,
            )

        if otp_requests_in_last_hour(email) >= MAX_OTP_REQUESTS_PER_HOUR:
            return Response(
                {"error": "Too many reset requests. Try again in about an hour.", "otpSent": False},
                status=429,
            )

        try:
            _, raw_otp = create_password_reset_otp(user, email, client_ip(request))
            from apps.core.jobs import run_with_timeout

            run_with_timeout(lambda: send_reset_otp_email(user, email, raw_otp), timeout=8)
            _audit_password_event(
                user,
                "Password reset OTP sent",
                f"OTP emailed to {email.lower()} on {_format_when()}",
                request,
            )
        except Exception:
            return Response({"error": "Could not send verification email. Try again later.", "otpSent": False}, status=503)

        return Response(
            {
                "message": "A verification code has been sent to your email. It expires in 5 minutes.",
                "otpSent": True,
            }
        )


class AdminVerifyResetOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email") or "").strip()
        otp = str(request.data.get("otp") or "").strip()
        row, error = verify_reset_otp(email, otp)
        if error:
            return Response({"error": error}, status=400)
        return Response(
            {
                "resetToken": row.reset_token,
                "message": "Verification successful. You can now set a new password.",
            }
        )


class AdminResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        reset_token = str(request.data.get("resetToken") or "").strip()
        new_password = str(request.data.get("newPassword") or "").strip()
        confirm = str(request.data.get("confirmPassword") or "").strip()

        if not new_password or not confirm:
            return Response({"error": "New password and confirmation are required."}, status=400)
        if new_password != confirm:
            return Response({"error": "New passwords do not match."}, status=400)

        row, error = consume_reset_token(reset_token)
        if error:
            return Response({"error": error}, status=400)

        user = row.user
        reuse = password_reuse_error(user, new_password)
        if reuse:
            return Response({"error": reuse}, status=400)

        try:
            password_validation.validate_password(new_password, user)
        except Exception as exc:
            messages = getattr(exc, "messages", [str(exc)])
            return Response({"error": " ".join(messages)}, status=400)

        record_password_history(user)
        user.set_password(new_password)
        user.must_change_password = False
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "must_change_password", "password_changed_at"])

        row.consumed_at = timezone.now()
        row.save(update_fields=["consumed_at"])

        when = _format_when()
        _audit_password_event(
            user,
            "Admin password reset",
            f"Password reset via email OTP on {when}",
            request,
        )

        return Response({"message": "Password updated. Sign in with your new password.", "changedAt": when})
