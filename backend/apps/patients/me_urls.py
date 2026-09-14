from django.urls import path

from apps.patients.bleeding_views import PatientMeBleedingEpisodesView
from apps.patients.clinical_views import (
    PatientMeHistoryView,
    PatientMeInjectionsView,
    PatientMeTreatmentsView,
    PatientMeVisitsView,
)
from apps.patients.document_views import PatientMeDocumentsView
from apps.patients.stream_views import PatientMeEventStreamView
from apps.patients.views import PatientMeView
from apps.stock.views import PatientMeStockView

urlpatterns = [
    path("", PatientMeView.as_view(), name="me-patient"),
    path("events/", PatientMeEventStreamView.as_view(), name="me-patient-events"),
    path("injections/", PatientMeInjectionsView.as_view(), name="me-injections"),
    path("treatments/", PatientMeTreatmentsView.as_view(), name="me-treatments"),
    path("visits/", PatientMeVisitsView.as_view(), name="me-visits"),
    path("history/", PatientMeHistoryView.as_view(), name="me-history"),
    path("documents/", PatientMeDocumentsView.as_view(), name="me-documents"),
    path("stock/", PatientMeStockView.as_view(), name="me-stock"),
    path("bleeding-episodes/", PatientMeBleedingEpisodesView.as_view(), name="me-bleeding"),
]
