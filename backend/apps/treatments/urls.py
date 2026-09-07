from django.urls import path

from apps.treatments.views import TreatmentDetailView, TreatmentListCreateView

app_name = "treatments"

urlpatterns = [
    path("", TreatmentListCreateView.as_view(), name="list"),
    path("<int:pk>/", TreatmentDetailView.as_view(), name="detail"),
]
