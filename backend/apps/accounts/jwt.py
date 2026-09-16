from datetime import timedelta

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.models import UserRole
from apps.accounts.serializers import UserSerializer
from apps.audit.models import AuditLog
from apps.patients.views import client_ip

User = get_user_model()

# Admin panel sessions stay active until explicit logout (refresh can renew access).
ADMIN_ACCESS_LIFETIME = timedelta(days=int(__import__("os").getenv("JWT_ADMIN_ACCESS_DAYS", "365")))
ADMIN_REFRESH_LIFETIME = timedelta(days=int(__import__("os").getenv("JWT_ADMIN_REFRESH_DAYS", "3650")))


def issue_admin_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["username"] = user.username
    refresh.set_exp(lifetime=ADMIN_REFRESH_LIFETIME)
    access = refresh.access_token
    access["role"] = user.role
    access["username"] = user.username
    access["must_change_password"] = user.must_change_password
    access.set_exp(lifetime=ADMIN_ACCESS_LIFETIME)
    return {"refresh": str(refresh), "access": str(access)}


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
        tokens = issue_admin_tokens(self.user)
        data["refresh"] = tokens["refresh"]
        data["access"] = tokens["access"]
        data["user"] = UserSerializer(self.user, context={"request": request}).data
        data["mustChangePassword"] = self.user.must_change_password
        data["accountStatus"] = "Pending" if self.user.must_change_password else "Active"
        return data


class NhmsTokenObtainPairView(TokenObtainPairView):
    serializer_class = NhmsTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            payload = getattr(response, "data", {}) or {}
            user_payload = payload.get("user") or {}
            actor = user_payload.get("username") or str(request.data.get("username") or "")
            try:
                AuditLog.objects.create(
                    actor=actor,
                    action="Admin login",
                    module="Auth",
                    ip=client_ip(request),
                    detail=f"Signed in from {client_ip(request) or 'unknown IP'}",
                )
            except Exception:
                pass
        return response


class NhmsTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = RefreshToken(attrs["refresh"])
        user_id = refresh.payload.get("user_id")
        user = User.objects.filter(pk=user_id).first() if user_id else None
        if user and user.role == UserRole.PATIENT:
            access_lifetime = timedelta(days=int(__import__("os").getenv("JWT_PATIENT_ACCESS_DAYS", "365")))
        else:
            access_lifetime = ADMIN_ACCESS_LIFETIME

        data = super().validate(attrs)
        next_refresh = RefreshToken(attrs["refresh"])
        access = next_refresh.access_token
        for claim in ("role", "username", "must_change_password"):
            if claim in next_refresh:
                access[claim] = next_refresh[claim]
        if user:
            access["must_change_password"] = user.must_change_password
        access.set_exp(lifetime=access_lifetime)
        data["access"] = str(access)
        return data


class NhmsTokenRefreshView(TokenRefreshView):
    serializer_class = NhmsTokenRefreshSerializer
