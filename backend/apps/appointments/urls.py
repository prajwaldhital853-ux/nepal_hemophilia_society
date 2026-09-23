from django.urls import path

from apps.appointments.views import (
    AdminAppointmentDetailView,
    AdminAppointmentSlotDetailView,
    AdminAppointmentSlotScheduleDetailView,
    AdminAppointmentSlotSchedulesView,
    AdminAppointmentSlotsView,
    AdminAppointmentsView,
)

app_name = "appointments"

urlpatterns = [
    path("", AdminAppointmentsView.as_view(), name="list"),
    path("slots/", AdminAppointmentSlotsView.as_view(), name="slots"),
    path("slots/schedules/", AdminAppointmentSlotSchedulesView.as_view(), name="slot-schedules"),
    path("slots/schedules/<int:pk>/", AdminAppointmentSlotScheduleDetailView.as_view(), name="slot-schedule-detail"),
    path("slots/<int:pk>/", AdminAppointmentSlotDetailView.as_view(), name="slot-detail"),
    path("<int:pk>/", AdminAppointmentDetailView.as_view(), name="detail"),
]
