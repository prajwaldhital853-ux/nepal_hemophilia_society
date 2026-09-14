from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsPatientRole, PatientPasswordUsable
from apps.notifications.models import PatientNotification
from apps.notifications.serializers import PatientNotificationSerializer


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
