from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.rbac import capabilities

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    hospitalStaff = serializers.SerializerMethodField()
    provinceAdmin = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    nav = serializers.SerializerMethodField()
    scope = serializers.SerializerMethodField()

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
            "mobile",
            "is_active_account",
            "must_change_password",
            "date_joined",
            "hospitalStaff",
            "provinceAdmin",
            "permissions",
            "nav",
            "scope",
        )
        read_only_fields = (
            "id",
            "role",
            "must_change_password",
            "date_joined",
            "hospitalStaff",
            "provinceAdmin",
            "permissions",
            "nav",
            "scope",
            "fullName",
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
        return {
            "id": profile.display_id,
            "province": profile.province.name,
            "provinceId": profile.province_id,
        }

    def get_fullName(self, obj):
        return obj.get_full_name() or obj.username

    def get_permissions(self, obj):
        return capabilities(obj)["permissions"]

    def get_nav(self, obj):
        return capabilities(obj)["nav"]

    def get_scope(self, obj):
        return capabilities(obj)["scope"]
