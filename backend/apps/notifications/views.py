import os

from django.conf import settings
from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole, IsPatientRole, PatientPasswordUsable
from apps.appointments.reminders import send_appointment_reminders
from apps.notifications.jobs import send_injection_reminders, send_monthly_insights
from apps.notifications.models import AdminNotification, PatientNotification, PushDevice
from apps.notifications.serializers import AdminNotificationSerializer, PatientNotificationSerializer


class PatientMeNotificationsView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        category = request.query_params.get("category", "").strip()
        qs = PatientNotification.objects.filter(patient=patient).order_by("-created_at")
        if category and category.lower() != "all":
            qs = qs.filter(category__iexact=category)
        unread = qs.filter(is_read=False).count()
        data = PatientNotificationSerializer(qs[:200], many=True).data
        return Response({"notifications": data, "unreadCount": unread, "total": qs.count()})


class PatientMeNotificationReadView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def post(self, request, pk):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        note = PatientNotification.objects.filter(pk=pk, patient=patient).first()
        if not note:
            raise NotFound("Notification not found.")
        note.is_read = True
        note.save(update_fields=["is_read", "updated_at"])
        return Response({"notification": PatientNotificationSerializer(note).data})


class PatientMeNotificationsMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def post(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        PatientNotification.objects.filter(patient=patient, is_read=False).update(is_read=True)
        return Response({"ok": True})


def _topics(request):
    raw = request.data.get("topics") or request.data.get("relatedTypes") or []
    if isinstance(raw, str):
        raw = [raw]
    return [str(item).strip() for item in raw if str(item).strip()]


class PatientNotificationsSeenView(APIView):
    """Mark unread alerts read when the matching page is opened."""

    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def post(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        topics = _topics(request)
        if not topics:
            return Response({"updated": 0})
        updated = PatientNotification.objects.filter(patient=patient, is_read=False).filter(
            Q(related_type__in=topics) | Q(category__in=topics)
        ).update(is_read=True)
        return Response({"updated": updated})


class AdminNotificationsSeenView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        topics = _topics(request)
        if not topics:
            return Response({"updated": 0})
        updated = AdminNotification.objects.filter(recipient=request.user, is_read=False).filter(
            Q(related_type__in=topics) | Q(category__in=topics)
        ).update(is_read=True)
        return Response({"updated": updated})


class AdminNotificationsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = AdminNotification.objects.filter(recipient=request.user)
        unread = qs.filter(is_read=False).count()
        data = AdminNotificationSerializer(qs[:80], many=True).data
        return Response({"notifications": data, "unreadCount": unread, "total": qs.count()})


class AdminNotificationReadView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        note = AdminNotification.objects.filter(pk=pk, recipient=request.user).first()
        if not note:
            raise NotFound("Notification not found.")
        note.is_read = True
        note.save(update_fields=["is_read", "updated_at"])
        return Response({"notification": AdminNotificationSerializer(note).data})


class AdminNotificationsMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        AdminNotification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"ok": True})


class PushTokenView(APIView):
    """Register an Expo or FCM device token for the signed-in patient or admin."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = str(request.data.get("token") or "").strip()
        if len(token) < 8:
            return Response({"error": "Push token is required."}, status=400)
        platform = str(request.data.get("platform") or "android")[:16]
        app = str(request.data.get("app") or ("patient" if getattr(request.user, "role", "") == "patient" else "admin"))[:16]
        PushDevice.objects.update_or_create(
            token=token,
            defaults={"user": request.user, "platform": platform, "app": app},
        )
        return Response({"ok": True})

    def delete(self, request):
        token = str(request.data.get("token") or "").strip()
        if token:
            PushDevice.objects.filter(user=request.user, token=token).delete()
        return Response({"ok": True})


def cron_authorized(request) -> bool:
    secret = getattr(settings, "CRON_SECRET", "") or os.getenv("CRON_SECRET", "")
    if not secret:
        return False
    provided = (
        request.headers.get("X-Cron-Key")
        or request.query_params.get("key")
        or request.query_params.get("secret")
        or ""
    )
    return provided == secret


class CronNotificationJobsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not cron_authorized(request):
            raise PermissionDenied("Set CRON_SECRET and pass it as ?key= or the X-Cron-Key header.")
        job = (request.query_params.get("job") or "all").strip().lower()
        result = {}
        if job in ("all", "reminders", "injections"):
            result["injectionReminders"] = send_injection_reminders()
            result["appointmentReminders"] = send_appointment_reminders()
        if job in ("all", "insights", "monthly"):
            result["monthlyInsights"] = send_monthly_insights()
        if not result:
            return Response({"error": "Unknown job. Use reminders, insights, or all."}, status=400)
        return Response({"ok": True, **result})
