from django.urls import path

from apps.appointments.views import PatientAppointmentDetailView, PatientAppointmentsView
from apps.patients.bleeding_views import PatientMeBleedingEpisodesView
from apps.patients.clinical_views import (
    PatientMeHistoryView,
    PatientMeInjectionsView,
    PatientMeInsightsView,
    PatientMeTreatmentsView,
    PatientMeVisitsView,
)
from apps.patients.document_views import PatientMeDocumentsView
from apps.patients.views import PatientMeView
from apps.stock.views import PatientMeStockView

urlpatterns = [
    path("", PatientMeView.as_view(), name="me-patient"),
    path("injections/", PatientMeInjectionsView.as_view(), name="me-injections"),
    path("treatments/", PatientMeTreatmentsView.as_view(), name="me-treatments"),
    path("visits/", PatientMeVisitsView.as_view(), name="me-visits"),
    path("history/", PatientMeHistoryView.as_view(), name="me-history"),
    path("insights/", PatientMeInsightsView.as_view(), name="me-insights"),
    path("documents/", PatientMeDocumentsView.as_view(), name="me-documents"),
    path("stock/", PatientMeStockView.as_view(), name="me-stock"),
    path("bleeding-episodes/", PatientMeBleedingEpisodesView.as_view(), name="me-bleeding"),
    path("appointments/", PatientAppointmentsView.as_view(), name="me-appointments"),
    path("appointments/<int:pk>/", PatientAppointmentDetailView.as_view(), name="me-appointment"),
]
