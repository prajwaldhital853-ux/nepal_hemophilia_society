import logging
import re

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

from apps.core.pagination import paginate_queryset
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


def _patient_search_term(request):
    return (request.query_params.get("search") or request.query_params.get("q") or "").strip()


def _normalize_hem_id(search: str) -> str | None:
    """Normalize HEM-000123, hem-123, or 123 into canonical HEM-0000123."""
    raw = (search or "").strip()
    if not raw:
        return None
    upper = raw.upper()
    if upper.startswith("HEM-"):
        suffix = upper[4:].lstrip("-")
        digits = re.sub(r"\D", "", suffix)
        if digits:
            return f"HEM-{int(digits):07d}"
        return upper
    digits = re.sub(r"\D", "", raw)
    if digits:
        return f"HEM-{int(digits):07d}"
    return None


def _hem_id_queryset(qs, search: str):
    hem_id = _normalize_hem_id(search)
    if not hem_id:
        return None
    return qs.filter(unique_patient_id__iexact=hem_id)


def _province_pk_from_value(value):
    """Resolve a province PK from serializer input (name string or Province instance)."""
    if value is None:
        return None
    from apps.provinces.models import Province

    if isinstance(value, Province):
        return value.pk
    if isinstance(value, str):
        row = Province.objects.filter(name=value.strip()).first()
        return row.pk if row else None
    return getattr(value, "pk", None)


class PatientViewSet(viewsets.ModelViewSet):
    """
    Admin-only patient registry.
    Super / Province Admin create and verify. Hospital Admin searches by HEM-ID.
    """

    queryset = Patient.objects.select_related(
        "province", "district", "primary_hospital", "created_by", "user"
    )
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if getattr(self, "action", None) == "list":
            context["omit_documents"] = True
        return context

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self, "action", None) != "list":
            qs = qs.prefetch_related("files__uploaded_by", "files__hospital")
        user = self.request.user
        if is_national_scope(user):
            return qs
        search = _patient_search_term(self.request)
        if user.role == UserRole.PROVINCE_ADMIN:
            if self.action == "retrieve":
                return qs
            hem_qs = _hem_id_queryset(qs, search) if search else None
            if hem_qs is not None:
                return hem_qs
            pid = province_id_for(user)
            return qs.filter(province_id=pid) if pid else qs.none()
        if user.role == UserRole.HOSPITAL_ADMIN:
            if self.action == "retrieve":
                return qs
            hem_qs = _hem_id_queryset(qs, search) if search else None
            if hem_qs is not None:
                return hem_qs
            hid = hospital_id_for(user)
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
        date_from = (request.query_params.get("from") or "").strip()
        date_to = (request.query_params.get("to") or "").strip()
        if date_from:
            queryset = queryset.filter(updated_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(updated_at__date__lte=date_to)
        rows, next_cursor, limit = paginate_queryset(queryset, request)
        serializer = self.get_serializer(rows, many=True)
        return Response({"patients": serializer.data, "nextCursor": next_cursor, "limit": limit})

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
            if province and _province_pk_from_value(province) != pid:
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
        from apps.notifications.services import notify_patient_deleted

        notify_patient_deleted(instance, user=request.user)
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
            province = serializer.validated_data.get("province")
            target_pid = _province_pk_from_value(province) if province is not None else instance.province_id
            if target_pid != pid:
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
            .prefetch_related("files__uploaded_by", "files__hospital")
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
