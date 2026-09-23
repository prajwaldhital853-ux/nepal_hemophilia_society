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
    PROFILE = "profile", "Profile"
    DOCUMENT = "document", "Document"
    INSIGHT = "insight", "Insight"
    SCHEDULE = "schedule", "Schedule"
    ADMIN = "admin", "Admin"
    BACKUP = "backup", "Backup"
    APPOINTMENT = "appointment", "Appointment"


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


class AdminNotification(TimeStampedModel):
    """In-app activity alert for an administrator."""

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_notifications",
    )
    category = models.CharField(max_length=20, choices=NotificationCategory.choices, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    actor_name = models.CharField(max_length=150, blank=True)
    related_type = models.CharField(max_length=40, blank=True)
    related_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "admin_notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "created_at"]),
        ]

    def __str__(self):
        return f"{self.recipient_id} — {self.title}"


class PushDevice(TimeStampedModel):
    """FCM or Expo push token for a signed-in user."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_devices")
    token = models.CharField(max_length=512, unique=True)
    platform = models.CharField(max_length=16, default="android")
    app = models.CharField(max_length=16, default="patient")

    class Meta:
        db_table = "push_devices"

    def __str__(self):
        return f"{self.user_id} {self.platform}"


class InjectionReminderLog(models.Model):
    """One row per reminder slot so cron can send each reminder only once."""

    injection = models.ForeignKey("injections.InjectionRecord", on_delete=models.CASCADE, related_name="reminder_logs")
    slot = models.CharField(max_length=32)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "injection_reminder_logs"
        constraints = [
            models.UniqueConstraint(fields=["injection", "slot"], name="uniq_injection_reminder_slot"),
        ]


class MonthlyInsightLog(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="insight_logs")
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "monthly_insight_logs"
        constraints = [
            models.UniqueConstraint(fields=["patient", "year", "month"], name="uniq_monthly_insight"),
        ]
