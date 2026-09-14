from django.urls import path

from apps.patients.bleeding_views import PatientBleedingEpisodesView
from apps.patients.clinical_views import (
    PatientHistoryView,
    PatientInjectionsView,
    PatientTreatmentsView,
    PatientVisitsView,
)
from apps.patients.document_views import PatientDocumentDetailView, PatientDocumentsView

urlpatterns = [
    path("<str:patient_id>/injections/", PatientInjectionsView.as_view(), name="patient-injections"),
    path("<str:patient_id>/treatments/", PatientTreatmentsView.as_view(), name="patient-treatments"),
    path("<str:patient_id>/visits/", PatientVisitsView.as_view(), name="patient-visits"),
    path("<str:patient_id>/history/", PatientHistoryView.as_view(), name="patient-history"),
    path("<str:patient_id>/bleeding-episodes/", PatientBleedingEpisodesView.as_view(), name="patient-bleeding"),
    path("<str:patient_id>/documents/", PatientDocumentsView.as_view(), name="patient-documents"),
    path("<str:patient_id>/documents/<int:pk>/", PatientDocumentDetailView.as_view(), name="patient-document-detail"),
]
