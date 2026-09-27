import os
from datetime import timedelta

from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.device_fingerprint import resolve_device_id
from apps.accounts.device_lock import (
    MAX_FAILED_ATTEMPTS,
    is_device_locked,
    lockout_payload,
    register_failure,
    register_success,
)
from apps.accounts.models import UserRole
from apps.accounts.password_policy import password_is_expired
from apps.accounts.presence import mark_login, mark_seen
from apps.accounts.serializers import UserSerializer
from apps.accounts.throttles import DeviceLoginThrottle
from apps.accounts.totp import admin_totp_required
from apps.accounts.totp_auth import build_pre_auth_login_response, build_pre_auth_setup_response
from apps.audit.models import AuditLog
from apps.patients.views import client_ip

User = get_user_model()

from apps.accounts.admin_tokens import ADMIN_ACCESS_LIFETIME, ADMIN_REFRESH_LIFETIME, issue_admin_tokens

GENERIC_ADMIN_LOGIN_ERROR = "Invalid admin ID/email/username or password."


def resolve_admin_login(identifier: str):
    ident = (identifier or "").strip()
    if not ident:
        return None
    qs = User.objects.exclude(role=UserRole.PATIENT)
    user = qs.filter(username__iexact=ident).first()
    if user:
        return user
    user = qs.filter(email__iexact=ident).first()
    if user:
        return user
    user = qs.filter(staff_id__iexact=ident).first()
    if user:
        return user
    from apps.hospitals.models import HospitalAdmin
    from apps.provinces.models import ProvinceAdmin

    hospital_profile = HospitalAdmin.objects.select_related("user").filter(display_id__iexact=ident).first()
    if hospital_profile:
        return hospital_profile.user
    province_profile = ProvinceAdmin.objects.select_related("user").filter(display_id__iexact=ident).first()
    if province_profile:
        return province_profile.user
    return None


class NhmsTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token

    def validate(self, attrs):
        identifier = attrs.get(self.username_field) or ""
        matched = resolve_admin_login(identifier)
        if matched:
            attrs[self.username_field] = matched.get_username()
        data = super().validate(attrs)
        if self.user.role == UserRole.PATIENT:
            raise serializers.ValidationError("Patient accounts must sign in through the patient app.")
        if hasattr(self.user, "is_active_account") and not self.user.is_active_account:
            raise serializers.ValidationError("This administrator account is inactive.")
        request = self.context.get("request")
        data.pop("refresh", None)
        data.pop("access", None)
        data["user"] = UserSerializer(self.user, context={"request": request}).data
        data["mustChangePassword"] = self.user.must_change_password or password_is_expired(self.user)
        data["passwordExpired"] = password_is_expired(self.user)
        data["accountStatus"] = "Pending" if self.user.must_change_password else "Active"
        return data


class NhmsTokenObtainPairView(TokenObtainPairView):
    serializer_class = NhmsTokenObtainPairSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [DeviceLoginThrottle]

    def post(self, request, *args, **kwargs):
        identifier = str(request.data.get("username") or "").strip()
        device_id = resolve_device_id(request)
        if not device_id:
            return Response(
                {
                    "error": "A valid device fingerprint is required. Update the admin app and try again.",
                    "code": "device_fingerprint_required",
                },
                status=400,
            )

        locked = is_device_locked(device_id)
        if locked:
            return Response(lockout_payload(locked), status=423)

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except (ValidationError, AuthenticationFailed):
            lock = register_failure(device_id, identifier)
            if lock.locked_until:
                return Response(lockout_payload(lock), status=423)
            remaining = max(0, MAX_FAILED_ATTEMPTS - lock.failed_attempts)
            return Response(
                {
                    "error": GENERIC_ADMIN_LOGIN_ERROR,
                    "attemptsRemaining": remaining,
                    "code": "invalid_credentials",
                },
                status=401,
            )

        user = serializer.user
        register_success(device_id, identifier, user)

        if user.totp_enabled:
            return Response(build_pre_auth_login_response(user, request), status=status.HTTP_200_OK)

        if admin_totp_required(user) and not user.totp_enabled:
            return Response(build_pre_auth_setup_response(user, request), status=status.HTTP_200_OK)

        mark_login(user)
        try:
            AuditLog.objects.create(
                actor=user.get_username(),
                action="Admin login",
                module="Auth",
                ip=client_ip(request),
                detail="Signed in from a registered device",
            )
        except Exception:
            pass
        payload = issue_admin_tokens(user, totp_verified=True)
        return Response(
            {
                **payload,
                **serializer.validated_data,
            },
            status=status.HTTP_200_OK,
        )


class NhmsTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        incoming = RefreshToken(attrs["refresh"])
        user_id = incoming.payload.get("user_id")
        user = User.objects.filter(pk=user_id).first() if user_id else None
        is_patient = bool(user and user.role == UserRole.PATIENT)
        if is_patient:
            access_lifetime = timedelta(days=int(os.getenv("JWT_PATIENT_ACCESS_DAYS", "7")))
            refresh_lifetime = timedelta(days=int(os.getenv("JWT_PATIENT_REFRESH_DAYS", "30")))
        else:
            access_lifetime = ADMIN_ACCESS_LIFETIME
            refresh_lifetime = ADMIN_REFRESH_LIFETIME

        data = super().validate(attrs)
        refresh_value = data.get("refresh", attrs["refresh"])
        next_refresh = RefreshToken(refresh_value)
        from apps.accounts.session import session_token_stale

        if user and session_token_stale(user, next_refresh.payload):
            raise ValidationError(
                {"detail": "Session expired. Sign in again.", "code": "session_expired"}
            )
        access = next_refresh.access_token
        for claim in ("role", "username", "must_change_password", "totp_verified"):
            if claim in next_refresh:
                access[claim] = next_refresh[claim]
        if user:
            access["must_change_password"] = user.must_change_password
            from apps.accounts.totp import admin_totp_required

            if user.totp_enabled or admin_totp_required(user):
                if not next_refresh.get("totp_verified"):
                    raise ValidationError(
                        {"detail": "Sign in again with your authenticator code.", "code": "requires_2fa"}
                    )
        access.set_exp(lifetime=access_lifetime)
        data["access"] = str(access)
        next_refresh.set_exp(lifetime=refresh_lifetime)
        data["refresh"] = str(next_refresh)
        if user:
            try:
                mark_seen(user)
            except Exception:
                pass
        return data


class NhmsTokenRefreshView(TokenRefreshView):
    serializer_class = NhmsTokenRefreshSerializer
