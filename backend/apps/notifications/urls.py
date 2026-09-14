from django.urls import path

from apps.notifications.views import (
    PatientMeNotificationReadView,
    PatientMeNotificationsMarkAllReadView,
    PatientMeNotificationsView,
)

app_name = "notifications"

urlpatterns = [
    path("", PatientMeNotificationsView.as_view(), name="list"),
    path("read-all/", PatientMeNotificationsMarkAllReadView.as_view(), name="read-all"),
    path("<int:pk>/read/", PatientMeNotificationReadView.as_view(), name="read"),
]
