from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.hospitals.models import Hospital
from apps.patients.models import Patient


class TreatmentType(models.TextChoices):
    PHYSIOTHERAPY = "Physiotherapy", "Physiotherapy"
    SURGERY = "Surgery", "Surgery"
    ADMISSION = "Admission", "Admission"
    ITI_PROGRAM = "ITI Program", "ITI Program"
    COUNSELING = "Counseling", "Counseling"
    OTHER = "Other", "Other"


class TreatmentStatus(models.TextChoices):
    PENDING = "Pending", "Pending"
    SCHEDULED = "Scheduled", "Scheduled"
    COMPLETED = "Completed", "Completed"
    CANCELLED = "Cancelled", "Cancelled"


class TreatmentRecord(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="treatments")
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT, related_name="treatments")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="treatments_recorded",
    )
    treatment_type = models.CharField(max_length=40, choices=TreatmentType.choices)
    status = models.CharField(
        max_length=20,
        choices=TreatmentStatus.choices,
        default=TreatmentStatus.COMPLETED,
        db_index=True,
    )
    description = models.TextField()
    treatment_date = models.DateField(db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "treatment_records"
        ordering = ["-treatment_date", "-created_at"]
        indexes = [
            models.Index(fields=["patient", "treatment_date"]),
            models.Index(fields=["hospital", "treatment_date"]),
        ]

    def __str__(self):
        return f"{self.patient.unique_patient_id} — {self.treatment_type}"


class VisitReason(models.TextChoices):
    INJECTION = "injection", "Injection"
    TREATMENT = "treatment", "Treatment"


class HospitalVisit(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="visits")
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT, related_name="visits")
    visit_date = models.DateField(db_index=True)
    reason = models.CharField(max_length=20, choices=VisitReason.choices)
    injection = models.ForeignKey(
        "injections.InjectionRecord",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="visit_log",
    )
    treatment = models.ForeignKey(
        TreatmentRecord,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="visit_log",
    )

    class Meta:
        db_table = "hospital_visits"
        ordering = ["-visit_date", "-created_at"]
        indexes = [
            models.Index(fields=["patient", "visit_date"]),
        ]

    def __str__(self):
        return f"{self.patient.unique_patient_id} @ {self.hospital.name} ({self.visit_date})"
