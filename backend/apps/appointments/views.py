from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole, IsPatientRole, PatientPasswordUsable
from apps.accounts.rbac import PERM_APPOINTMENTS_DELETE, PERM_APPOINTMENTS_UPDATE, PERM_APPOINTMENTS_VIEW, has_perm
from apps.appointments.models import Appointment, AppointmentSlot, AppointmentStatus, VisitType
from apps.appointments.scope import appointments_for_admin
from apps.appointments.serializers import AppointmentSerializer
from apps.hospitals.models import Hospital
from apps.notifications.models import NotificationCategory
from apps.notifications.services import _actor_label, notify_admins, notify_patient


OPEN_FOR_PATIENT_CANCEL = {
    AppointmentStatus.REQUESTED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.RESCHEDULED,
}


def _notify_request(appointment, user):
    when = timezone.localtime(appointment.preferred_at).strftime("%d %b %Y %I:%M %p")
    notify_patient(
        patient=appointment.patient,
        category=NotificationCategory.APPOINTMENT,
        title="Appointment request sent",
        message=(
            f"Your {appointment.get_visit_type_display()} request for {when} at "
            f"{appointment.hospital.name} was sent. You will be notified when the centre responds."
        ),
        user=user,
        related_type="appointment",
        related_id=appointment.id,
    )
    notify_admins(
        hospital=appointment.hospital,
        category=NotificationCategory.APPOINTMENT,
        title="New appointment request",
        message=(
            f"{appointment.patient.full_name} ({appointment.patient.unique_patient_id}) requested "
            f"{appointment.get_visit_type_display()} at {appointment.hospital.name} for {when}. "
            f"Reason: {appointment.reason[:180]}"
        ),
        actor=user,
        related_type="appointment",
        related_id=appointment.id,
    )


def _notify_decision(appointment, user):
    scheduled = appointment.scheduled_at or appointment.preferred_at
    when = timezone.localtime(scheduled).strftime("%d %b %Y %I:%M %p")
    doctor = f" with {appointment.doctor_name}" if appointment.doctor_name else ""
    note = f" Note: {appointment.admin_note}" if appointment.admin_note else ""
    notify_patient(
        patient=appointment.patient,
        category=NotificationCategory.APPOINTMENT,
        title=f"Appointment {appointment.get_status_display().lower()}",
        message=(
            f"Your {appointment.get_visit_type_display()} at {appointment.hospital.name} is "
            f"{appointment.get_status_display().lower()}{doctor}. Time: {when}.{note}"
        ),
        user=user,
        related_type="appointment",
        related_id=appointment.id,
    )


class PatientAppointmentsView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        rows = Appointment.objects.filter(patient=patient).select_related("hospital", "hospital__province", "handled_by")
        return Response({"appointments": AppointmentSerializer(rows, many=True).data})

    def post(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        visit_type = str(request.data.get("visitType") or VisitType.CLINIC)
        if visit_type not in VisitType.values:
            raise ValidationError({"visitType": "Choose a visit type."})
        reason = str(request.data.get("reason") or "").strip()
        if len(reason) < 4:
            raise ValidationError({"reason": "Tell the centre why you need this visit."})
        preferred_raw = request.data.get("preferredAt")
        try:
            preferred_at = timezone.datetime.fromisoformat(str(preferred_raw).replace("Z", "+00:00"))
            if timezone.is_naive(preferred_at):
                preferred_at = timezone.make_aware(preferred_at, timezone.get_current_timezone())
        except (TypeError, ValueError):
            raise ValidationError({"preferredAt": "Choose a valid date and time."})
        if preferred_at <= timezone.now():
            raise ValidationError({"preferredAt": "Choose a future date and time."})
        hospital_id = request.data.get("hospitalId")
        hospital = None
        if hospital_id:
            hospital = Hospital.objects.filter(pk=hospital_id, is_active=True).first()
        if hospital is None and patient.primary_hospital_id:
            hospital = patient.primary_hospital
        if hospital is None:
            raise ValidationError({"hospitalId": "Choose a treatment centre."})
        appointment = Appointment.objects.create(
            patient=patient,
            hospital=hospital,
            visit_type=visit_type,
            reason=reason,
            preferred_at=preferred_at,
            patient_note=str(request.data.get("patientNote") or "").strip(),
        )
        _notify_request(appointment, request.user)
        return Response({"appointment": AppointmentSerializer(appointment).data}, status=201)


class PatientAppointmentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def post(self, request, pk):
        patient = getattr(request.user, "patient_profile", None)
        appointment = Appointment.objects.filter(pk=pk, patient=patient).select_related("hospital", "patient").first()
        if not appointment:
            raise NotFound("Appointment not found.")
        if request.data.get("action") != "cancel":
            raise ValidationError({"action": "Patients can cancel a request."})
        if appointment.status not in OPEN_FOR_PATIENT_CANCEL:
            raise ValidationError({"action": "This appointment can no longer be cancelled."})
        appointment.status = AppointmentStatus.CANCELLED
        appointment.patient_note = str(request.data.get("patientNote") or appointment.patient_note)
        appointment.save(update_fields=["status", "patient_note", "updated_at"])
        notify_admins(
            hospital=appointment.hospital,
            category=NotificationCategory.APPOINTMENT,
            title="Appointment cancelled by patient",
            message=f"{patient.full_name} ({patient.unique_patient_id}) cancelled their {appointment.get_visit_type_display()} request.",
            actor=request.user,
            related_type="appointment",
            related_id=appointment.id,
        )
        return Response({"appointment": AppointmentSerializer(appointment).data})


def _slot_payload(slot):
    return {
        "id": slot.id,
        "hospitalId": slot.hospital_id,
        "hospitalName": slot.hospital.name,
        "slotAt": slot.slot_at.isoformat(),
        "capacity": slot.capacity,
    }


def _slots_scope(user):
    from apps.accounts.rbac import hospital_id_for, is_national_scope, province_id_for

    qs = AppointmentSlot.objects.select_related("hospital").filter(slot_at__gte=timezone.now())
    if is_national_scope(user):
        return qs
    hospital_id = hospital_id_for(user)
    if hospital_id and getattr(user, "role", "") == "hospital_admin":
        return qs.filter(hospital_id=hospital_id)
    province_id = province_id_for(user)
    if province_id:
        return qs.filter(hospital__province_id=province_id)
    return qs.none()


class PatientAppointmentSlotsView(APIView):
    """Upcoming bookable dates and times published by a centre."""

    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        hospital_id = request.query_params.get("hospitalId")
        qs = AppointmentSlot.objects.select_related("hospital").filter(slot_at__gte=timezone.now())
        if hospital_id:
            qs = qs.filter(hospital_id=hospital_id)
        return Response({"slots": [_slot_payload(slot) for slot in qs[:120]]})


class AdminAppointmentSlotsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        if not has_perm(request.user, PERM_APPOINTMENTS_VIEW):
            raise PermissionDenied("You cannot view appointment slots.")
        return Response({"slots": [_slot_payload(slot) for slot in _slots_scope(request.user)[:200]]})

    def post(self, request):
        if not has_perm(request.user, PERM_APPOINTMENTS_UPDATE):
            raise PermissionDenied("You cannot add appointment slots.")
        hospital_id = request.data.get("hospitalId")
        hospital = Hospital.objects.filter(pk=hospital_id, is_active=True).select_related("province").first()
        if not hospital:
            raise ValidationError({"hospitalId": "Choose a treatment centre."})
        from apps.accounts.rbac import hospital_id_for, is_national_scope, province_id_for

        if not is_national_scope(request.user):
            own_hospital = hospital_id_for(request.user)
            if getattr(request.user, "role", "") == "hospital_admin":
                if own_hospital != hospital.id:
                    raise PermissionDenied("You can only add slots for your own centre.")
            elif province_id_for(request.user) != hospital.province_id:
                raise PermissionDenied("This centre is outside your province.")
        raw_times = request.data.get("times") or []
        if isinstance(raw_times, str):
            raw_times = [raw_times]
        created = []
        errors = []
        for raw in raw_times[:30]:
            try:
                slot_at = timezone.datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
                if timezone.is_naive(slot_at):
                    slot_at = timezone.make_aware(slot_at, timezone.get_current_timezone())
            except (TypeError, ValueError):
                errors.append(f"Invalid time: {raw}")
                continue
            if slot_at <= timezone.now():
                errors.append("Slots must be in the future.")
                continue
            slot, was_created = AppointmentSlot.objects.get_or_create(
                hospital=hospital,
                slot_at=slot_at,
                defaults={"created_by": request.user, "capacity": int(request.data.get("capacity") or 1)},
            )
            if was_created:
                created.append(slot)
        if not created and errors:
            raise ValidationError({"times": " ".join(errors[:3])})
        return Response({"slots": [_slot_payload(slot) for slot in created]}, status=201)


class AdminAppointmentSlotDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def delete(self, request, pk):
        if not has_perm(request.user, PERM_APPOINTMENTS_UPDATE):
            raise PermissionDenied("You cannot remove appointment slots.")
        slot = _slots_scope(request.user).filter(pk=pk).first()
        if not slot:
            raise NotFound("Slot not found.")
        slot.delete()
        return Response(status=204)


class AdminAppointmentsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        if not has_perm(request.user, PERM_APPOINTMENTS_VIEW):
            raise PermissionDenied("You cannot view appointments.")
        qs = appointments_for_admin(request.user)
        status = (request.query_params.get("status") or "").strip()
        if status in AppointmentStatus.values:
            qs = qs.filter(status=status)
        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(Q(patient__full_name__icontains=search) | Q(patient__unique_patient_id__icontains=search))
        return Response(
            {
                "appointments": AppointmentSerializer(qs[:200], many=True).data,
                "canUpdate": has_perm(request.user, PERM_APPOINTMENTS_UPDATE),
                "canDelete": has_perm(request.user, PERM_APPOINTMENTS_DELETE),
            }
        )


class AdminAppointmentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def _get(self, request, pk):
        row = appointments_for_admin(request.user).filter(pk=pk).first()
        if not row:
            raise NotFound("Appointment not found.")
        return row

    def put(self, request, pk):
        if not has_perm(request.user, PERM_APPOINTMENTS_UPDATE):
            raise PermissionDenied("You cannot update appointments.")
        appointment = self._get(request, pk)
        status = str(request.data.get("status") or appointment.status)
        if status not in AppointmentStatus.values:
            raise ValidationError({"status": "Unknown status."})
        scheduled_raw = request.data.get("scheduledAt")
        scheduled_at = appointment.scheduled_at
        if scheduled_raw:
            try:
                scheduled_at = timezone.datetime.fromisoformat(str(scheduled_raw).replace("Z", "+00:00"))
                if timezone.is_naive(scheduled_at):
                    scheduled_at = timezone.make_aware(scheduled_at, timezone.get_current_timezone())
            except (TypeError, ValueError):
                raise ValidationError({"scheduledAt": "Choose a valid date and time."})
        doctor = str(request.data.get("doctorName") if "doctorName" in request.data else appointment.doctor_name).strip()
        if status in (AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED):
            if not scheduled_at:
                raise ValidationError({"scheduledAt": "Set the confirmed date and time."})
            if not doctor:
                raise ValidationError({"doctorName": "Name the doctor or clinician."})
        appointment.status = status
        appointment.scheduled_at = scheduled_at
        appointment.doctor_name = doctor
        if "adminNote" in request.data:
            appointment.admin_note = str(request.data.get("adminNote") or "").strip()
        appointment.handled_by = request.user
        appointment.save()
        _notify_decision(appointment, request.user)
        notify_admins(
            hospital=appointment.hospital,
            category=NotificationCategory.APPOINTMENT,
            title=f"Appointment {appointment.get_status_display().lower()}",
            message=(
                f"{_actor_label(request.user)} set {appointment.patient.full_name} "
                f"({appointment.patient.unique_patient_id}) to {appointment.get_status_display().lower()} "
                f"at {appointment.hospital.name}."
            ),
            actor=request.user,
            related_type="appointment",
            related_id=appointment.id,
        )
        return Response({"appointment": AppointmentSerializer(appointment).data})

    def delete(self, request, pk):
        if not has_perm(request.user, PERM_APPOINTMENTS_DELETE):
            raise PermissionDenied("You cannot delete appointments.")
        appointment = self._get(request, pk)
        notify_admins(
            hospital=appointment.hospital,
            category=NotificationCategory.APPOINTMENT,
            title="Appointment deleted",
            message=(
                f"{_actor_label(request.user)} deleted the {appointment.get_visit_type_display()} "
                f"for {appointment.patient.full_name} ({appointment.patient.unique_patient_id}) "
                f"at {appointment.hospital.name}."
            ),
            actor=request.user,
            related_type="appointment",
            related_id=appointment.id,
        )
        notify_patient(
            patient=appointment.patient,
            category=NotificationCategory.APPOINTMENT,
            title="Appointment removed",
            message=(
                f"Your {appointment.get_visit_type_display()} at {appointment.hospital.name} was removed "
                f"by {_actor_label(request.user)}."
            ),
            user=request.user,
            related_type="appointment",
            related_id=appointment.id,
        )
        appointment.delete()
        return Response(status=204)
