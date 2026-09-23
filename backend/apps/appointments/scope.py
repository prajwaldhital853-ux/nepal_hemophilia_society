from apps.accounts.rbac import hospital_id_for, is_national_scope, province_id_for
from apps.appointments.models import Appointment


def appointments_for_admin(user):
    qs = Appointment.objects.select_related("patient", "hospital", "hospital__province", "handled_by")
    if is_national_scope(user):
        return qs
    province_id = province_id_for(user)
    hospital_id = hospital_id_for(user)
    if hospital_id and getattr(user, "role", "") == "hospital_admin":
        return qs.filter(hospital_id=hospital_id)
    if province_id:
        return qs.filter(hospital__province_id=province_id)
    return qs.none()
