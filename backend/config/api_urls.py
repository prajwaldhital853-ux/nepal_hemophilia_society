"""
API v1 URL routing — each feature app owns its own urlpatterns.
"""

from django.urls import include, path

urlpatterns = [
    path("health/", include("apps.core.urls")),
    path("auth/", include("apps.accounts.urls")),
    path("provinces/", include("apps.provinces.urls")),
    path("hospitals/", include("apps.hospitals.urls")),
    path("patients/", include("apps.patients.urls")),
    path("factors/", include("apps.factors.urls")),
    path("injections/", include("apps.injections.urls")),
    path("treatments/", include("apps.treatments.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("audit/", include("apps.audit.urls")),
    path("reports/", include("apps.reports.urls")),
]
