from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import UserSerializer

User = get_user_model()


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
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
        return Response(UserSerializer(user or request.user).data, status=status.HTTP_200_OK)
