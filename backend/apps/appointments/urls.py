from django.urls import path

from apps.appointments.views import (
    AdminAppointmentDetailView,
    AdminAppointmentSlotDetailView,
    AdminAppointmentSlotsView,
    AdminAppointmentsView,
)

app_name = "appointments"

urlpatterns = [
    path("", AdminAppointmentsView.as_view(), name="list"),
    path("slots/", AdminAppointmentSlotsView.as_view(), name="slots"),
    path("slots/<int:pk>/", AdminAppointmentSlotDetailView.as_view(), name="slot-detail"),
    path("<int:pk>/", AdminAppointmentDetailView.as_view(), name="detail"),
]
