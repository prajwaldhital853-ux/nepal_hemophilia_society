import os

from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.appointments.slot_schedules import extend_all_slot_schedules
from apps.core.backups import run_daily_backup
from apps.notifications.services import notify_backup
from apps.notifications.views import cron_authorized


class CronBackupView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not cron_authorized(request):
            raise PermissionDenied("Set CRON_SECRET and pass it as ?key= or the X-Cron-Key header.")
        meta = run_daily_backup()
        if meta:
            notify_backup("saved", meta.get("filename") or "backup", actor=None)
        return Response(
            {
                "ok": True,
                "created": bool(meta),
                "backup": {k: v for k, v in (meta or {}).items() if k != "rawZipBytes"},
            }
        )


class CronAppointmentSlotsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not cron_authorized(request):
            raise PermissionDenied("Set CRON_SECRET and pass it as ?key= or the X-Cron-Key header.")
        created = extend_all_slot_schedules()
        return Response({"ok": True, "slotsCreated": created})
