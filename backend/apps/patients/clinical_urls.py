from django.urls import path

from apps.patients.clinical_views import (
    PatientHistoryView,
    PatientInjectionsView,
    PatientTreatmentsView,
    PatientVisitsView,
)

urlpatterns = [
    path("<str:patient_id>/injections/", PatientInjectionsView.as_view(), name="patient-injections"),
    path("<str:patient_id>/treatments/", PatientTreatmentsView.as_view(), name="patient-treatments"),
    path("<str:patient_id>/visits/", PatientVisitsView.as_view(), name="patient-visits"),
    path("<str:patient_id>/history/", PatientHistoryView.as_view(), name="patient-history"),
]
