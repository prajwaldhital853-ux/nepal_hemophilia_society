from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.appointments.models import Appointment, AppointmentReminderLog, AppointmentStatus
from apps.notifications.models import NotificationCategory
from apps.notifications.services import notify_patient

DAY_BEFORE = "day_before"
DAY_OF = "day_of"


def send_appointment_reminders(now=None) -> dict:
    now = timezone.localtime(now or timezone.now())
    today = now.date()
    tomorrow = today + timedelta(days=1)
    sent = 0
    rows = Appointment.objects.filter(
        status__in=[AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED],
        scheduled_at__date__in=[today, tomorrow],
    ).select_related("patient", "hospital", "patient__user")
    for appointment in rows:
        if not appointment.patient.user_id or not appointment.scheduled_at:
            continue
        when = timezone.localtime(appointment.scheduled_at)
        if when.date() == tomorrow and now.hour >= 8:
            if _send(appointment, DAY_BEFORE, when):
                sent += 1
        elif when.date() == today and now < when and now.hour >= 8:
            if _send(appointment, DAY_OF, when):
                sent += 1
    return {"sent": sent}


def _send(appointment, slot, when) -> bool:
    try:
        with transaction.atomic():
            AppointmentReminderLog.objects.create(appointment=appointment, slot=slot)
    except IntegrityError:
        return False
    clock = when.strftime("%d %b %Y %I:%M %p")
    doctor = f" with {appointment.doctor_name}" if appointment.doctor_name else ""
    title = "Appointment tomorrow" if slot == DAY_BEFORE else "Appointment today"
    notify_patient(
        patient=appointment.patient,
        category=NotificationCategory.APPOINTMENT,
        title=title,
        message=(
            f"Reminder: {appointment.get_visit_type_display()}{doctor} at {appointment.hospital.name} "
            f"is scheduled for {clock}."
        ),
        related_type="appointment",
        related_id=appointment.id,
    )
    return True
