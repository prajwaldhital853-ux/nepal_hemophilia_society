from datetime import timedelta

from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.device_lock import is_device_locked, register_failure, register_success
from apps.accounts.models import UserRole
from apps.accounts.permissions import IsPatientRole
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
    refresh.set_exp(lifetime=timedelta(days=3650))
    access = refresh.access_token
    access["role"] = user.role
    access["username"] = user.username
    access["must_change_password"] = user.must_change_password
    access.set_exp(lifetime=timedelta(days=365))
    patient = getattr(user, "patient_profile", None)
    return {
        "access": str(access),
        "refresh": str(refresh),
        "mustChangePassword": user.must_change_password,
        "user": UserSerializer(user).data,
        "patientId": patient.unique_patient_id if patient else user.username,
    }


class PatientLoginThrottle(ScopedRateThrottle):
    scope = "patient_login"


class PatientLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [PatientLoginThrottle]

    def post(self, request):
        identifier = str(request.data.get("identifier") or request.data.get("username") or "").strip()
        password = str(request.data.get("password") or "").strip()
        device_id = str(request.data.get("deviceId") or "").strip()
        if not identifier or not password:
            return Response({"error": "Email/patient ID and password are required."}, status=400)
        if not device_id or len(device_id) < 8:
            return Response({"error": "A valid device id is required."}, status=400)

        locked = is_device_locked(device_id, identifier)
        if locked:
            return Response(
                {
                    "error": "This device is locked after 3 failed login attempts. Use another device or try again after 24 hours.",
                    "code": "device_locked",
                    "lockedUntil": locked.locked_until.isoformat() if locked.locked_until else None,
                },
                status=423,
            )

        user = find_patient_user(identifier)
        if not user or not user.is_active or not user.is_active_account:
            register_failure(device_id, identifier, user)
            return Response({"error": GENERIC_LOGIN_ERROR}, status=401)

        if not check_password(password, user.password):
            lock = register_failure(device_id, identifier, user)
            remaining = max(0, 3 - lock.failed_attempts)
            if lock.locked_until:
                return Response(
                    {
                        "error": "This device is locked after 3 failed login attempts. Other devices are not affected.",
                        "code": "device_locked",
                    },
                    status=423,
                )
            return Response(
                {
                    "error": GENERIC_LOGIN_ERROR,
                    "attemptsRemaining": remaining,
                },
                status=401,
            )

        register_success(device_id, identifier, user)
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        return Response(issue_patient_tokens(user))


class PatientChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole]

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
        if user.check_password(new_password):
            return Response({"error": "New password must be different from the temporary password."}, status=400)
        try:
            password_validation.validate_password(new_password, user)
        except Exception as exc:
            messages = getattr(exc, "messages", [str(exc)])
            return Response({"error": " ".join(messages)}, status=400)
        user.set_password(new_password)
        user.must_change_password = False
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "must_change_password", "password_changed_at"])
        return Response(issue_patient_tokens(user))
