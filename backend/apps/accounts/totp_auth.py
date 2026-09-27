"""Admin TOTP setup and login verification endpoints."""

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.password_policy import password_is_expired
from apps.accounts.presence import mark_login
from apps.accounts.serializers import UserSerializer
from apps.accounts.totp import (
    PRE_AUTH_PURPOSE_LOGIN,
    PRE_AUTH_PURPOSE_SETUP,
    MAX_TOTP_VERIFY_ATTEMPTS,
    admin_totp_required,
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_totp_secret,
    issue_pre_auth_token,
    mark_totp_confirmed,
    provisioning_uri,
    qr_code_data_url,
    verify_pre_auth_token,
    verify_totp_code,
)
from apps.accounts.admin_tokens import issue_admin_tokens
from apps.audit.models import AuditLog
from apps.patients.views import client_ip

User = get_user_model()


def _attempt_key(pre_auth_token: str) -> str:
    return f"totp-attempts:{pre_auth_token[:48]}"


def _register_totp_failure(pre_auth_token: str) -> int:
    key = _attempt_key(pre_auth_token)
    attempts = int(cache.get(key, 0)) + 1
    cache.set(key, attempts, timeout=300)
    return attempts


def _clear_totp_attempts(pre_auth_token: str) -> None:
    cache.delete(_attempt_key(pre_auth_token))


def _login_payload(user, request):
    tokens = issue_admin_tokens(user, totp_verified=True)
    return {
        **tokens,
        "user": UserSerializer(user, context={"request": request}).data,
        "mustChangePassword": user.must_change_password or password_is_expired(user),
        "passwordExpired": password_is_expired(user),
        "accountStatus": "Pending" if user.must_change_password else "Active",
    }


def _resolve_pre_auth_user(token: str, purpose: str):
    user_id = verify_pre_auth_token(token, purpose)
    user = User.objects.filter(pk=user_id).exclude(role=UserRole.PATIENT).first()
    if not user or not user.is_active or not user.is_active_account:
        raise ValueError("Account unavailable. Sign in again.")
    return user


class TotpSetupView(APIView):
    """Generate a TOTP secret and QR code (login setup or authenticated re-enrollment)."""

    permission_classes = [AllowAny]
    allow_without_totp = True

    def post(self, request):
        pre_auth = str(request.data.get("preAuthToken") or "").strip()
        user = None
        if pre_auth:
            try:
                user = _resolve_pre_auth_user(pre_auth, PRE_AUTH_PURPOSE_SETUP)
            except ValueError as exc:
                return Response({"error": str(exc), "code": "pre_auth_invalid"}, status=400)
        elif request.user and request.user.is_authenticated:
            user = request.user
            if user.role == UserRole.PATIENT:
                return Response({"error": "Not available for patient accounts."}, status=403)
        else:
            return Response({"error": "Sign in or provide a valid setup session."}, status=401)

        secret = generate_totp_secret()
        user.totp_secret_encrypted = encrypt_totp_secret(secret)
        user.totp_enabled = False
        user.totp_confirmed_at = None
        user.save(update_fields=["totp_secret_encrypted", "totp_enabled", "totp_confirmed_at"])

        uri = provisioning_uri(user, secret)
        return Response(
            {
                "otpauthUrl": uri,
                "qrCodeDataUrl": qr_code_data_url(uri),
                "secret": secret,
                "issuer": "NHMS Admin",
            }
        )


class TotpConfirmView(APIView):
    """Confirm TOTP setup with a live 6-digit code."""

    permission_classes = [AllowAny]
    allow_without_totp = True

    def post(self, request):
        pre_auth = str(request.data.get("preAuthToken") or "").strip()
        code = str(request.data.get("code") or "").strip()
        if not code:
            return Response({"error": "Enter the 6-digit code from your authenticator app."}, status=400)

        user = None
        purpose = PRE_AUTH_PURPOSE_SETUP
        if pre_auth:
            try:
                user = _resolve_pre_auth_user(pre_auth, PRE_AUTH_PURPOSE_SETUP)
            except ValueError as exc:
                return Response({"error": str(exc), "code": "pre_auth_invalid"}, status=400)
        elif request.user and request.user.is_authenticated:
            user = request.user
            purpose = ""
        else:
            return Response({"error": "Sign in or provide a valid setup session."}, status=401)

        if not decrypt_totp_secret(user.totp_secret_encrypted):
            return Response({"error": "Start setup again to generate a new QR code."}, status=400)

        if not verify_totp_code(user, code):
            if pre_auth:
                attempts = _register_totp_failure(pre_auth)
                remaining = max(0, MAX_TOTP_VERIFY_ATTEMPTS - attempts)
                if remaining <= 0:
                    return Response(
                        {"error": "Too many failed attempts. Sign in again.", "code": "totp_locked"},
                        status=429,
                    )
                return Response(
                    {
                        "error": "Incorrect code. Check the app time and try again.",
                        "attemptsRemaining": remaining,
                        "code": "invalid_totp",
                    },
                    status=400,
                )
            return Response({"error": "Incorrect code. Try again.", "code": "invalid_totp"}, status=400)

        if pre_auth:
            _clear_totp_attempts(pre_auth)

        mark_totp_confirmed(user)
        try:
            AuditLog.objects.create(
                actor=user.get_username(),
                action="2FA enabled",
                module="Auth",
                ip=client_ip(request),
                detail="Google Authenticator setup confirmed",
            )
        except Exception:
            pass

        if pre_auth and purpose == PRE_AUTH_PURPOSE_SETUP:
            mark_login(user)
            return Response(_login_payload(user, request))

        return Response({"totpEnabled": True, "message": "Two-factor authentication is now enabled."})


class TotpVerifyLoginView(APIView):
    """Complete login after password verification with a TOTP code."""

    permission_classes = [AllowAny]
    allow_without_totp = True

    def post(self, request):
        pre_auth = str(request.data.get("preAuthToken") or "").strip()
        code = str(request.data.get("code") or "").strip()
        if not pre_auth or not code:
            return Response({"error": "Verification session and 6-digit code are required."}, status=400)

        try:
            user = _resolve_pre_auth_user(pre_auth, PRE_AUTH_PURPOSE_LOGIN)
        except ValueError as exc:
            return Response({"error": str(exc), "code": "pre_auth_invalid"}, status=400)

        if not user.totp_enabled:
            return Response({"error": "Two-factor authentication is not enabled for this account."}, status=400)

        if not verify_totp_code(user, code):
            attempts = _register_totp_failure(pre_auth)
            remaining = max(0, MAX_TOTP_VERIFY_ATTEMPTS - attempts)
            if remaining <= 0:
                return Response(
                    {"error": "Too many failed attempts. Sign in again.", "code": "totp_locked"},
                    status=429,
                )
            return Response(
                {
                    "error": "Incorrect code. Open Google Authenticator and try the current code.",
                    "attemptsRemaining": remaining,
                    "code": "invalid_totp",
                },
                status=400,
            )

        _clear_totp_attempts(pre_auth)
        mark_login(user)
        try:
            AuditLog.objects.create(
                actor=user.get_username(),
                action="Admin login (2FA)",
                module="Auth",
                ip=client_ip(request),
                detail="Signed in with authenticator code",
            )
        except Exception:
            pass
        return Response(_login_payload(user, request))


class TotpStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == UserRole.PATIENT:
            return Response({"error": "Not available."}, status=403)
        return Response(
            {
                "totpEnabled": bool(user.totp_enabled),
                "totpRequired": admin_totp_required(user),
                "confirmedAt": user.totp_confirmed_at.isoformat() if user.totp_confirmed_at else None,
            }
        )


class TotpDisableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role == UserRole.PATIENT:
            return Response({"error": "Not available."}, status=403)
        if admin_totp_required(user):
            return Response(
                {"error": "Two-factor authentication is required for all admin accounts."},
                status=403,
            )
        code = str(request.data.get("code") or "").strip()
        if not user.totp_enabled:
            return Response({"totpEnabled": False})
        if not verify_totp_code(user, code):
            return Response({"error": "Incorrect code.", "code": "invalid_totp"}, status=400)
        user.totp_secret_encrypted = ""
        user.totp_enabled = False
        user.totp_confirmed_at = None
        user.save(update_fields=["totp_secret_encrypted", "totp_enabled", "totp_confirmed_at"])
        try:
            AuditLog.objects.create(
                actor=user.get_username(),
                action="2FA disabled",
                module="Auth",
                ip=client_ip(request),
                detail="Authenticator removed from account",
            )
        except Exception:
            pass
        return Response({"totpEnabled": False, "message": "Two-factor authentication disabled."})


def build_pre_auth_login_response(user, request):
    return {
        "requires2FA": True,
        "preAuthToken": issue_pre_auth_token(user.pk, PRE_AUTH_PURPOSE_LOGIN),
        "user": UserSerializer(user, context={"request": request}).data,
        "mustChangePassword": user.must_change_password or password_is_expired(user),
        "passwordExpired": password_is_expired(user),
    }


def build_pre_auth_setup_response(user, request):
    return {
        "requires2FASetup": True,
        "preAuthToken": issue_pre_auth_token(user.pk, PRE_AUTH_PURPOSE_SETUP),
        "user": UserSerializer(user, context={"request": request}).data,
        "mustChangePassword": user.must_change_password or password_is_expired(user),
        "passwordExpired": password_is_expired(user),
    }
