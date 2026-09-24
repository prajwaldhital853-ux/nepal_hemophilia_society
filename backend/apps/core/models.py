from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class NoteTarget(models.TextChoices):
    PATIENT = "patient", "Patient"
    STAFF = "staff", "Admin / staff"
    INJECTION = "injection", "Injection"
    TREATMENT = "treatment", "Treatment"
    BLEEDING = "bleeding", "Bleeding episode"


class RecordNote(TimeStampedModel):
    """Timestamped, authored follow-up note attached to a patient, staff account, or clinical record."""

    target_type = models.CharField(max_length=20, choices=NoteTarget.choices)
    target_id = models.PositiveBigIntegerField()
    patient = models.ForeignKey(
        "patients.Patient",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="record_notes",
    )
    body = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="authored_notes",
    )
    author_name = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "record_notes"
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["target_type", "target_id", "-created_at"], name="notes_target_idx"),
            models.Index(fields=["patient", "-created_at"], name="notes_patient_idx"),
        ]

    def __str__(self):
        return f"{self.target_type}#{self.target_id}: {self.body[:40]}"


class AuditMixin:
    """Optional created_by on records written by staff."""

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_updated",
    )

    class Meta:
        abstract = True
