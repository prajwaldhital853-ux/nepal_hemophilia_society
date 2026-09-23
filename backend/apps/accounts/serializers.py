from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.rbac import capabilities
from apps.accounts.staffing import display_id_for, photo_url_for

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    hospitalStaff = serializers.SerializerMethodField()
    provinceAdmin = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    nav = serializers.SerializerMethodField()
    scope = serializers.SerializerMethodField()
    viewOnly = serializers.SerializerMethodField()
    kind = serializers.SerializerMethodField()
    photoUrl = serializers.SerializerMethodField()
    staffId = serializers.SerializerMethodField()
    passwordExpired = serializers.SerializerMethodField()
    passwordExpiresAt = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "fullName",
            "role",
            "kind",
            "staffId",
            "mobile",
            "is_active_account",
            "must_change_password",
            "date_joined",
            "hospitalStaff",
            "provinceAdmin",
            "permissions",
            "nav",
            "scope",
            "viewOnly",
            "photoUrl",
            "passwordExpired",
            "passwordExpiresAt",
        )
        read_only_fields = (
            "id",
            "role",
            "kind",
            "staffId",
            "must_change_password",
            "date_joined",
            "hospitalStaff",
            "provinceAdmin",
            "permissions",
            "nav",
            "scope",
            "fullName",
            "viewOnly",
            "photoUrl",
            "passwordExpired",
            "passwordExpiresAt",
        )

    def get_hospitalStaff(self, obj):
        profile = getattr(obj, "hospital_admin", None)
        if not profile:
            return None
        return {
            "id": profile.display_id,
            "staffType": profile.staff_type,
            "treatmentCenter": profile.hospital.name,
            "province": profile.hospital.province.name,
        }

    def get_provinceAdmin(self, obj):
        profile = getattr(obj, "province_admin", None)
        if not profile:
            return None
        from apps.hospitals.models import Hospital

        default_center = (
            Hospital.objects.filter(province_id=profile.province_id, is_active=True)
            .order_by("name")
            .values_list("name", flat=True)
            .first()
        )
        return {
            "id": profile.display_id,
            "province": profile.province.name,
            "provinceId": profile.province_id,
            "defaultLoggingCenter": default_center or "",
        }

    def get_fullName(self, obj):
        return obj.get_full_name() or obj.username

    def get_permissions(self, obj):
        return capabilities(obj)["permissions"]

    def get_nav(self, obj):
        return capabilities(obj)["nav"]

    def get_scope(self, obj):
        return capabilities(obj)["scope"]

    def get_viewOnly(self, obj):
        return bool(getattr(obj, "view_only", False))

    def get_kind(self, obj):
        return capabilities(obj).get("kind")

    def get_photoUrl(self, obj):
        return photo_url_for(obj, self.context.get("request"))

    def get_staffId(self, obj):
        return display_id_for(obj)

    def get_passwordExpired(self, obj):
        from apps.accounts.password_policy import password_is_expired

        return password_is_expired(obj)

    def get_passwordExpiresAt(self, obj):
        from apps.accounts.password_policy import password_expires_at

        expires = password_expires_at(obj)
        return expires.isoformat() if expires else None
