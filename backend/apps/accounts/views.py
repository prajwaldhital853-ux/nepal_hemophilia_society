from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.rbac import is_active_admin
from apps.accounts.serializers import UserSerializer
from apps.accounts.staffing import save_admin_photo
from apps.patients.views import _flatten_errors

User = get_user_model()


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
