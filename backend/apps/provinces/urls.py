from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView


class PlaceholderView(APIView):
    """Placeholder until feature is implemented."""

    def get(self, request):
        return Response({"detail": "Endpoint ready — implementation pending."})


app_name = "provinces"

urlpatterns = [
    path("", PlaceholderView.as_view(), name="list"),
]
