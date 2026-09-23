"""Generate concrete appointment slots from recurring schedules."""

from __future__ import annotations

from datetime import datetime, time, timedelta

from django.utils import timezone

from apps.appointments.models import AppointmentSlot, AppointmentSlotSchedule, SlotRepeatMode


def _parse_time(value: str) -> time | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        hour, minute = raw.split(":", 1)
        return time(hour=int(hour), minute=int(minute))
    except (TypeError, ValueError):
        return None


def day_allowed(schedule: AppointmentSlotSchedule, weekday: int) -> bool:
    if schedule.repeat_mode == SlotRepeatMode.WEEKDAYS:
        return weekday <= 4
    if schedule.repeat_mode == SlotRepeatMode.EXCEPT_DAYS:
        return weekday not in schedule.exclude_weekdays
    # every_day — optional excludes (e.g. skip Saturday/Sunday)
    return weekday not in (schedule.exclude_weekdays or [])


def generate_slots_for_schedule(schedule: AppointmentSlotSchedule, *, actor=None) -> int:
    if not schedule.is_active:
        return 0
    times = [_parse_time(item) for item in (schedule.times or [])]
    times = [item for item in times if item]
    if not times:
        return 0

    tz = timezone.get_current_timezone()
    start_day = timezone.localdate()
    end_day = start_day + timedelta(days=schedule.weeks_ahead * 7)
    created = 0
    day = start_day
    while day <= end_day:
        if day_allowed(schedule, day.weekday()):
            for slot_time in times:
                naive = datetime.combine(day, slot_time)
                slot_at = timezone.make_aware(naive, tz)
                if slot_at <= timezone.now():
                    continue
                _, was_created = AppointmentSlot.objects.get_or_create(
                    hospital_id=schedule.hospital_id,
                    slot_at=slot_at,
                    defaults={"created_by": actor or schedule.created_by, "capacity": 1},
                )
                if was_created:
                    created += 1
        day += timedelta(days=1)
    return created


def extend_all_slot_schedules() -> int:
    total = 0
    for schedule in AppointmentSlotSchedule.objects.filter(is_active=True).select_related("hospital"):
        total += generate_slots_for_schedule(schedule)
    return total
