from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.patients.models import Patient


class NotificationCategory(models.TextChoices):
    INJECTION = "injection", "Injection"
    TREATMENT = "treatment", "Treatment"
    STOCK = "stock", "Stock"
    BLEEDING = "bleeding", "Bleeding"
    SYSTEM = "system", "System"
    EVENT = "event", "Event"


class PatientNotification(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="notifications")
    category = models.CharField(max_length=20, choices=NotificationCategory.choices, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    related_type = models.CharField(max_length=40, blank=True)
    related_id = models.IntegerField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="patient_notifications_created",
    )

    class Meta:
        db_table = "patient_notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["patient", "is_read", "created_at"]),
            models.Index(fields=["patient", "category"]),
        ]

    def __str__(self):
        return f"{self.patient.unique_patient_id} — {self.title}"
