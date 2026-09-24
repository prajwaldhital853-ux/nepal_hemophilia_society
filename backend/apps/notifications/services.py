"""Create in-app notifications and queue push delivery for patients and admins."""

import logging
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.notifications.models import AdminNotification, NotificationCategory, PatientNotification
from apps.notifications.push import dispatch_push, send_push_now
from apps.patients.models import Patient

logger = logging.getLogger(__name__)


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
    try:
        if related_type and related_id:
            recent = (
                PatientNotification.objects.filter(
                    patient=patient,
                    related_type=related_type,
                    related_id=related_id,
                    title=title,
                    created_at__gte=timezone.now() - timedelta(minutes=5),
                )
                .order_by("-id")
                .first()
            )
            if recent:
                return recent
        note = PatientNotification.objects.create(
            patient=patient,
            category=category,
            title=title,
            message=message,
            created_by=user if getattr(user, "pk", None) else None,
            related_type=related_type,
            related_id=related_id,
        )
        actor_id = getattr(user, "pk", None)
        if patient.user_id and actor_id != patient.user_id:
            dispatch_push([patient.user_id], title, message, {"category": category, "id": note.id})
        return note
    except Exception:
        logger.exception("Failed to create patient notification")
        return None


def recipient_admins(hospital=None, *, actor=None, province_id=None, extra_users=None, exclude_ids=None):
    """Super admins, the province admin, and the centre admin for this record.

    The person who performed the action is left out. Pass extra_users to also
    alert a specific account, such as the admin whose profile was edited.
    """
    ids = set(
        User.objects.filter(
            is_active=True,
            is_active_account=True,
            role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN],
        ).values_list("id", flat=True)
    )
    province_ids = set()
    if province_id:
        province_ids.add(province_id)
    if hospital is not None:
        hospital_province = getattr(hospital, "province_id", None)
        if hospital_province:
            province_ids.add(hospital_province)
        ids.update(
            User.objects.filter(
                is_active=True,
                is_active_account=True,
                hospital_admin__hospital=hospital,
            ).values_list("id", flat=True)
        )
    if province_ids:
        ids.update(
            User.objects.filter(
                is_active=True,
                is_active_account=True,
                province_admin__province_id__in=province_ids,
            ).values_list("id", flat=True)
        )
    for extra in extra_users or []:
        if getattr(extra, "pk", None):
            ids.add(extra.pk)
    skip = set(exclude_ids or [])
    actor_id = getattr(actor, "pk", None)
    if actor_id:
        skip.add(actor_id)
    ids.difference_update(skip)
    if not ids:
        return []
    return list(User.objects.filter(id__in=ids))


def notify_admins(
    *,
    hospital=None,
    province_id=None,
    category: str,
    title: str,
    message: str,
    actor=None,
    related_type: str = "",
    related_id: int | None = None,
    extra_users=None,
    exclude_ids=None,
):
    try:
        users = recipient_admins(
            hospital,
            actor=actor,
            province_id=province_id,
            extra_users=extra_users,
            exclude_ids=exclude_ids,
        )
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

        def _push_each():
            for row in rows:
                if not row.pk:
                    continue
                send_push_now(
                    [row.recipient_id],
                    title,
                    message,
                    {
                        "category": category,
                        "audience": "admin",
                        "relatedType": related_type or category,
                        "id": str(row.pk),
                    },
                )

        transaction.on_commit(_push_each)
        return rows
    except Exception:
        logger.exception("Failed to create admin notifications")
        return []


def _scope_for_staff(user):
    hospital = getattr(getattr(user, "hospital_admin", None), "hospital", None)
    province_profile = getattr(user, "province_admin", None)
    province_id = None
    if province_profile is not None:
        province_id = province_profile.province_id
    elif hospital is not None:
        province_id = hospital.province_id
    return hospital, province_id


def notify_injection_action(injection, user=None, *, updated=False):
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
    if updated:
        title = "Injection updated"
        message = (
            f"A {injection.factor_type} injection ({injection.dose:g} {injection.unit}, {status}) "
            f"on {when} at {injection.hospital.name} was updated."
        )
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


def notify_treatment_action(treatment, user=None, *, updated=False):
    when = treatment.treatment_date.strftime("%d %b %Y")
    title = "Treatment recorded" if treatment.status != "Scheduled" else "Treatment scheduled"
    if updated:
        title = "Treatment updated"
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
        province_id=patient.province_id,
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
        province_id=getattr(patient, "province_id", None),
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
        province_id=patient.province_id,
        category=NotificationCategory.DOCUMENT,
        title="Patient document updated",
        message=f"{who} added {len(filenames)} document(s) for {patient.full_name} ({patient.unique_patient_id}): {names}{extra}.",
        actor=user,
        related_type="document",
        related_id=patient.id,
    )


def notify_patient_deleted(patient, user=None):
    who = _actor_label(user)
    notify_admins(
        hospital=patient.primary_hospital,
        province_id=patient.province_id,
        category=NotificationCategory.PROFILE,
        title="Patient record deleted",
        message=f"{who} deleted {patient.full_name} ({patient.unique_patient_id}).",
        actor=user,
        related_type="patient",
        related_id=patient.id,
    )


def notify_document_removed(patient, filename: str, user=None, hospital=None):
    who = _actor_label(user)
    notify_patient(
        patient=patient,
        category=NotificationCategory.DOCUMENT,
        title="Document removed",
        message=f"{who} removed a document from your record: {filename}.",
        user=user,
        related_type="document",
        related_id=patient.id,
    )
    notify_admins(
        hospital=hospital or patient.primary_hospital,
        province_id=patient.province_id,
        category=NotificationCategory.DOCUMENT,
        title="Patient document removed",
        message=f"{who} removed {filename} for {patient.full_name} ({patient.unique_patient_id}).",
        actor=user,
        related_type="document",
        related_id=patient.id,
    )


def notify_staff_updated(user, actor=None):
    """Alert the edited admin, plus super admin, their province admin, and centre admin."""
    hospital, province_id = _scope_for_staff(user)
    who = _actor_label(actor)
    name = user.get_full_name() or user.username
    label = user.get_role_display()
    ident = user.staff_id or user.username
    notify_admins(
        hospital=hospital,
        province_id=province_id,
        category=NotificationCategory.ADMIN,
        title="Administrator updated",
        message=f"{who} updated {label} {name} ({ident}).",
        actor=actor,
        related_type="admin",
        related_id=user.id,
        exclude_ids=[user.id],
    )
    if not user.pk or (actor and actor.pk == user.pk):
        return
    try:
        AdminNotification.objects.create(
            recipient=user,
            category=NotificationCategory.ADMIN,
            title="Your account was updated",
            message=f"{who} updated your administrator profile. Open Admins to review the latest details.",
            actor_name=who,
            related_type="admin",
            related_id=user.id,
        )
        dispatch_push([user.id], "Your account was updated", f"{who} updated your administrator profile.", {"category": "admin"})
    except Exception:
        logger.exception("Failed to notify updated administrator")


def notify_staff_deleted(user, actor=None):
    hospital, province_id = _scope_for_staff(user)
    who = _actor_label(actor)
    name = user.get_full_name() or user.username
    notify_admins(
        hospital=hospital,
        province_id=province_id,
        category=NotificationCategory.ADMIN,
        title="Administrator removed",
        message=f"{who} removed {user.get_role_display()} {name} ({user.staff_id or user.username}).",
        actor=actor,
        related_type="admin",
        exclude_ids=[user.id],
    )


def notify_staff_created(new_user, actor=None):
    who = _actor_label(actor)
    name = new_user.get_full_name() or new_user.username
    hospital, province_id = _scope_for_staff(new_user)
    ident = new_user.staff_id or new_user.username
    notify_admins(
        hospital=hospital,
        province_id=province_id,
        category=NotificationCategory.ADMIN,
        title="New administrator created",
        message=f"{who} created {new_user.get_role_display()} account {name} ({ident}).",
        actor=actor,
        related_type="admin",
        related_id=new_user.id,
        exclude_ids=[new_user.id],
    )
    try:
        AdminNotification.objects.create(
            recipient=new_user,
            category=NotificationCategory.ADMIN,
            title="Your account was created",
            message=f"{who} created your NHMS administrator account ({ident}).",
            actor_name=who,
            related_type="admin",
            related_id=new_user.id,
        )
    except Exception:
        logger.exception("Failed to notify new administrator")


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
