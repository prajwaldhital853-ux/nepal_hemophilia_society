from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Simple health check for load balancers and dev verification."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "nhms-api"})


app_name = "core"

urlpatterns = [
    path("", HealthCheckView.as_view(), name="health"),
]
