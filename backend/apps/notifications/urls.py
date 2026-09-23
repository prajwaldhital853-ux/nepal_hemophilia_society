from django.urls import path

from apps.notifications.views import (
    AdminNotificationReadView,
    AdminNotificationsMarkAllReadView,
    AdminNotificationsView,
    PatientMeNotificationReadView,
    AdminNotificationsSeenView,
    PatientMeNotificationsMarkAllReadView,
    PatientMeNotificationsView,
    PatientNotificationsSeenView,
    PushTokenView,
)

app_name = "notifications"

urlpatterns = [
    path("", PatientMeNotificationsView.as_view(), name="list"),
    path("read-all/", PatientMeNotificationsMarkAllReadView.as_view(), name="read-all"),
    path("seen/", PatientNotificationsSeenView.as_view(), name="seen"),
    path("push-token/", PushTokenView.as_view(), name="push-token"),
    path("admin/", AdminNotificationsView.as_view(), name="admin-list"),
    path("admin/read-all/", AdminNotificationsMarkAllReadView.as_view(), name="admin-read-all"),
    path("admin/seen/", AdminNotificationsSeenView.as_view(), name="admin-seen"),
    path("admin/<int:pk>/read/", AdminNotificationReadView.as_view(), name="admin-read"),
    path("<int:pk>/read/", PatientMeNotificationReadView.as_view(), name="read"),
]
