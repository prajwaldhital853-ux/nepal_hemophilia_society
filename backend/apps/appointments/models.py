from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.hospitals.models import Hospital
from apps.patients.models import Patient


class VisitType(models.TextChoices):
    CLINIC = "clinic_review", "Clinic review"
    PROPHYLAXIS = "prophylaxis", "Prophylaxis visit"
    BLEED = "bleed_followup", "Bleed follow-up"
    PHYSIO = "physiotherapy", "Physiotherapy"
    DENTAL = "dental", "Dental planning"
    COUNSEL = "counselling", "Counselling"
    OTHER = "other", "Other"


class AppointmentStatus(models.TextChoices):
    REQUESTED = "requested", "Requested"
    CONFIRMED = "confirmed", "Confirmed"
    RESCHEDULED = "rescheduled", "Rescheduled"
    DECLINED = "declined", "Declined"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class Appointment(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT, related_name="appointments")
    visit_type = models.CharField(max_length=32, choices=VisitType.choices, default=VisitType.CLINIC)
    reason = models.TextField()
    preferred_at = models.DateTimeField()
    scheduled_at = models.DateTimeField(null=True, blank=True)
    doctor_name = models.CharField(max_length=160, blank=True)
    status = models.CharField(max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.REQUESTED, db_index=True)
    patient_note = models.TextField(blank=True)
    admin_note = models.TextField(blank=True)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appointments_handled",
    )

    class Meta:
        db_table = "appointments"
        ordering = ["-preferred_at"]
        indexes = [
            models.Index(fields=["hospital", "status"]),
            models.Index(fields=["patient", "status"]),
        ]

    def __str__(self):
        return f"{self.patient.unique_patient_id} — {self.get_visit_type_display()}"


class AppointmentReminderLog(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="reminder_logs")
    slot = models.CharField(max_length=32)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "appointment_reminder_logs"
        constraints = [
            models.UniqueConstraint(fields=["appointment", "slot"], name="uniq_appointment_reminder_slot"),
        ]
