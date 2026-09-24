"""
API v1 URL routing — each feature app owns its own urlpatterns.
"""

from django.urls import include, path

from apps.core.backup_views import BackupDownloadView, BackupListCreateView
from apps.core.cron_views import CronAppointmentSlotsView, CronBackupView
from apps.core.urls import CronPingView
from apps.notifications.views import CronNotificationJobsView

urlpatterns = [
    path("health/", include("apps.core.urls")),
    path("cron/", CronPingView.as_view(), name="cron-ping"),
    path("cron/notifications/", CronNotificationJobsView.as_view(), name="cron-notifications"),
    path("cron/backup/", CronBackupView.as_view(), name="cron-backup"),
    path("cron/appointment-slots/", CronAppointmentSlotsView.as_view(), name="cron-appointment-slots"),
    path("backups/", BackupListCreateView.as_view(), name="backups"),
    path("backups/<str:filename>/download/", BackupDownloadView.as_view(), name="backup-download"),
    path("auth/", include("apps.accounts.urls")),
    path("admins/", include("apps.accounts.staff_urls")),
    path("provinces/", include("apps.provinces.urls")),
    path("hospitals/", include("apps.hospitals.urls")),
    path("patients/", include("apps.patients.urls")),
    path("patients/", include("apps.patients.clinical_urls")),
    path("me/patient/", include("apps.patients.me_urls")),
    path("factors/", include("apps.factors.urls")),
    path("injections/", include("apps.injections.urls")),
    path("treatments/", include("apps.treatments.urls")),
    path("appointments/", include("apps.appointments.urls")),
    path("stock/", include("apps.stock.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("audit/", include("apps.audit.urls")),
    path("reports/", include("apps.reports.urls")),
    path("users/", include("apps.accounts.directory_urls")),
    path("cms/", include("apps.cms.urls")),
    path("notes/", include("apps.core.note_urls")),
]
