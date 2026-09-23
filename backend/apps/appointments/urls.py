from django.urls import path

from apps.appointments.views import AdminAppointmentDetailView, AdminAppointmentsView

app_name = "appointments"

urlpatterns = [
    path("", AdminAppointmentsView.as_view(), name="list"),
    path("<int:pk>/", AdminAppointmentDetailView.as_view(), name="detail"),
]
