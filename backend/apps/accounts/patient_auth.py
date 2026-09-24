from datetime import timedelta
import os

from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.device_fingerprint import resolve_device_id
from apps.accounts.device_lock import (
    MAX_FAILED_ATTEMPTS,
    is_device_locked,
    lockout_payload,
    register_failure,
    register_success,
)
from apps.accounts.throttles import DeviceLoginThrottle
from apps.accounts.models import UserRole
from apps.accounts.password_policy import password_expires_at, password_is_expired, password_reuse_error, record_password_history
from apps.accounts.permissions import IsPatientRole
from apps.accounts.presence import mark_login
from apps.accounts.serializers import UserSerializer
from apps.patients.models import Patient

User = get_user_model()
GENERIC_LOGIN_ERROR = "Invalid patient ID/email or password."


def find_patient_user(identifier: str):
    ident = (identifier or "").strip()
    if not ident:
        return None
    if ident.upper().startswith("HEM-"):
        normalized = ident.upper().replace(" ", "")
        return User.objects.filter(username__iexact=normalized, role=UserRole.PATIENT).first()
    return User.objects.filter(email__iexact=ident.lower(), role=UserRole.PATIENT).first()


def issue_patient_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["username"] = user.username
    refresh["must_change_password"] = user.must_change_password
    refresh.set_exp(lifetime=timedelta(days=int(os.getenv("JWT_PATIENT_REFRESH_DAYS", "30"))))
    access = refresh.access_token
    access["role"] = user.role
    access["username"] = user.username
    access["must_change_password"] = user.must_change_password
    access.set_exp(lifetime=timedelta(days=int(os.getenv("JWT_PATIENT_ACCESS_DAYS", "7"))))
    patient = getattr(user, "patient_profile", None)
    requires_change = user.must_change_password or password_is_expired(user)
    return {
        "access": str(access),
        "refresh": str(refresh),
        "mustChangePassword": requires_change,
        "passwordExpired": password_is_expired(user),
        "user": UserSerializer(user).data,
        "patientId": patient.unique_patient_id if patient else user.username,
    }


class PatientLoginThrottle(ScopedRateThrottle):
    scope = "patient_login"


class PatientLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [DeviceLoginThrottle, PatientLoginThrottle]

    def post(self, request):
        identifier = str(request.data.get("identifier") or request.data.get("username") or "").strip()
        password = str(request.data.get("password") or "").strip()
        device_id = resolve_device_id(request)
        if not identifier or not password:
            return Response({"error": "Email/patient ID and password are required."}, status=400)
        if not device_id:
            return Response(
                {
                    "error": "A valid device fingerprint is required. Update the patient app and try again.",
                    "code": "device_fingerprint_required",
                },
                status=400,
            )

        locked = is_device_locked(device_id)
        if locked:
            return Response(lockout_payload(locked), status=423)

        user = find_patient_user(identifier)
        if not user or not user.is_active or not user.is_active_account:
            lock = register_failure(device_id, identifier, user)
            if lock.locked_until:
                return Response(lockout_payload(lock), status=423)
            return Response(
                {
                    "error": GENERIC_LOGIN_ERROR,
                    "attemptsRemaining": max(0, MAX_FAILED_ATTEMPTS - lock.failed_attempts),
                    "code": "invalid_credentials",
                },
                status=401,
            )

        if not check_password(password, user.password):
            lock = register_failure(device_id, identifier, user)
            remaining = max(0, MAX_FAILED_ATTEMPTS - lock.failed_attempts)
            if lock.locked_until:
                return Response(lockout_payload(lock), status=423)
            return Response(
                {
                    "error": GENERIC_LOGIN_ERROR,
                    "attemptsRemaining": remaining,
                    "code": "invalid_credentials",
                },
                status=401,
            )

        register_success(device_id, identifier, user)
        mark_login(user)
        return Response(issue_patient_tokens(user))


class PatientChangePasswordThrottle(ScopedRateThrottle):
    scope = "password_change"


class PatientChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole]
    throttle_classes = [PatientChangePasswordThrottle]
    allow_must_change_password = True

    def post(self, request):
        current_password = str(request.data.get("currentPassword") or "")
        new_password = str(request.data.get("newPassword") or "")
        confirm = str(request.data.get("confirmPassword") or new_password)
        user = request.user
        if not current_password or not new_password:
            return Response({"error": "Current and new password are required."}, status=400)
        if new_password != confirm:
            return Response({"error": "New password confirmation does not match."}, status=400)
        if not user.check_password(current_password):
            return Response({"error": "Current password is incorrect."}, status=400)
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
        response = issue_patient_tokens(user)
        expires = password_expires_at(user)
        if expires:
            response["passwordExpiresAt"] = expires.isoformat()
        return Response(response)
