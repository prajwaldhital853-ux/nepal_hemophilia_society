from django.urls import path

from apps.patients.clinical_views import (
    PatientMeHistoryView,
    PatientMeInjectionsView,
    PatientMeTreatmentsView,
    PatientMeVisitsView,
)
from apps.patients.views import PatientMeView

urlpatterns = [
    path("", PatientMeView.as_view(), name="me-patient"),
    path("injections/", PatientMeInjectionsView.as_view(), name="me-injections"),
    path("treatments/", PatientMeTreatmentsView.as_view(), name="me-treatments"),
    path("visits/", PatientMeVisitsView.as_view(), name="me-visits"),
    path("history/", PatientMeHistoryView.as_view(), name="me-history"),
]
