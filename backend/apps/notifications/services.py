"""Create in-app notifications and queue push delivery for patients and admins."""

from apps.accounts.models import User, UserRole
from apps.notifications.models import AdminNotification, NotificationCategory, PatientNotification
from apps.notifications.push import dispatch_push
from apps.patients.models import Patient


def _actor_label(user) -> str:
    if not user:
        return "NHMS"
    name = (user.get_full_name() or "").strip()
    return name or user.get_username()


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
        created_by=user if getattr(user, "pk", None) else None,
        related_type=related_type,
        related_id=related_id,
    )
    if patient.user_id:
        dispatch_push([patient.user_id], title, message, {"category": category, "id": note.id})
    return note


def recipient_admins(hospital=None):
    qs = User.objects.filter(is_active=True, role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN])
    ids = set(qs.values_list("id", flat=True))
    if hospital is not None:
        ids.update(
            User.objects.filter(is_active=True, hospital_admin__hospital=hospital).values_list("id", flat=True)
        )
        if getattr(hospital, "province_id", None):
            ids.update(
                User.objects.filter(is_active=True, province_admin__province_id=hospital.province_id).values_list(
                    "id", flat=True
                )
            )
    return list(User.objects.filter(id__in=ids))


def notify_admins(
    *,
    hospital=None,
    category: str,
    title: str,
    message: str,
    actor=None,
    related_type: str = "",
    related_id: int | None = None,
):
    users = recipient_admins(hospital)
    if not users:
        return []
    rows = AdminNotification.objects.bulk_create(
        [
            AdminNotification(
                recipient=user,
                category=category,
                title=title,
                message=message,
                actor_name=_actor_label(actor),
                related_type=related_type,
                related_id=related_id,
            )
            for user in users
        ]
    )
    dispatch_push([user.id for user in users], title, message, {"category": category, "audience": "admin"})
    return rows


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
        category=NotificationCategory.INJECTION if status != "Scheduled" else NotificationCategory.SCHEDULE,
        title=title,
        message=message,
        user=user,
        related_type="injection",
        related_id=injection.id,
    )
    who = _actor_label(user or injection.administered_by)
    patient = injection.patient
    notify_admins(
        hospital=injection.hospital,
        category=NotificationCategory.INJECTION,
        title=title,
        message=(
            f"{who} — {patient.full_name} ({patient.unique_patient_id}): {message}"
        ),
        actor=user,
        related_type="injection",
        related_id=injection.id,
    )
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
    return created


def notify_bleeding_episode(episode, user=None):
    message = (
        f"A bleeding episode ({episode.site or 'unspecified site'}) on "
        f"{episode.episode_date.strftime('%d %b %Y')} was recorded by your care team at "
        f"{episode.hospital.name}."
    )
    note = notify_patient(
        patient=episode.patient,
        category=NotificationCategory.BLEEDING,
        title="Bleeding episode recorded",
        message=message,
        user=user,
        related_type="bleeding_episode",
        related_id=episode.id,
    )
    who = _actor_label(user)
    notify_admins(
        hospital=episode.hospital,
        category=NotificationCategory.BLEEDING,
        title="Bleeding episode recorded",
        message=f"{who} recorded a bleed for {episode.patient.full_name} ({episode.patient.unique_patient_id}). {message}",
        actor=user,
        related_type="bleeding_episode",
        related_id=episode.id,
    )
    return note


def notify_treatment_action(treatment, user=None):
    when = treatment.treatment_date.strftime("%d %b %Y")
    title = "Treatment recorded" if treatment.status != "Scheduled" else "Treatment scheduled"
    message = (
        f"{treatment.get_treatment_type_display()} ({treatment.status}) on {when} at {treatment.hospital.name}. "
        f"{treatment.description}"
    ).strip()
    note = notify_patient(
        patient=treatment.patient,
        category=NotificationCategory.TREATMENT,
        title=title,
        message=message,
        user=user,
        related_type="treatment",
        related_id=treatment.id,
    )
    who = _actor_label(user)
    notify_admins(
        hospital=treatment.hospital,
        category=NotificationCategory.TREATMENT,
        title=title,
        message=f"{who} — {treatment.patient.full_name} ({treatment.patient.unique_patient_id}): {message}",
        actor=user,
        related_type="treatment",
        related_id=treatment.id,
    )
    return note


def notify_profile_updated(patient, user=None):
    who = _actor_label(user)
    notify_patient(
        patient=patient,
        category=NotificationCategory.PROFILE,
        title="Profile updated",
        message=f"Your NHMS profile was updated by {who}. Open your profile to review the latest details.",
        user=user,
        related_type="patient",
        related_id=patient.id,
    )
    notify_admins(
        hospital=patient.primary_hospital,
        category=NotificationCategory.PROFILE,
        title="Patient profile updated",
        message=f"{who} updated {patient.full_name} ({patient.unique_patient_id}).",
        actor=user,
        related_type="patient",
        related_id=patient.id,
    )


def notify_patient_created(patient, user=None):
    who = _actor_label(user)
    hospital = patient.primary_hospital
    notify_admins(
        hospital=hospital,
        category=NotificationCategory.PROFILE,
        title="New patient added",
        message=(
            f"{who} registered {patient.full_name} ({patient.unique_patient_id})"
            + (f" at {hospital.name}." if hospital else ".")
        ),
        actor=user,
        related_type="patient",
        related_id=patient.id,
    )


def notify_document_added(patient, filenames: list[str], user=None, hospital=None):
    names = ", ".join(filenames[:4])
    extra = f" (+{len(filenames) - 4} more)" if len(filenames) > 4 else ""
    who = _actor_label(user)
    notify_patient(
        patient=patient,
        category=NotificationCategory.DOCUMENT,
        title="Document updated",
        message=f"{who} added {len(filenames)} document(s) to your record: {names}{extra}.",
        user=user,
        related_type="document",
    )
    notify_admins(
        hospital=hospital or patient.primary_hospital,
        category=NotificationCategory.DOCUMENT,
        title="Patient document updated",
        message=f"{who} added {len(filenames)} document(s) for {patient.full_name} ({patient.unique_patient_id}): {names}{extra}.",
        actor=user,
        related_type="document",
        related_id=patient.id,
    )


def notify_staff_created(new_user, actor=None):
    who = _actor_label(actor)
    name = new_user.get_full_name() or new_user.username
    hospital = None
    profile = getattr(new_user, "hospital_admin", None)
    if profile:
        hospital = profile.hospital
    notify_admins(
        hospital=hospital,
        category=NotificationCategory.ADMIN,
        title="New administrator created",
        message=f"{who} created {new_user.get_role_display()} account {name} ({new_user.staff_id or new_user.username}).",
        actor=actor,
        related_type="admin",
        related_id=new_user.id,
    )


def notify_backup(action: str, filename: str, actor=None):
    who = _actor_label(actor)
    if action == "downloaded":
        title = "Backup downloaded"
        message = f"{who} downloaded encrypted backup {filename}."
    else:
        title = "Backup saved"
        message = f"An encrypted backup was saved ({filename}) by {who}."
    notify_admins(
        category=NotificationCategory.BACKUP,
        title=title,
        message=message,
        actor=actor,
        related_type="backup",
    )


def notify_stock_movement(movement):
    stock = movement.stock
    hospital = stock.hospital
    factor = stock.factor_medicine.name if stock.factor_medicine_id else "Factor"
    who = _actor_label(movement.recorded_by)
    qty = abs(movement.quantity_delta)
    balance = movement.quantity_after
    unit = stock.unit
    kind = movement.movement_type
    patient = movement.patient
    injection = movement.injection

    if kind == "injection" and patient:
        when = ""
        if injection and injection.administered_at:
            when = injection.administered_at.strftime("%d %b %Y %I:%M %p")
        title = "Factor given to a patient"
        message = (
            f"{who} gave {qty:g} {unit} of {factor} to {patient.full_name} ({patient.unique_patient_id})"
            f"{f' on {when}' if when else ''} at {hospital.name}. "
            f"Center balance is now {balance:g} {unit}."
        )
    elif kind == "stock_in":
        title = "Stock received"
        message = f"{who} added {qty:g} {unit} of {factor} at {hospital.name}. Balance: {balance:g} {unit}."
    elif kind == "stock_out":
        title = "Stock removed"
        message = f"{who} removed {qty:g} {unit} of {factor} at {hospital.name}. Balance: {balance:g} {unit}."
    elif kind == "reversal":
        title = "Stock restored"
        message = f"{who} restored {qty:g} {unit} of {factor} at {hospital.name}. Balance: {balance:g} {unit}."
    else:
        title = "Stock updated"
        message = f"{who} adjusted {factor} at {hospital.name} by {movement.quantity_delta:g} {unit}. Balance: {balance:g} {unit}."

    notify_admins(
        hospital=hospital,
        category=NotificationCategory.STOCK,
        title=title,
        message=message,
        actor=movement.recorded_by,
        related_type="stock",
        related_id=stock.id,
    )
    if balance <= 0 and kind in ("stock_out", "injection", "adjustment"):
        patients = Patient.objects.filter(primary_hospital=hospital, user__isnull=False)
        for row in patients:
            notify_patient(
                patient=row,
                category=NotificationCategory.STOCK,
                title="Factor out of stock",
                message=(
                    f"{factor} is out of stock at {hospital.name}. "
                    "Contact your treatment centre before your next infusion."
                ),
                user=movement.recorded_by,
                related_type="stock",
                related_id=stock.id,
            )
