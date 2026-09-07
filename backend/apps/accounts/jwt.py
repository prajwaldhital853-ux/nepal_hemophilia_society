from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.accounts.serializers import UserSerializer


class NhmsTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.role == UserRole.PATIENT:
            raise serializers.ValidationError("Patient accounts must sign in through the patient app.")
        if hasattr(self.user, "is_active_account") and not self.user.is_active_account:
            raise serializers.ValidationError("This administrator account is inactive.")
        data["user"] = UserSerializer(self.user).data
        data["mustChangePassword"] = self.user.must_change_password
        return data


class NhmsTokenObtainPairView(TokenObtainPairView):
    serializer_class = NhmsTokenObtainPairSerializer
