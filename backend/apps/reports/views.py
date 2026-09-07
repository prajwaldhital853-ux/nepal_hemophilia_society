from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsAdminRole
from apps.accounts.rbac import hospital_id_for, province_id_for
from apps.hospitals.models import Hospital
from apps.injections.models import InjectionRecord
from apps.patients.models import Patient
from apps.treatments.models import TreatmentRecord


class ReportSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        patients = Patient.objects.all()
        injections = InjectionRecord.objects.filter(is_void=False)
        treatments = TreatmentRecord.objects.all()
        hospitals = Hospital.objects.filter(is_active=True)

        if request.user.role == UserRole.PROVINCE_ADMIN:
            pid = province_id_for(request.user)
            patients = patients.filter(province_id=pid)
            injections = injections.filter(patient__province_id=pid)
            treatments = treatments.filter(patient__province_id=pid)
            hospitals = hospitals.filter(province_id=pid)
        elif request.user.role == UserRole.HOSPITAL_ADMIN:
            hid = hospital_id_for(request.user)
            patients = patients.filter(primary_hospital_id=hid)
            injections = injections.filter(hospital_id=hid)
            treatments = treatments.filter(hospital_id=hid)
            hospitals = hospitals.filter(pk=hid)

        return Response(
            {
                "scope": request.user.role,
                "totals": {
                    "patients": patients.count(),
                    "hospitals": hospitals.count(),
                    "injections": injections.count(),
                    "treatments": treatments.count(),
                    "activePatients": patients.filter(verification_status="Active").count(),
                },
            }
        )
