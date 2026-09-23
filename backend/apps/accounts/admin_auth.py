from django.contrib.auth import password_validation
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.password_policy import password_expires_at, password_is_expired, password_reuse_error, record_password_history
from apps.accounts.permissions import IsAdminRole
from apps.accounts.serializers import UserSerializer


class AdminChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    allow_must_change_password = True

    def post(self, request):
        current = str(request.data.get("currentPassword") or "").strip()
        new_password = str(request.data.get("newPassword") or "").strip()
        confirm = str(request.data.get("confirmPassword") or "").strip()

        if not new_password or not confirm:
            return Response({"error": "New password and confirmation are required."}, status=400)
        if new_password != confirm:
            return Response({"error": "New passwords do not match."}, status=400)

        user = request.user
        if user.must_change_password:
            if not current or not user.check_password(current):
                return Response({"error": "Temporary password is incorrect."}, status=400)
        elif not user.check_password(current):
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
        payload = UserSerializer(user, context={"request": request}).data
        expires = password_expires_at(user)
        if expires:
            payload["passwordExpiresAt"] = expires.isoformat()
        payload["passwordExpired"] = password_is_expired(user)
        return Response({"user": payload}, status=status.HTTP_200_OK)
