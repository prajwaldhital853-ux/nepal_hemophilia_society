from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.password_policy import password_expires_at, password_is_expired
from apps.accounts.presence import mark_logout
from apps.accounts.rbac import is_active_admin
from apps.accounts.serializers import UserSerializer
from apps.accounts.staffing import save_admin_photo, serialize_staff
from apps.patients.views import _flatten_errors

User = get_user_model()


class LogoutView(APIView):
    """Records sign-out so the admin panel can show the account as signed out rather than idle."""

    permission_classes = [permissions.IsAuthenticated]
    allow_must_change_password = True

    def post(self, request):
        mark_logout(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    allow_must_change_password = True

    def _user(self, request):
        return (
            User.objects.select_related(
                "hospital_admin",
                "hospital_admin__hospital",
                "hospital_admin__hospital__province",
                "province_admin",
                "province_admin__province",
            )
            .filter(pk=request.user.pk)
            .first()
        )

    def get(self, request):
        user = self._user(request)
        return Response(UserSerializer(user or request.user, context={"request": request}).data, status=status.HTTP_200_OK)

    def patch(self, request):
        if getattr(request.user, "must_change_password", False):
            return Response({"error": "Set your own password before updating your photo."}, status=403)
        if not is_active_admin(request.user):
            return Response({"error": "Only administrators can update this profile photo."}, status=status.HTTP_403_FORBIDDEN)
        photo = request.FILES.get("photo")
        if not photo:
            return Response({"error": "Choose a JPG or PNG photo."}, status=400)
        try:
            save_admin_photo(request.user, photo)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        user = self._user(request)
        return Response(UserSerializer(user or request.user, context={"request": request}).data, status=status.HTTP_200_OK)


class MeProfileView(APIView):
    """Read-only profile for the signed-in administrator (photo via PATCH /auth/me/)."""

    permission_classes = [permissions.IsAuthenticated]
    allow_must_change_password = True

    def get(self, request):
        if not is_active_admin(request.user):
            return Response({"error": "Only administrators can view this profile."}, status=status.HTTP_403_FORBIDDEN)
        user = (
            User.objects.select_related(
                "hospital_admin",
                "hospital_admin__hospital",
                "hospital_admin__hospital__province",
                "province_admin",
                "province_admin__province",
            )
            .filter(pk=request.user.pk)
            .first()
        )
        profile = serialize_staff(user or request.user, request)
        profile["canEdit"] = False
        profile["photoEditable"] = True
        profile["passwordExpired"] = password_is_expired(request.user)
        expires = password_expires_at(request.user)
        profile["passwordExpiresAt"] = expires.isoformat() if expires else ""
        return Response({"profile": profile}, status=status.HTTP_200_OK)
