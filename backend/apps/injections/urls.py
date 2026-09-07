from django.urls import path

from apps.injections.views import InjectionCorrectView, InjectionDetailView, InjectionListCreateView

app_name = "injections"

urlpatterns = [
    path("", InjectionListCreateView.as_view(), name="list"),
    path("<int:pk>/", InjectionDetailView.as_view(), name="detail"),
    path("<int:pk>/correct/", InjectionCorrectView.as_view(), name="correct"),
]
