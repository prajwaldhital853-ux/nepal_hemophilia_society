import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import (
    CanCreatePatients,
    CanDeletePatients,
    CanUpdatePatients,
    CanVerifyPatients,
    CanViewPatients,
    IsAdminRole,
    IsPatientRole,
    PatientPasswordUsable,
)
from apps.accounts.rbac import hospital_id_for, is_national_scope, province_id_for
from apps.audit.models import AuditLog
from apps.core.clinical import can_view_patient
from apps.patients.models import Patient, VerificationStatus
from apps.patients.serializers import PatientSerializer

logger = logging.getLogger(__name__)


def client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        candidate = forwarded.split(",")[0].strip()
        if candidate:
            return candidate
    remote = request.META.get("REMOTE_ADDR")
    return remote or None


class PatientViewSet(viewsets.ModelViewSet):
    """
    Admin-only patient registry.
    Super / Province Admin create and verify. Hospital Admin searches by HEM-ID.
    """

    queryset = Patient.objects.select_related(
        "province", "district", "primary_hospital", "created_by", "user"
    ).prefetch_related("files")
    serializer_class = PatientSerializer
    permission_classes = [IsAdminRole, CanViewPatients]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    lookup_field = "unique_patient_id"
    lookup_url_kwarg = "id"
    lookup_value_regex = r"HEM-[0-9]+"
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
    search_fields = ("unique_patient_id", "full_name", "mobile", "email", "blood_group")
    filterset_fields = ("verification_status", "hemophilia_type", "severity")

    def get_permissions(self):
        if self.action == "create":
            return [IsAdminRole(), CanCreatePatients()]
        if self.action in ("update", "partial_update"):
            return [IsAdminRole(), CanUpdatePatients()]
        if self.action in ("verify", "reject"):
            return [IsAdminRole(), CanVerifyPatients()]
        if self.action == "destroy":
            return [IsAdminRole(), CanDeletePatients()]
        return [IsAdminRole(), CanViewPatients()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_national_scope(user):
            return qs
        if user.role == UserRole.PROVINCE_ADMIN:
            pid = province_id_for(user)
            return qs.filter(province_id=pid) if pid else qs.none()
        if user.role == UserRole.HOSPITAL_ADMIN:
            hid = hospital_id_for(user)
            if self.action == "retrieve":
                return qs
            search = (self.request.query_params.get("search") or self.request.query_params.get("q") or "").strip()
            if search.upper().startswith("HEM-"):
                return qs.filter(unique_patient_id__iexact=search.upper())
            return qs.filter(primary_hospital_id=hid) if hid else qs.none()
        return qs.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        search = (request.query_params.get("search") or request.query_params.get("q") or "").strip()
        if search and request.user.role != UserRole.HOSPITAL_ADMIN:
            queryset = queryset.filter(
                Q(unique_patient_id__icontains=search)
                | Q(full_name__icontains=search)
                | Q(mobile__icontains=search)
                | Q(email__icontains=search)
            )
        serializer = self.get_serializer(queryset, many=True)
        return Response({"patients": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not can_view_patient(request.user, instance):
            raise PermissionDenied("You cannot view this patient.")
        return Response({"patient": self.get_serializer(instance).data})

    def _assert_province_scope(self, patient):
        if self.request.user.role == UserRole.PROVINCE_ADMIN:
            pid = province_id_for(self.request.user)
            if not pid or patient.province_id != pid:
                raise PermissionDenied("Province Admin can only manage patients in their own province.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.role == UserRole.PROVINCE_ADMIN:
            pid = province_id_for(request.user)
            province = serializer.validated_data.get("province")
            if province and getattr(province, "pk", None) != pid:
                return Response(
                    {"error": "Province Admin can only register patients in their own province."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        try:
            patient = serializer.save()
        except IntegrityError:
            return Response(
                {"error": "A patient or login account with this email or ID already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            messages = getattr(exc, "messages", [str(exc)])
            return Response({"error": " ".join(messages)}, status=status.HTTP_400_BAD_REQUEST)
        except DatabaseError as exc:
            logger.exception("Patient create database error")
            return Response(
                {"error": f"Database error while saving patient: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            logger.exception("Patient create failed")
            return Response(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        try:
            AuditLog.objects.create(
                actor=request.user.get_username(),
                action="Created patient record",
                module="Patients",
                object_id=patient.unique_patient_id,
                ip=client_ip(request),
                detail=f"Admin created {patient.unique_patient_id} ({patient.full_name})",
            )
        except Exception:
            logger.exception("Patient created but audit log write failed for %s", patient.unique_patient_id)
        body = {"patient": PatientSerializer(patient, context={"request": request}).data}
        temp = getattr(serializer, "issued_temporary_password", None)
        if temp:
            body["credentials"] = {
                "patientId": patient.unique_patient_id,
                "email": patient.email,
                "temporaryPassword": temp,
            }
        return Response(body, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self._assert_province_scope(instance)
        patient_id = instance.unique_patient_id
        name = instance.full_name
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {"error": "This patient has treatment or injection records and cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Deleted patient record",
            module="Patients",
            object_id=patient_id,
            ip=client_ip(request),
            detail=f"Admin deleted {patient_id} ({name})",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        self._assert_province_scope(instance)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.role == UserRole.PROVINCE_ADMIN:
            pid = province_id_for(request.user)
            province = serializer.validated_data.get("province") or instance.province
            if getattr(province, "pk", None) != pid:
                return Response(
                    {"error": "Cannot move a patient outside your province."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        try:
            patient = serializer.save()
        except IntegrityError:
            return Response(
                {"error": "A patient or login account with this email or ID already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            messages = getattr(exc, "messages", [str(exc)])
            return Response({"error": " ".join(messages)}, status=status.HTTP_400_BAD_REQUEST)
        except DatabaseError as exc:
            logger.exception("Patient update database error")
            return Response(
                {"error": f"Database error while saving patient: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            logger.exception("Patient update failed")
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            AuditLog.objects.create(
                actor=request.user.get_username(),
                action="Updated patient record",
                module="Patients",
                object_id=patient.unique_patient_id,
                ip=client_ip(request),
                detail=f"Admin updated {patient.unique_patient_id}",
            )
        except Exception:
            logger.exception("Patient updated but audit log write failed for %s", patient.unique_patient_id)
        return Response({"patient": PatientSerializer(patient, context={"request": request}).data})

    @action(detail=True, methods=["put", "post"], url_path="verify")
    def verify(self, request, id=None):
        patient = self.get_object()
        self._assert_province_scope(patient)
        patient.verification_status = VerificationStatus.ACTIVE
        patient.save(update_fields=["verification_status", "updated_at"])
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Verified patient",
            module="Patients",
            object_id=patient.unique_patient_id,
            ip=client_ip(request),
            detail=f"Verified {patient.unique_patient_id}",
        )
        return Response({"patient": PatientSerializer(patient, context={"request": request}).data})

    @action(detail=True, methods=["put", "post"], url_path="reject")
    def reject(self, request, id=None):
        patient = self.get_object()
        self._assert_province_scope(patient)
        reason = str(request.data.get("reason") or "").strip()
        patient.verification_status = VerificationStatus.REJECTED
        if reason:
            note = (patient.notes or "").strip()
            patient.notes = f"{note}\nRejected: {reason}".strip()
            patient.save(update_fields=["verification_status", "notes", "updated_at"])
        else:
            patient.save(update_fields=["verification_status", "updated_at"])
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Rejected patient",
            module="Patients",
            object_id=patient.unique_patient_id,
            ip=client_ip(request),
            detail=reason or f"Rejected {patient.unique_patient_id}",
        )
        return Response({"patient": PatientSerializer(patient, context={"request": request}).data})


class PatientMeView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return Response({"error": "No patient record is linked to this account."}, status=404)
        patient = (
            Patient.objects.select_related("province", "district", "primary_hospital", "user")
            .prefetch_related("files")
            .get(pk=patient.pk)
        )
        return Response({"patient": PatientSerializer(patient, context={"request": request}).data})


def _flatten_errors(detail):
    if isinstance(detail, dict):
        parts = []
        for key, value in detail.items():
            if isinstance(value, (list, tuple)):
                parts.append(f"{key}: {value[0]}")
            else:
                parts.append(f"{key}: {value}")
        return "; ".join(parts)
    if isinstance(detail, list):
        return str(detail[0])
    return str(detail)
