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


class SlotRepeatMode(models.TextChoices):
    EVERY_DAY = "every_day", "Every day"
    WEEKDAYS = "weekdays", "Weekdays (Mon–Fri)"
    EXCEPT_DAYS = "except_days", "Every day except selected days"


class AppointmentSlotSchedule(TimeStampedModel):
    """Recurring rule that publishes bookable times (e.g. daily at 10:00, except Sunday)."""

    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="appointment_slot_schedules")
    times = models.JSONField(default=list)
    repeat_mode = models.CharField(max_length=20, choices=SlotRepeatMode.choices, default=SlotRepeatMode.EVERY_DAY)
    exclude_weekdays = models.JSONField(default=list, blank=True)
    weeks_ahead = models.PositiveSmallIntegerField(default=8)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appointment_slot_schedules_created",
    )

    class Meta:
        db_table = "appointment_slot_schedules"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.hospital.name} — {self.get_repeat_mode_display()}"


class AppointmentSlot(TimeStampedModel):
    """A bookable date and time published by a treatment centre."""

    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="appointment_slots")
    slot_at = models.DateTimeField(db_index=True)
    capacity = models.PositiveSmallIntegerField(default=1)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appointment_slots_created",
    )

    class Meta:
        db_table = "appointment_slots"
        ordering = ["slot_at"]
        constraints = [
            models.UniqueConstraint(fields=["hospital", "slot_at"], name="uniq_hospital_slot"),
        ]

    def __str__(self):
        return f"{self.hospital.name} — {self.slot_at:%d %b %Y %H:%M}"


class AppointmentReminderLog(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="reminder_logs")
    slot = models.CharField(max_length=32)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "appointment_reminder_logs"
        constraints = [
            models.UniqueConstraint(fields=["appointment", "slot"], name="uniq_appointment_reminder_slot"),
        ]
