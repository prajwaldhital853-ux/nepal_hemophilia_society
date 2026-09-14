from rest_framework import serializers

from apps.core.clinical import assert_patient_eligible, can_add_clinical_record, resolve_actor_hospital
from apps.patients.models import BleedingEpisode, Patient


class BleedingEpisodeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    patientId = serializers.CharField(source="patient.unique_patient_id", read_only=True)
    patientName = serializers.CharField(source="patient.full_name", read_only=True)
    hospitalName = serializers.CharField(source="hospital.name", read_only=True)
    episodeDate = serializers.DateField(source="episode_date")
    recordedBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = BleedingEpisode
        fields = (
            "id",
            "patientId",
            "patientName",
            "hospitalName",
            "episodeDate",
            "site",
            "severity",
            "notes",
            "recordedBy",
            "createdAt",
        )

    def get_recordedBy(self, obj):
        name = obj.recorded_by.get_full_name() or obj.recorded_by.username
        return name


class BleedingEpisodeCreateSerializer(serializers.Serializer):
    patientId = serializers.CharField()
    episodeDate = serializers.DateField()
    site = serializers.CharField(required=False, allow_blank=True)
    severity = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    treatmentCenter = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context["request"]
        if not can_add_clinical_record(request.user):
            raise serializers.ValidationError("You cannot add bleeding episodes.")
        patient_id = attrs["patientId"].strip().upper()
        patient = Patient.objects.filter(unique_patient_id__iexact=patient_id).first()
        if not patient:
            raise serializers.ValidationError({"patientId": "Patient not found."})
        err = assert_patient_eligible(patient)
        if err:
            raise serializers.ValidationError({"patientId": err})
        hospital, hospital_err = resolve_actor_hospital(
            request.user, attrs.get("treatmentCenter"), patient=patient
        )
        if hospital_err:
            raise serializers.ValidationError({"treatmentCenter": hospital_err})
        attrs["patient"] = patient
        attrs["hospital"] = hospital
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        episode = BleedingEpisode.objects.create(
            patient=validated_data["patient"],
            hospital=validated_data["hospital"],
            episode_date=validated_data["episodeDate"],
            site=validated_data.get("site", ""),
            severity=validated_data.get("severity", ""),
            notes=validated_data.get("notes", ""),
            recorded_by=request.user,
        )
        from apps.notifications.services import notify_bleeding_episode

        notify_bleeding_episode(episode, user=request.user)
        return episode
