from django.utils import timezone
from rest_framework.exceptions import APIException
from rest_framework import serializers

from apps.core.clinical import (
    assert_patient_eligible,
    can_add_clinical_record,
    create_hospital_visit,
    resolve_actor_hospital,
    validate_factor_for_patient,
)
from apps.factors.models import FactorMedicine
from apps.injections.models import InjectionIndication, InjectionRecord, InjectionStatus
from apps.patients.models import Patient
from apps.treatments.models import VisitReason


class InhibitorWarningError(APIException):
    status_code = 409
    default_code = "inhibitor_warning"
    default_detail = "Patient has current inhibitors. Acknowledge to continue with standard factor."


class InjectionRecordSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    displayCode = serializers.SerializerMethodField()
    patientId = serializers.CharField(source="patient.unique_patient_id", read_only=True)
    patientName = serializers.CharField(source="patient.full_name", read_only=True)
    hospitalName = serializers.CharField(source="hospital.name", read_only=True)
    factorMedicineId = serializers.IntegerField(source="factor_medicine_id", read_only=True)
    factorMedicineName = serializers.CharField(source="factor_medicine.name", read_only=True)
    factorType = serializers.CharField(source="factor_type", read_only=True)
    administeredBy = serializers.SerializerMethodField()
    administeredAt = serializers.DateTimeField(source="administered_at")
    batchNumber = serializers.CharField(source="batch_number", read_only=True)
    bleedSite = serializers.CharField(source="bleed_site", read_only=True)
    inhibitorWarning = serializers.BooleanField(source="inhibitor_warning", read_only=True)
    isCorrection = serializers.BooleanField(source="is_correction", read_only=True)
    label = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    type = serializers.CharField(source="indication", read_only=True)

    class Meta:
        model = InjectionRecord
        fields = (
            "id",
            "displayCode",
            "patientId",
            "patientName",
            "hospitalName",
            "factorMedicineId",
            "factorMedicineName",
            "factorType",
            "dose",
            "unit",
            "indication",
            "type",
            "status",
            "administeredAt",
            "date",
            "time",
            "batchNumber",
            "bleedSite",
            "notes",
            "inhibitorWarning",
            "isCorrection",
            "label",
            "administeredBy",
            "createdAt",
        )

    def get_displayCode(self, obj):
        return f"INJ-{obj.administered_at.year}-{obj.id:04d}"

    def get_administeredBy(self, obj):
        name = obj.administered_by.get_full_name() or obj.administered_by.username
        return name if name.startswith("Dr") else f"Dr. {name}"

    def get_date(self, obj):
        return timezone.localtime(obj.administered_at).strftime("%d %b %Y")

    def get_time(self, obj):
        return timezone.localtime(obj.administered_at).strftime("%I:%M %p")

    def get_label(self, obj):
        when = timezone.localtime(obj.administered_at).strftime("%b %d, %Y")
        return f"{obj.factor_type} — {obj.dose:g} {obj.unit} — {obj.get_indication_display()} — {obj.hospital.name} — {when}"


class InjectionCreateSerializer(serializers.Serializer):
    patientId = serializers.CharField()
    factorMedicineId = serializers.IntegerField()
    dose = serializers.DecimalField(max_digits=10, decimal_places=2)
    indication = serializers.ChoiceField(choices=InjectionIndication.choices)
    administeredAt = serializers.DateTimeField(required=False)
    batchNumber = serializers.CharField(required=False, allow_blank=True)
    bleedSite = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    treatmentCenter = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=InjectionStatus.choices, required=False)
    acknowledgeInhibitorWarning = serializers.BooleanField(required=False, default=False)

    def validate_dose(self, value):
        if value <= 0:
            raise serializers.ValidationError("Dose must be greater than zero.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        if not can_add_clinical_record(request.user):
            raise serializers.ValidationError("You cannot add injection records.")

        patient_id = attrs["patientId"].strip().upper()
        patient = Patient.objects.filter(unique_patient_id__iexact=patient_id).select_related("province").first()
        if not patient:
            raise serializers.ValidationError({"patientId": "Patient not found."})
        err = assert_patient_eligible(patient)
        if err:
            raise serializers.ValidationError({"patientId": err})

        hospital, hospital_err = resolve_actor_hospital(request.user, attrs.get("treatmentCenter"))
        if hospital_err:
            raise serializers.ValidationError({"treatmentCenter": hospital_err})

        factor = FactorMedicine.objects.filter(pk=attrs["factorMedicineId"], is_active=True).first()
        if not factor:
            raise serializers.ValidationError({"factorMedicineId": "Unknown or inactive factor product."})

        ok, factor_err, inhibitor_warning = validate_factor_for_patient(patient, factor)
        if not ok:
            raise serializers.ValidationError({"factorMedicineId": factor_err})
        if inhibitor_warning and not attrs.get("acknowledgeInhibitorWarning"):
            raise InhibitorWarningError(
                detail={
                    "error": "Patient has current inhibitors. Standard factor may be less effective — acknowledge to continue.",
                    "code": "inhibitor_warning",
                }
            )

        attrs["patient"] = patient
        attrs["hospital"] = hospital
        attrs["factor"] = factor
        attrs["inhibitor_warning"] = inhibitor_warning
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        administered_at = validated_data.get("administeredAt") or timezone.now()
        status = validated_data.get("status")
        if not status:
            if administered_at > timezone.now():
                status = InjectionStatus.SCHEDULED
            else:
                status = InjectionStatus.COMPLETED
        record = InjectionRecord.objects.create(
            patient=validated_data["patient"],
            hospital=validated_data["hospital"],
            administered_by=request.user,
            factor_medicine=validated_data["factor"],
            factor_type=validated_data["factor"].factor_type,
            dose=validated_data["dose"],
            unit=validated_data["factor"].unit,
            indication=validated_data["indication"],
            status=status,
            administered_at=administered_at,
            batch_number=validated_data.get("batchNumber", ""),
            bleed_site=validated_data.get("bleedSite", ""),
            notes=validated_data.get("notes", ""),
            inhibitor_warning=validated_data["inhibitor_warning"],
        )
        if status == InjectionStatus.COMPLETED:
            create_hospital_visit(
                patient=record.patient,
                hospital=record.hospital,
                visit_date=administered_at.date(),
                reason=VisitReason.INJECTION,
                injection=record,
            )
        return record


class InjectionUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=InjectionStatus.choices, required=False)
    dose = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    indication = serializers.ChoiceField(choices=InjectionIndication.choices, required=False)
    administeredAt = serializers.DateTimeField(required=False)
    batchNumber = serializers.CharField(required=False, allow_blank=True)
    bleedSite = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        from apps.core.clinical import can_update_clinical_record

        record = self.context["record"]
        request = self.context["request"]
        if not can_update_clinical_record(request.user, record.hospital):
            raise serializers.ValidationError("You can only update records created at your own hospital.")
        if attrs.get("dose") is not None and attrs["dose"] <= 0:
            raise serializers.ValidationError({"dose": "Dose must be greater than zero."})
        return attrs

    def update(self, instance, validated_data):
        old_status = instance.status
        for field, attr in (
            ("status", "status"),
            ("dose", "dose"),
            ("indication", "indication"),
            ("administeredAt", "administered_at"),
            ("batchNumber", "batch_number"),
            ("bleedSite", "bleed_site"),
            ("notes", "notes"),
        ):
            if field in validated_data:
                setattr(instance, attr, validated_data[field])
        instance.save()
        if old_status != InjectionStatus.COMPLETED and instance.status == InjectionStatus.COMPLETED:
            if not instance.visit_log.exists():
                create_hospital_visit(
                    patient=instance.patient,
                    hospital=instance.hospital,
                    visit_date=instance.administered_at.date(),
                    reason=VisitReason.INJECTION,
                    injection=instance,
                )
        return instance


class InjectionCorrectionSerializer(serializers.Serializer):
    factorMedicineId = serializers.IntegerField()
    dose = serializers.DecimalField(max_digits=10, decimal_places=2)
    indication = serializers.ChoiceField(choices=InjectionIndication.choices)
    administeredAt = serializers.DateTimeField(required=False)
    batchNumber = serializers.CharField(required=False, allow_blank=True)
    bleedSite = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    correctionReason = serializers.CharField()

    def validate_dose(self, value):
        if value <= 0:
            raise serializers.ValidationError("Dose must be greater than zero.")
        return value

    def validate(self, attrs):
        original = self.context["original"]
        if original.is_void:
            raise serializers.ValidationError("This record was already voided by a correction.")
        factor = FactorMedicine.objects.filter(pk=attrs["factorMedicineId"], is_active=True).first()
        if not factor:
            raise serializers.ValidationError({"factorMedicineId": "Unknown or inactive factor product."})
        ok, factor_err, inhibitor_warning = validate_factor_for_patient(original.patient, factor)
        if not ok:
            raise serializers.ValidationError({"factorMedicineId": factor_err})
        attrs["original"] = original
        attrs["factor"] = factor
        attrs["inhibitor_warning"] = inhibitor_warning
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        original = validated_data["original"]
        administered_at = validated_data.get("administeredAt") or timezone.now()
        original.is_void = True
        original.save(update_fields=["is_void", "updated_at"])
        record = InjectionRecord.objects.create(
            patient=original.patient,
            hospital=original.hospital,
            administered_by=request.user,
            factor_medicine=validated_data["factor"],
            factor_type=validated_data["factor"].factor_type,
            dose=validated_data["dose"],
            unit=validated_data["factor"].unit,
            indication=validated_data["indication"],
            administered_at=administered_at,
            batch_number=validated_data.get("batchNumber", ""),
            bleed_site=validated_data.get("bleedSite", ""),
            notes=f"{validated_data.get('notes', '')}\nCorrection: {validated_data['correctionReason']}".strip(),
            inhibitor_warning=validated_data["inhibitor_warning"],
            is_correction=True,
            corrects_record=original,
        )
        return record
