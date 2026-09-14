"""Create patient-facing notifications when admins take clinical actions."""

from apps.core.realtime import publish_patient_event
from apps.notifications.models import NotificationCategory, PatientNotification
from apps.patients.models import Patient


def _push(patient: Patient, event_type: str, **payload):
    publish_patient_event(patient.unique_patient_id, event_type, **payload)


def notify_patient(
    *,
    patient: Patient,
    category: str,
    title: str,
    message: str,
    user=None,
    related_type: str = "",
    related_id: int | None = None,
):
    note = PatientNotification.objects.create(
        patient=patient,
        category=category,
        title=title,
        message=message,
        created_by=user,
        related_type=related_type,
        related_id=related_id,
    )
    _push(patient, "notification", category=category, notificationId=note.id)
    return note


def notify_profile_updated(patient, user=None, summary="Your profile was updated by your care team."):
    notify_patient(
        patient=patient,
        category=NotificationCategory.SYSTEM,
        title="Profile updated",
        message=summary,
        user=user,
        related_type="patient_profile",
    )
    _push(patient, "profile")


def notify_injection_action(injection, user=None):
    status = injection.status
    when = injection.administered_at.strftime("%d %b %Y %I:%M %p")
    doctor = (injection.doctor_name or "").strip()
    doctor_part = f" by {doctor}" if doctor else ""
    if status == "Scheduled":
        title = "Injection scheduled"
        message = (
            f"A {injection.factor_type} injection ({injection.dose:g} {injection.unit}) "
            f"has been scheduled for {when} at {injection.hospital.name}{doctor_part}."
        )
    elif status == "Completed":
        title = "Injection recorded"
        message = (
            f"Your {injection.get_indication_display()} injection of {injection.dose:g} {injection.unit} "
            f"{injection.factor_type} was recorded on {when} at {injection.hospital.name}{doctor_part}."
        )
    elif status == "Cancelled":
        title = "Injection cancelled"
        message = f"Your scheduled injection on {when} at {injection.hospital.name} was cancelled."
    else:
        title = f"Injection {status.lower()}"
        message = f"Injection status updated to {status} for {when} at {injection.hospital.name}."
    note = notify_patient(
        patient=injection.patient,
        category=NotificationCategory.INJECTION,
        title=title,
        message=message,
        user=user,
        related_type="injection",
        related_id=injection.id,
    )
    _push(injection.patient, "injections")
    return note


def notify_center_stock_update(hospital, factor_name, quantity, unit, user=None):
    """Notify all patients at a center when stock is added or allocated."""
    patients = Patient.objects.filter(primary_hospital=hospital, user__isnull=False).select_related("user")
    created = []
    for patient in patients:
        created.append(
            notify_patient(
                patient=patient,
                category=NotificationCategory.STOCK,
                title="Factor stock updated",
                message=(
                    f"Your treatment center ({hospital.name}) received {quantity:g} {unit} of {factor_name}. "
                    f"Check Factor Stock for current availability."
                ),
                user=user,
                related_type="stock",
            )
        )
        _push(patient, "stock")
    return created


def notify_bleeding_episode(episode, user=None):
    note = notify_patient(
        patient=episode.patient,
        category=NotificationCategory.BLEEDING,
        title="Bleeding episode recorded",
        message=(
            f"A bleeding episode ({episode.site or 'unspecified site'}) on "
            f"{episode.episode_date.strftime('%d %b %Y')} was recorded by your care team at "
            f"{episode.hospital.name}."
        ),
        user=user,
        related_type="bleeding_episode",
        related_id=episode.id,
    )
    _push(episode.patient, "bleeding")
    return note
