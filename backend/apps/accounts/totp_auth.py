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
    PRE_AUTH_PURPOSE_RECOVER,
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
from apps.accounts.totp_backup import consume_backup_code_for_recovery, issue_backup_codes
from apps.accounts.admin_tokens import issue_admin_tokens
from apps.audit.models import AuditLog
from apps.patients.views import client_ip

User = get_user_model()

_SETUP_PURPOSES = {PRE_AUTH_PURPOSE_SETUP, PRE_AUTH_PURPOSE_RECOVER}


def _attempt_key(pre_auth_token: str) -> str:
    return f"totp-attempts:{pre_auth_token[:48]}"


def _register_totp_failure(pre_auth_token: str) -> int:
    key = _attempt_key(pre_auth_token)
    attempts = int(cache.get(key, 0)) + 1
    cache.set(key, attempts, timeout=300)
    return attempts


def _clear_totp_attempts(pre_auth_token: str) -> None:
    cache.delete(_attempt_key(pre_auth_token))


def _login_payload(user, request, *, backup_codes: list[str] | None = None):
    payload = {
        **issue_admin_tokens(user, totp_verified=True),
        "user": UserSerializer(user, context={"request": request}).data,
        "mustChangePassword": user.must_change_password or password_is_expired(user),
        "passwordExpired": password_is_expired(user),
        "accountStatus": "Pending" if user.must_change_password else "Active",
    }
    if backup_codes:
        payload["backupCodes"] = backup_codes
    return payload


def _resolve_pre_auth_user(token: str, purpose: str):
    user_id = verify_pre_auth_token(token, purpose)
    user = User.objects.filter(pk=user_id).exclude(role=UserRole.PATIENT).first()
    if not user or not user.is_active or not user.is_active_account:
        raise ValueError("Account unavailable. Sign in again.")
    return user


def _resolve_setup_pre_auth_user(token: str):
    for purpose in _SETUP_PURPOSES:
        try:
            return _resolve_pre_auth_user(token, purpose), purpose
        except ValueError:
            continue
    raise ValueError("Invalid verification session. Sign in again.")


def _begin_totp_enrollment(user) -> None:
    secret = generate_totp_secret()
    user.totp_secret_encrypted = encrypt_totp_secret(secret)
    user.totp_enabled = False
    user.totp_confirmed_at = None
    user.save(update_fields=["totp_secret_encrypted", "totp_enabled", "totp_confirmed_at"])


def _setup_response(user):
    secret = decrypt_totp_secret(user.totp_secret_encrypted)
    uri = provisioning_uri(user, secret)
    return {
        "otpauthUrl": uri,
        "qrCodeDataUrl": qr_code_data_url(uri),
        "secret": secret,
        "issuer": "NHMS Admin",
    }


class TotpSetupView(APIView):
    """Generate a TOTP secret and QR code (login setup or authenticated re-enrollment)."""

    permission_classes = [AllowAny]
    allow_without_totp = True

    def post(self, request):
        pre_auth = str(request.data.get("preAuthToken") or "").strip()
        user = None
        if pre_auth:
            try:
                user, _purpose = _resolve_setup_pre_auth_user(pre_auth)
            except ValueError as exc:
                return Response({"error": str(exc), "code": "pre_auth_invalid"}, status=400)
        elif request.user and request.user.is_authenticated:
            user = request.user
            if user.role == UserRole.PATIENT:
                return Response({"error": "Not available for patient accounts."}, status=403)
        else:
            return Response({"error": "Sign in or provide a valid setup session."}, status=401)

        if not decrypt_totp_secret(user.totp_secret_encrypted):
            _begin_totp_enrollment(user)
        return Response(_setup_response(user))


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
        purpose = ""
        if pre_auth:
            try:
                user, purpose = _resolve_setup_pre_auth_user(pre_auth)
            except ValueError as exc:
                return Response({"error": str(exc), "code": "pre_auth_invalid"}, status=400)
        elif request.user and request.user.is_authenticated:
            user = request.user
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

        is_first_issue = not user.totp_backup_issued
        is_recovery = purpose == PRE_AUTH_PURPOSE_RECOVER
        mark_totp_confirmed(user)

        backup_codes: list[str] = []
        if is_first_issue:
            backup_codes = issue_backup_codes(user)
            user.totp_backup_issued = True
            user.save(update_fields=["totp_backup_issued"])
            audit_detail = "Google Authenticator setup confirmed; backup codes issued"
        elif is_recovery:
            backup_codes = issue_backup_codes(user)
            audit_detail = "Authenticator reset with backup code; new backup codes issued"
        else:
            audit_detail = "Google Authenticator setup confirmed"

        try:
            AuditLog.objects.create(
                actor=user.get_username(),
                action="2FA enabled" if is_first_issue else "2FA reset",
                module="Auth",
                ip=client_ip(request),
                detail=audit_detail,
            )
        except Exception:
            pass

        if pre_auth and purpose in _SETUP_PURPOSES:
            mark_login(user)
            return Response(_login_payload(user, request, backup_codes=backup_codes or None))

        return Response({"totpEnabled": True, "message": "Two-factor authentication is now enabled."})


class TotpRecoverView(APIView):
    """Use a one-time backup code to replace a lost authenticator."""

    permission_classes = [AllowAny]
    allow_without_totp = True

    def post(self, request):
        pre_auth = str(request.data.get("preAuthToken") or "").strip()
        backup_code = str(request.data.get("backupCode") or "").strip()
        if not pre_auth or not backup_code:
            return Response({"error": "Sign-in session and backup code are required."}, status=400)

        try:
            user = _resolve_pre_auth_user(pre_auth, PRE_AUTH_PURPOSE_LOGIN)
        except ValueError as exc:
            return Response({"error": str(exc), "code": "pre_auth_invalid"}, status=400)

        if not user.totp_enabled:
            return Response({"error": "Two-factor authentication is not enabled for this account."}, status=400)

        if not consume_backup_code_for_recovery(user, backup_code):
            attempts = _register_totp_failure(pre_auth)
            remaining = max(0, MAX_TOTP_VERIFY_ATTEMPTS - attempts)
            if remaining <= 0:
                return Response(
                    {"error": "Too many failed attempts. Sign in again.", "code": "totp_locked"},
                    status=429,
                )
            return Response(
                {
                    "error": "Incorrect backup code.",
                    "attemptsRemaining": remaining,
                    "code": "invalid_backup_code",
                },
                status=400,
            )

        _clear_totp_attempts(pre_auth)
        _begin_totp_enrollment(user)
        recover_token = issue_pre_auth_token(user.pk, PRE_AUTH_PURPOSE_RECOVER)
        try:
            AuditLog.objects.create(
                actor=user.get_username(),
                action="2FA recovery started",
                module="Auth",
                ip=client_ip(request),
                detail="Backup code accepted; authenticator re-enrollment required",
            )
        except Exception:
            pass
        return Response(
            {
                "preAuthToken": recover_token,
                "message": "Backup code accepted. Scan the new QR code in your authenticator app.",
                **_setup_response(user),
            }
        )


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
        from apps.accounts.totp_backup import unused_backup_code_count

        return Response(
            {
                "totpEnabled": bool(user.totp_enabled),
                "totpRequired": admin_totp_required(user),
                "confirmedAt": user.totp_confirmed_at.isoformat() if user.totp_confirmed_at else None,
                "backupCodesRemaining": unused_backup_code_count(user),
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
        user.totp_backup_issued = False
        user.save(update_fields=["totp_secret_encrypted", "totp_enabled", "totp_confirmed_at", "totp_backup_issued"])
        from apps.accounts.totp_backup import delete_all_backup_codes

        delete_all_backup_codes(user)
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
