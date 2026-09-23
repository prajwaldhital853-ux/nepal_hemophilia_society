from rest_framework import serializers

from apps.appointments.models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    patientId = serializers.CharField(source="patient.unique_patient_id", read_only=True)
    patientName = serializers.CharField(source="patient.full_name", read_only=True)
    hospitalName = serializers.CharField(source="hospital.name", read_only=True)
    province = serializers.CharField(source="hospital.province.name", read_only=True)
    visitType = serializers.CharField(source="visit_type")
    visitTypeLabel = serializers.CharField(source="get_visit_type_display", read_only=True)
    preferredAt = serializers.DateTimeField(source="preferred_at")
    scheduledAt = serializers.DateTimeField(source="scheduled_at", required=False, allow_null=True)
    doctorName = serializers.CharField(source="doctor_name", required=False, allow_blank=True)
    patientNote = serializers.CharField(source="patient_note", required=False, allow_blank=True)
    adminNote = serializers.CharField(source="admin_note", required=False, allow_blank=True)
    statusLabel = serializers.CharField(source="get_status_display", read_only=True)
    handledBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "patientId",
            "patientName",
            "hospitalName",
            "province",
            "visitType",
            "visitTypeLabel",
            "reason",
            "preferredAt",
            "scheduledAt",
            "doctorName",
            "status",
            "statusLabel",
            "patientNote",
            "adminNote",
            "handledBy",
            "createdAt",
        )

    def get_handledBy(self, obj):
        if not obj.handled_by_id:
            return ""
        return obj.handled_by.get_full_name() or obj.handled_by.get_username()
