"""Shared clinical workflow helpers — injection/treatment RBAC and validation."""

from django.core.exceptions import ObjectDoesNotExist

from apps.accounts.models import UserRole
from apps.accounts.rbac import has_perm, hospital_id_for, is_national_scope, province_id_for, PERM_PATIENTS_DELETE, PERM_PATIENTS_UPDATE
from apps.factors.models import ApplicableType, FactorType
from apps.hospitals.models import HospitalStaffType
from apps.patients.models import InhibitorStatus, Patient, VerificationStatus


STANDARD_FACTOR_TYPES = {FactorType.FVIII, FactorType.FIX}


def get_hospital_admin_profile(user):
    try:
        return user.hospital_admin
    except ObjectDoesNotExist:
        return None


def get_province_admin_profile(user):
    try:
        return user.province_admin
    except ObjectDoesNotExist:
        return None


def resolve_actor_hospital(user, hospital_name=None, patient=None):
    """Hospital admins always record at their assigned center.

    Super admin may name a visiting center; if omitted, the patient's assigned
    primary hospital (treatment center) is used.
    """
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = get_hospital_admin_profile(user)
        if not profile:
            return None, "Your account is not linked to a treatment center."
        return profile.hospital, None
    if is_national_scope(user):
        from apps.hospitals.models import Hospital

        name = (hospital_name or "").strip()
        if name:
            hospital = Hospital.objects.filter(name=name, is_active=True).first()
            if not hospital:
                return None, "Unknown treatment center."
            return hospital, None
        hospital = getattr(patient, "primary_hospital", None) if patient is not None else None
        if hospital and hospital.is_active:
            return hospital, None
        if patient is not None:
            return None, "This patient has no assigned treatment center."
        return None, "Specify treatmentCenter when adding records."
    return None, "Only hospital staff or super admin can add clinical records."


def can_view_patient(user, patient: Patient) -> bool:
    if is_national_scope(user):
        return True
    if user.role == UserRole.PATIENT:
        profile = getattr(user, "patient_profile", None)
        return bool(profile and profile.pk == patient.pk)
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        return bool(pid and patient.province_id == pid)
    if user.role == UserRole.HOSPITAL_ADMIN:
        return True
    return False


def can_edit_patient(user, patient: Patient) -> bool:
    """Edit/delete patient profile: national admins, same-province province admin, same-center hospital staff."""
    if is_national_scope(user):
        return has_perm(user, PERM_PATIENTS_UPDATE)
    if user.role == UserRole.PROVINCE_ADMIN:
        if not has_perm(user, PERM_PATIENTS_UPDATE):
            return False
        province_admin = getattr(user, "province_admin", None)
        return bool(province_admin and patient.province_id == province_admin.province_id)
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = get_hospital_admin_profile(user)
        return bool(profile and patient.primary_hospital_id == profile.hospital_id)
    return False


def can_delete_patient(user, patient: Patient) -> bool:
    if is_national_scope(user):
        return has_perm(user, PERM_PATIENTS_DELETE)
    if user.role == UserRole.PROVINCE_ADMIN:
        if getattr(user, "view_only", False):
            return False
        pid = province_id_for(user)
        return bool(pid and patient.province_id == pid)
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = get_hospital_admin_profile(user)
        return bool(profile and patient.primary_hospital_id == profile.hospital_id)
    return False


def can_add_clinical_record(user) -> bool:
    if is_national_scope(user):
        return True
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = get_hospital_admin_profile(user)
        return bool(profile and profile.user.is_active_account)
    return False


def can_update_clinical_record(user, hospital) -> bool:
    if is_national_scope(user):
        return True
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = get_hospital_admin_profile(user)
        return bool(profile and profile.hospital_id == hospital.id)
    return False


def assert_patient_eligible(patient: Patient):
    if patient.verification_status != VerificationStatus.ACTIVE:
        return "Only verified (Active) patients can receive new clinical records."
    return None


def validate_factor_for_patient(patient: Patient, factor_medicine) -> tuple[bool, str | None, bool]:
    """
    Returns (ok, error_message, inhibitor_warning).
    Type A + FIX or Type B + FVIII → reject.
    Current inhibitor + standard factor → warn.
    """
    hem_type = patient.hemophilia_type
    applicable = factor_medicine.applicable_type
    factor_type = factor_medicine.factor_type

    if hem_type == "A" and applicable == ApplicableType.B:
        return False, "This product is for Hemophilia B patients only.", False
    if hem_type == "B" and applicable == ApplicableType.A:
        return False, "This product is for Hemophilia A patients only.", False
    if hem_type == "A" and factor_type == FactorType.FIX:
        return False, "Factor IX products cannot be given to Hemophilia A patients.", False
    if hem_type == "B" and factor_type == FactorType.FVIII:
        return False, "Factor VIII products cannot be given to Hemophilia B patients.", False

    inhibitor_warning = (
        patient.inhibitor_status == InhibitorStatus.CURRENT
        and factor_type in STANDARD_FACTOR_TYPES
    )
    return True, None, inhibitor_warning


def create_hospital_visit(patient, hospital, visit_date, reason, injection=None, treatment=None):
    from apps.treatments.models import HospitalVisit

    return HospitalVisit.objects.create(
        patient=patient,
        hospital=hospital,
        visit_date=visit_date,
        reason=reason,
        injection=injection,
        treatment=treatment,
    )
