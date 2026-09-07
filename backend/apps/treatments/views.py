from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import CanAddTreatments, CanViewClinical, IsAdminRole
from apps.accounts.rbac import hospital_id_for, province_id_for
from apps.audit.models import AuditLog
from apps.core.clinical import can_view_patient
from apps.patients.views import _flatten_errors, client_ip
from apps.treatments.models import TreatmentRecord
from apps.treatments.serializers import TreatmentCreateSerializer, TreatmentRecordSerializer, TreatmentUpdateSerializer


def _treatment_queryset():
    return TreatmentRecord.objects.select_related(
        "patient",
        "hospital",
        "hospital__province",
        "recorded_by",
    )


def _scope_treatments(user, qs, patient_id=None):
    if user.role == UserRole.SUPER_ADMIN:
        return qs
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        return qs.filter(patient__province_id=pid) if pid else qs.none()
    if user.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(user)
        if patient_id:
            return qs
        return qs.filter(hospital_id=hid) if hid else qs.none()
    if user.role == UserRole.PATIENT:
        profile = getattr(user, "patient_profile", None)
        if profile:
            return qs.filter(patient_id=profile.pk)
        return qs.none()
    return qs.none()


class TreatmentListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdminRole(), CanAddTreatments()]
        return [IsAuthenticated(), CanViewClinical()]

    def get(self, request):
        patient_id = request.query_params.get("patientId", "").strip()
        qs = _scope_treatments(request.user, _treatment_queryset(), patient_id=patient_id or None)
        hospital_id = request.query_params.get("hospitalId", "").strip()
        if patient_id:
            qs = qs.filter(patient__unique_patient_id__iexact=patient_id)
        if hospital_id:
            qs = qs.filter(hospital_id=hospital_id)
        status_filter = request.query_params.get("status", "").strip()
        if status_filter and status_filter != "All":
            qs = qs.filter(status=status_filter)
        data = TreatmentRecordSerializer(qs.order_by("-treatment_date")[:500], many=True).data
        return Response({"treatments": data, "total": qs.count()})

    def post(self, request):
        serializer = TreatmentCreateSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        record = serializer.save()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Added treatment record",
            module="Treatments",
            object_id=str(record.id),
            ip=client_ip(request),
            detail=f"{record.patient.unique_patient_id} — {record.treatment_type}",
        )
        return Response({"treatment": TreatmentRecordSerializer(record).data}, status=201)


class TreatmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        record = _treatment_queryset().filter(pk=pk).first()
        if not record:
            raise NotFound("Treatment record not found.")
        if not can_view_patient(request.user, record.patient):
            raise PermissionDenied("You cannot view this treatment record.")
        return Response({"treatment": TreatmentRecordSerializer(record).data})

    def patch(self, request, pk):
        if not IsAdminRole().has_permission(request, self):
            raise PermissionDenied()
        record = _treatment_queryset().filter(pk=pk).first()
        if not record:
            raise NotFound("Treatment record not found.")
        serializer = TreatmentUpdateSerializer(
            record,
            data=request.data,
            partial=True,
            context={"request": request, "record": record},
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        record = serializer.save()
        return Response({"treatment": TreatmentRecordSerializer(record).data})
