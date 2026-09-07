from django.db.models import Q
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import CanAddInjections, CanCorrectInjections, CanViewClinical, IsAdminRole
from apps.accounts.rbac import hospital_id_for, province_id_for
from apps.audit.models import AuditLog
from apps.core.clinical import can_view_patient
from apps.injections.models import InjectionRecord
from apps.injections.serializers import (
    InjectionCorrectionSerializer,
    InjectionCreateSerializer,
    InjectionRecordSerializer,
    InjectionUpdateSerializer,
)
from apps.patients.models import Patient
from apps.patients.views import _flatten_errors, client_ip


def _injection_queryset():
    return InjectionRecord.objects.select_related(
        "patient",
        "hospital",
        "hospital__province",
        "factor_medicine",
        "administered_by",
    ).filter(is_void=False)


def _scope_injections(user, qs, patient_id=None):
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


class InjectionListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdminRole(), CanAddInjections()]
        return [IsAuthenticated(), CanViewClinical()]

    def get(self, request):
        patient_id = request.query_params.get("patientId", "").strip()
        qs = _scope_injections(request.user, _injection_queryset(), patient_id=patient_id or None)
        hospital_id = request.query_params.get("hospitalId", "").strip()
        date_from = request.query_params.get("from", "").strip()
        date_to = request.query_params.get("to", "").strip()
        if patient_id:
            qs = qs.filter(patient__unique_patient_id__iexact=patient_id)
        if hospital_id:
            qs = qs.filter(hospital_id=hospital_id)
        if date_from:
            qs = qs.filter(administered_at__date__gte=date_from)
        status_filter = request.query_params.get("status", "").strip()
        if status_filter and status_filter != "All":
            qs = qs.filter(status=status_filter)
        indication = request.query_params.get("indication", "").strip()
        if indication and indication != "All":
            qs = qs.filter(indication=indication)
        if date_to:
            qs = qs.filter(administered_at__date__lte=date_to)
        data = InjectionRecordSerializer(qs.order_by("-administered_at")[:500], many=True).data
        return Response({"injections": data, "total": qs.count()})

    def post(self, request):
        serializer = InjectionCreateSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        record = serializer.save()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Added injection record",
            module="Injections",
            object_id=str(record.id),
            ip=client_ip(request),
            detail=f"{record.patient.unique_patient_id} — {record.factor_type} {record.dose}{record.unit}",
        )
        return Response({"injection": InjectionRecordSerializer(record).data}, status=201)


class InjectionDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated(), CanViewClinical()]

    def get(self, request, pk):
        record = _injection_queryset().filter(pk=pk).first()
        if not record:
            raise NotFound("Injection record not found.")
        if not can_view_patient(request.user, record.patient):
            raise PermissionDenied("You cannot view this injection record.")
        return Response({"injection": InjectionRecordSerializer(record).data})

    def patch(self, request, pk):
        if not IsAdminRole().has_permission(request, self):
            raise PermissionDenied()
        record = _injection_queryset().filter(pk=pk).first()
        if not record:
            raise NotFound("Injection record not found.")
        serializer = InjectionUpdateSerializer(
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
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action=f"Updated injection status to {record.status}",
            module="Injections",
            object_id=str(record.id),
            ip=client_ip(request),
            detail=f"{record.patient.unique_patient_id} injection #{record.id}",
        )
        return Response({"injection": InjectionRecordSerializer(record).data})


class InjectionCorrectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanCorrectInjections]

    def post(self, request, pk):
        if request.user.role != UserRole.SUPER_ADMIN:
            raise PermissionDenied("Only super admin can correct injection records.")
        original = _injection_queryset().filter(pk=pk).first()
        if not original:
            raise NotFound("Injection record not found.")
        serializer = InjectionCorrectionSerializer(
            data=request.data,
            context={"request": request, "original": original},
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        record = serializer.save()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Corrected injection record",
            module="Injections",
            object_id=str(record.id),
            ip=client_ip(request),
            detail=f"Corrects #{original.id} for {record.patient.unique_patient_id}",
        )
        return Response({"injection": InjectionRecordSerializer(record).data, "voidedId": original.id})
