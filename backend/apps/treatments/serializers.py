from rest_framework import serializers

from apps.core.clinical import assert_patient_eligible, can_add_clinical_record, create_hospital_visit, resolve_actor_hospital
from apps.treatments.models import TreatmentRecord, TreatmentStatus, TreatmentType, VisitReason


class TreatmentRecordSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    patientId = serializers.CharField(source="patient.unique_patient_id", read_only=True)
    patientName = serializers.CharField(source="patient.full_name", read_only=True)
    hospitalName = serializers.CharField(source="hospital.name", read_only=True)
    treatmentType = serializers.CharField(source="treatment_type", read_only=True)
    treatmentDate = serializers.DateField(source="treatment_date")
    recordedBy = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = TreatmentRecord
        fields = (
            "id",
            "patientId",
            "patientName",
            "hospitalName",
            "treatmentType",
            "status",
            "description",
            "treatmentDate",
            "notes",
            "recordedBy",
            "label",
            "createdAt",
        )

    def get_recordedBy(self, obj):
        return obj.recorded_by.get_full_name() or obj.recorded_by.username

    def get_label(self, obj):
        return f"{obj.get_treatment_type_display()} — {obj.hospital.name} — {obj.treatment_date.strftime('%b %d, %Y')}"


class TreatmentCreateSerializer(serializers.Serializer):
    patientId = serializers.CharField()
    treatmentType = serializers.ChoiceField(choices=TreatmentType.choices)
    description = serializers.CharField()
    treatmentDate = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)
    treatmentCenter = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=TreatmentStatus.choices, required=False)

    def validate(self, attrs):
        from apps.patients.models import Patient

        request = self.context["request"]
        if not can_add_clinical_record(request.user):
            raise serializers.ValidationError("You cannot add treatment records.")

        patient = Patient.objects.filter(unique_patient_id__iexact=attrs["patientId"].strip().upper()).first()
        if not patient:
            raise serializers.ValidationError({"patientId": "Patient not found."})
        err = assert_patient_eligible(patient)
        if err:
            raise serializers.ValidationError({"patientId": err})

        hospital, hospital_err = resolve_actor_hospital(request.user, attrs.get("treatmentCenter"))
        if hospital_err:
            raise serializers.ValidationError({"treatmentCenter": hospital_err})

        attrs["patient"] = patient
        attrs["hospital"] = hospital
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        from django.utils import timezone

        status = validated_data.get("status") or TreatmentStatus.COMPLETED
        treatment_date = validated_data["treatmentDate"]
        if not validated_data.get("status"):
            if treatment_date > timezone.localdate():
                status = TreatmentStatus.SCHEDULED
        record = TreatmentRecord.objects.create(
            patient=validated_data["patient"],
            hospital=validated_data["hospital"],
            recorded_by=request.user,
            treatment_type=validated_data["treatmentType"],
            status=status,
            description=validated_data["description"],
            treatment_date=treatment_date,
            notes=validated_data.get("notes", ""),
        )
        if status == TreatmentStatus.COMPLETED:
            create_hospital_visit(
                patient=record.patient,
                hospital=record.hospital,
                visit_date=record.treatment_date,
                reason=VisitReason.TREATMENT,
                treatment=record,
            )
        return record


class TreatmentUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=TreatmentStatus.choices, required=False)
    description = serializers.CharField(required=False)
    treatmentDate = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        from apps.core.clinical import can_update_clinical_record

        record = self.context["record"]
        request = self.context["request"]
        if not can_update_clinical_record(request.user, record.hospital):
            raise serializers.ValidationError("You can only update records created at your own hospital.")
        return attrs

    def update(self, instance, validated_data):
        old_status = instance.status
        if "status" in validated_data:
            instance.status = validated_data["status"]
        if "description" in validated_data:
            instance.description = validated_data["description"]
        if "treatmentDate" in validated_data:
            instance.treatment_date = validated_data["treatmentDate"]
        if "notes" in validated_data:
            instance.notes = validated_data["notes"]
        instance.save()
        if old_status != TreatmentStatus.COMPLETED and instance.status == TreatmentStatus.COMPLETED:
            if not instance.visit_log.exists():
                create_hospital_visit(
                    patient=instance.patient,
                    hospital=instance.hospital,
                    visit_date=instance.treatment_date,
                    reason=VisitReason.TREATMENT,
                    treatment=instance,
                )
        return instance


class HospitalVisitSerializer(serializers.ModelSerializer):
    patientId = serializers.CharField(source="patient.unique_patient_id", read_only=True)
    hospitalName = serializers.CharField(source="hospital.name", read_only=True)
    province = serializers.CharField(source="hospital.province.name", read_only=True)
    visitDate = serializers.DateField(source="visit_date")
    injectionId = serializers.IntegerField(source="injection_id", read_only=True, allow_null=True)
    treatmentId = serializers.IntegerField(source="treatment_id", read_only=True, allow_null=True)

    class Meta:
        from apps.treatments.models import HospitalVisit

        model = HospitalVisit
        fields = ("id", "patientId", "hospitalName", "province", "visitDate", "reason", "injectionId", "treatmentId")
