from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import (
    CanViewClinical,
    CanViewPatientClinicalHistory,
    CanViewTreatments,
    IsAdminRole,
    IsPatientRole,
    PatientPasswordUsable,
)
from apps.core.clinical import can_view_patient
from apps.injections.serializers import InjectionRecordSerializer
from apps.injections.views import _injection_queryset, _scope_injections
from apps.core.pagination import paginate_queryset
from apps.patients.insights import build_patient_insights
from apps.patients.models import Patient
from apps.treatments.models import HospitalVisit
from apps.treatments.serializers import HospitalVisitSerializer, TreatmentRecordSerializer
from apps.treatments.views import _scope_treatments, _treatment_queryset


def _get_patient_or_404(patient_id: str) -> Patient:
    patient = Patient.objects.filter(unique_patient_id__iexact=patient_id.strip()).first()
    if not patient:
        raise NotFound("Patient not found.")
    return patient


class PatientInjectionsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanViewClinical]

    def get(self, request, patient_id):
        patient = _get_patient_or_404(patient_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied()
        qs = _scope_injections(
            request.user,
            _injection_queryset().filter(patient=patient),
            patient_id=patient.unique_patient_id,
        )
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "injections": InjectionRecordSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )


class PatientTreatmentsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanViewTreatments]

    def get(self, request, patient_id):
        patient = _get_patient_or_404(patient_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied()
        qs = _scope_treatments(
            request.user,
            _treatment_queryset().filter(patient=patient),
            patient_id=patient.unique_patient_id,
        )
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "treatments": TreatmentRecordSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )


class PatientVisitsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, patient_id):
        patient = _get_patient_or_404(patient_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied()
        from apps.core.pagination import paginate_offset

        qs = HospitalVisit.objects.select_related("hospital", "hospital__province").filter(patient=patient)
        rows, next_cursor, limit = paginate_offset(qs.order_by("-visit_date"), request, default=50)
        return Response(
            {
                "visits": HospitalVisitSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )


class PatientHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanViewPatientClinicalHistory]

    def get(self, request, patient_id):
        patient = _get_patient_or_404(patient_id)
        if not can_view_patient(request.user, patient):
            raise PermissionDenied()
        injections = _scope_injections(
            request.user,
            _injection_queryset().filter(patient=patient),
            patient_id=patient.unique_patient_id,
        ).order_by("-administered_at")[:100]
        treatments = _scope_treatments(
            request.user,
            _treatment_queryset().filter(patient=patient),
            patient_id=patient.unique_patient_id,
        ).order_by("-treatment_date")[:100]
        visits = HospitalVisit.objects.select_related("hospital").filter(patient=patient).order_by("-visit_date")[:100]
        timeline = []
        for item in injections:
            timeline.append(
                {
                    "type": "injection",
                    "at": item.administered_at.isoformat(),
                    "label": InjectionRecordSerializer(item).data["label"],
                    "hospital": item.hospital.name,
                    "id": item.id,
                }
            )
        for item in treatments:
            timeline.append(
                {
                    "type": "treatment",
                    "at": item.treatment_date.isoformat(),
                    "label": TreatmentRecordSerializer(item).data["label"],
                    "hospital": item.hospital.name,
                    "id": item.id,
                }
            )
        timeline.sort(key=lambda x: x["at"], reverse=True)
        return Response(
            {
                "patientId": patient.unique_patient_id,
                "timeline": timeline,
                "injections": InjectionRecordSerializer(injections, many=True).data,
                "treatments": TreatmentRecordSerializer(treatments, many=True).data,
                "visits": HospitalVisitSerializer(visits, many=True).data,
            }
        )


class PatientMeInjectionsView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return Response({"error": "No patient profile linked."}, status=404)
        qs = _injection_queryset().filter(patient=patient)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "injections": InjectionRecordSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )


class PatientMeTreatmentsView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return Response({"error": "No patient profile linked."}, status=404)
        qs = _treatment_queryset().filter(patient=patient)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "treatments": TreatmentRecordSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )


class PatientMeVisitsView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return Response({"error": "No patient profile linked."}, status=404)
        from apps.core.pagination import paginate_offset

        qs = HospitalVisit.objects.select_related("hospital", "hospital__province").filter(patient=patient)
        rows, next_cursor, limit = paginate_offset(qs.order_by("-visit_date"), request, default=50)
        return Response(
            {
                "visits": HospitalVisitSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )


class PatientMeInsightsView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return Response({"error": "No patient profile linked."}, status=404)
        return Response({"insights": build_patient_insights(patient)})


class PatientMeHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return Response({"error": "No patient profile linked."}, status=404)
        injections = _injection_queryset().filter(patient=patient).order_by("-administered_at")[:100]
        treatments = _treatment_queryset().filter(patient=patient).order_by("-treatment_date")[:100]
        visits = HospitalVisit.objects.select_related("hospital").filter(patient=patient).order_by("-visit_date")[:100]
        timeline = []
        for item in injections:
            timeline.append(
                {
                    "type": "injection",
                    "at": item.administered_at.isoformat(),
                    "label": InjectionRecordSerializer(item).data["label"],
                    "hospital": item.hospital.name,
                    "id": item.id,
                }
            )
        for item in treatments:
            timeline.append(
                {
                    "type": "treatment",
                    "at": item.treatment_date.isoformat(),
                    "label": TreatmentRecordSerializer(item).data["label"],
                    "hospital": item.hospital.name,
                    "id": item.id,
                }
            )
        timeline.sort(key=lambda x: x["at"], reverse=True)
        return Response(
            {
                "patientId": patient.unique_patient_id,
                "timeline": timeline,
                "injections": InjectionRecordSerializer(injections, many=True).data,
                "treatments": TreatmentRecordSerializer(treatments, many=True).data,
                "visits": HospitalVisitSerializer(visits, many=True).data,
            }
        )
