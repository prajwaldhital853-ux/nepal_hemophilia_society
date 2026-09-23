"""Scheduled notification jobs invoked by cron endpoints."""

from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.injections.models import InjectionRecord, InjectionStatus
from apps.notifications.models import InjectionReminderLog, MonthlyInsightLog, NotificationCategory
from apps.notifications.services import notify_patient
from apps.patients.insights import build_patient_insights
from apps.patients.models import Patient

DAY_BEFORE_MORNING = "day_before_morning"
DAY_BEFORE_EVENING = "day_before_evening"
DAY_OF_MORNING = "day_of_morning"
DAY_OF_SOON = "day_of_soon"


def _send_slot(injection, slot: str, title: str, message: str) -> bool:
    try:
        with transaction.atomic():
            InjectionReminderLog.objects.create(injection=injection, slot=slot)
    except IntegrityError:
        return False
    when = timezone.localtime(injection.administered_at)
    notify_patient(
        patient=injection.patient,
        category=NotificationCategory.SCHEDULE,
        title=title,
        message=message,
        related_type="injection",
        related_id=injection.id,
    )
    return True


def send_injection_reminders(now=None) -> dict:
    """
    For each scheduled injection:
    - two reminders on the day before (from 08:00 and from 17:00 local time)
    - two reminders on the scheduled day, both before the scheduled time
      (from 08:00, and again within 3 hours of the dose or after 17:00)
    """
    now = timezone.localtime(now or timezone.now())
    today = now.date()
    tomorrow = today + timedelta(days=1)
    sent = 0
    checked = 0
    rows = (
        InjectionRecord.objects.filter(
            status__in=[InjectionStatus.SCHEDULED, InjectionStatus.PENDING],
            is_void=False,
            administered_at__date__in=[today, tomorrow],
        )
        .select_related("patient", "hospital", "patient__user")
    )
    for injection in rows:
        if not injection.patient_id or not injection.patient.user_id:
            continue
        checked += 1
        when = timezone.localtime(injection.administered_at)
        clock = when.strftime("%d %b %Y %I:%M %p")
        place = injection.hospital.name
        dose = f"{injection.dose:g} {injection.unit} {injection.factor_type}"
        if when.date() == tomorrow:
            if now.hour >= 8 and _send_slot(
                injection,
                DAY_BEFORE_MORNING,
                "Injection tomorrow",
                f"Reminder: {dose} is scheduled tomorrow at {clock} at {place}.",
            ):
                sent += 1
            if now.hour >= 17 and _send_slot(
                injection,
                DAY_BEFORE_EVENING,
                "Injection tomorrow — second reminder",
                f"Second reminder: your {dose} injection is tomorrow at {clock} at {place}. Prepare factor and your Emergency ID.",
            ):
                sent += 1
        elif when.date() == today and now < when:
            if now.hour >= 8 and _send_slot(
                injection,
                DAY_OF_MORNING,
                "Injection today",
                f"Your {dose} injection is today at {clock} at {place}.",
            ):
                sent += 1
            soon = (when - now) <= timedelta(hours=3) or now.hour >= 17
            if soon and _send_slot(
                injection,
                DAY_OF_SOON,
                "Injection coming up",
                f"Your {dose} injection at {place} is scheduled for {clock}. This is your second reminder for today.",
            ):
                sent += 1
    return {"checked": checked, "sent": sent}


def send_monthly_insights(today=None) -> dict:
    """Send one health-insight summary per patient per calendar month."""
    today = today or timezone.localdate()
    sent = 0
    skipped = 0
    patients = Patient.objects.filter(user__isnull=False).select_related("primary_hospital", "user")
    for patient in patients.iterator():
        try:
            with transaction.atomic():
                MonthlyInsightLog.objects.create(patient=patient, year=today.year, month=today.month)
        except IntegrityError:
            skipped += 1
            continue
        try:
            data = build_patient_insights(patient)
        except Exception:
            skipped += 1
            continue
        status = data.get("status") or {}
        comparison = data.get("comparison") or {}
        this_month = comparison.get("thisMonth") or {}
        month_name = today.strftime("%B %Y")
        notify_patient(
            patient=patient,
            category=NotificationCategory.INSIGHT,
            title=f"Your {month_name} health insights",
            message=(
                f"{status.get('summary') or 'Your monthly summary is ready.'} "
                f"This month so far: {this_month.get('bleeds', 0)} bleeds and "
                f"{this_month.get('injections', 0)} injections. Open My Health Insights in the app."
            ),
            related_type="insights",
        )
        sent += 1
    return {"sent": sent, "skipped": skipped}
