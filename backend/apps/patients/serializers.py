import os
import re
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model, password_validation
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.hospitals.models import Hospital
from apps.patients.models import Patient, PatientDocument
from apps.provinces.models import District, Province

User = get_user_model()

NEPAL_MOBILE = re.compile(r"^(97|98)\d{8}$")
ALLOWED_DOC_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def normalize_mobile(value: str) -> str:
    raw = re.sub(r"\s+", "", value or "")
    raw = re.sub(r"^\+977", "", raw)
    return raw


def split_name(full_name: str):
    parts = (full_name or "").strip().split()
    if not parts:
        return "Patient", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


class PatientSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="unique_patient_id", read_only=True)
    fullName = serializers.CharField(source="full_name")
    dateOfBirth = serializers.DateField(source="date_of_birth")
    mobile = serializers.CharField()
    email = serializers.EmailField()
    province = serializers.CharField()
    district = serializers.CharField()
    localLevel = serializers.CharField(source="local_level")
    wardNumber = serializers.CharField(source="ward_number")
    bloodGroup = serializers.CharField(source="blood_group")
    hemophiliaType = serializers.CharField(source="hemophilia_type")
    deficientFactor = serializers.CharField(source="deficient_factor", read_only=True)
    baselineFactorLevel = serializers.CharField(source="baseline_factor_level")
    inhibitorStatus = serializers.CharField(source="inhibitor_status", required=False)
    diagnosisDate = serializers.DateField(source="diagnosis_date", required=False, allow_null=True)
    primaryHospital = serializers.CharField(source="primary_hospital")
    emergencyContactName = serializers.CharField(source="emergency_contact_name")
    emergencyContactPhone = serializers.CharField(source="emergency_contact_phone")
    emergencyContactRelation = serializers.CharField(
        source="emergency_contact_relation", required=False, allow_blank=True
    )
    documents = serializers.SerializerMethodField()
    notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(source="verification_status", required=False)
    createdBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    temporaryPassword = serializers.CharField(write_only=True, required=False, allow_blank=True)
    resetTemporaryPassword = serializers.CharField(write_only=True, required=False, allow_blank=True)
    photoUrl = serializers.SerializerMethodField()
    mustChangePassword = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = (
            "id",
            "fullName",
            "dateOfBirth",
            "gender",
            "mobile",
            "email",
            "province",
            "district",
            "localLevel",
            "wardNumber",
            "address",
            "bloodGroup",
            "hemophiliaType",
            "deficientFactor",
            "severity",
            "baselineFactorLevel",
            "inhibitorStatus",
            "diagnosisDate",
            "primaryHospital",
            "emergencyContactName",
            "emergencyContactPhone",
            "emergencyContactRelation",
            "documents",
            "notes",
            "status",
            "createdBy",
            "createdAt",
            "updatedAt",
            "temporaryPassword",
            "resetTemporaryPassword",
            "photoUrl",
            "mustChangePassword",
        )

    def get_createdBy(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return ""

    def get_mustChangePassword(self, obj):
        return bool(obj.user and obj.user.must_change_password)

    def get_photoUrl(self, obj):
        if not obj.photo:
            return ""
        request = self.context.get("request")
        url = obj.photo.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_documents(self, obj):
        request = self.context.get("request")
        items = []
        files = obj.files.all() if hasattr(obj, "files") else []
        for doc in files:
            url = doc.file.url if doc.file else ""
            if request and url:
                url = request.build_absolute_uri(url)
            items.append(
                {
                    "id": doc.id,
                    "name": doc.original_name,
                    "size": doc.size,
                    "type": doc.content_type,
                    "url": url,
                    "uploadedAt": doc.created_at.isoformat() if doc.created_at else "",
                }
            )
        return items

    def validate_mobile(self, value):
        mobile = normalize_mobile(value)
        if not NEPAL_MOBILE.match(mobile):
            raise serializers.ValidationError("Enter a valid Nepal mobile number (98/97 + 8 digits)")
        return mobile

    def validate_emergencyContactPhone(self, value):
        mobile = normalize_mobile(value)
        if not NEPAL_MOBILE.match(mobile):
            raise serializers.ValidationError("Enter a valid Nepal mobile number for emergency contact")
        return mobile

    def validate_hemophiliaType(self, value):
        if value not in ("A", "B"):
            raise serializers.ValidationError("Hemophilia type must be A or B")
        return value

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if not email:
            raise serializers.ValidationError("Email is required.")
        qs = Patient.objects.filter(email__iexact=email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already used by another patient.")
        user_qs = User.objects.filter(email__iexact=email)
        if self.instance and self.instance.user_id:
            user_qs = user_qs.exclude(pk=self.instance.user_id)
        if user_qs.exists():
            raise serializers.ValidationError("This email is already used by another account.")
        return email

    def validate(self, attrs):
        if self.instance is None:
            temp = self.initial_data.get("temporaryPassword") or attrs.get("temporary_password")
            if not temp or not str(temp).strip():
                raise serializers.ValidationError(
                    {"temporaryPassword": "Set a temporary password the patient will use for first login."}
                )
            try:
                password_validation.validate_password(str(temp))
            except Exception as exc:
                messages = getattr(exc, "messages", [str(exc)])
                raise serializers.ValidationError({"temporaryPassword": " ".join(messages)})
        return attrs

    def _resolve_geo_hospital(self, attrs):
        province_name = attrs.pop("province") if "province" in attrs else None
        district_name = attrs.pop("district") if "district" in attrs else None
        hospital_name = attrs.pop("primary_hospital") if "primary_hospital" in attrs else None

        if isinstance(province_name, Province):
            province = province_name
        elif province_name:
            province = Province.objects.filter(name=province_name).first()
            if not province:
                raise serializers.ValidationError({"province": "Unknown province"})
            attrs["province"] = province
        else:
            province = None

        if district_name:
            qs = District.objects.filter(name=district_name)
            if province:
                qs = qs.filter(province=province)
            district = qs.first()
            if not district:
                raise serializers.ValidationError({"district": "Unknown district for this province"})
            attrs["district"] = district

        if hospital_name:
            hospital = Hospital.objects.filter(name=hospital_name).first()
            if not hospital:
                raise serializers.ValidationError({"primaryHospital": "Unknown treatment center"})
            attrs["primary_hospital"] = hospital

        if "ward_number" in attrs:
            try:
                attrs["ward_number"] = int(str(attrs["ward_number"]).strip())
            except (TypeError, ValueError):
                raise serializers.ValidationError({"wardNumber": "Ward number must be a number"})

        if "baseline_factor_level" in attrs:
            try:
                attrs["baseline_factor_level"] = Decimal(str(attrs["baseline_factor_level"]).strip())
            except (InvalidOperation, TypeError, ValueError):
                raise serializers.ValidationError({"baselineFactorLevel": "Enter a valid factor level"})

        return attrs

    def to_internal_value(self, data):
        # Multipart QueryDict.copy() deep-copies uploaded files and raises on BufferedRandom.
        incoming = {}
        for key in data:
            if key in ("documents", "photo"):
                continue
            incoming[key] = data.get(key) if hasattr(data, "get") else data[key]
        if incoming.get("diagnosisDate") == "":
            incoming["diagnosisDate"] = None
        return super().to_internal_value(incoming)

    def _save_uploads(self, patient):
        request = self.context.get("request")
        if not request:
            return
        photo = request.FILES.get("photo")
        if photo:
            self._validate_upload(photo, image_only=True)
            patient.photo = photo
            patient.save(update_fields=["photo", "updated_at"])
        for upload in request.FILES.getlist("documents"):
            self._validate_upload(upload)
            PatientDocument.objects.create(
                patient=patient,
                file=upload,
                original_name=upload.name,
                content_type=getattr(upload, "content_type", "") or "",
                size=getattr(upload, "size", 0) or 0,
            )

    def _validate_upload(self, upload, image_only=False):
        size = getattr(upload, "size", 0) or 0
        if size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError({"documents": "Each file must be 10MB or smaller."})
        content_type = (getattr(upload, "content_type", "") or "").lower()
        ext = os.path.splitext(upload.name or "")[1].lower()
        if image_only:
            if content_type not in {"image/jpeg", "image/png", "image/jpg"} and ext not in {".jpg", ".jpeg", ".png"}:
                raise serializers.ValidationError({"photo": "Profile photo must be JPG or PNG."})
            return
        if content_type not in ALLOWED_DOC_TYPES and ext not in {".pdf", ".jpg", ".jpeg", ".png"}:
            raise serializers.ValidationError({"documents": "Documents must be PDF, JPG, or PNG."})

    def _provision_user(self, patient, temporary_password):
        first, last = split_name(patient.full_name)
        user = User.objects.create_user(
            username=patient.unique_patient_id,
            email=patient.email,
            password=temporary_password,
            role=UserRole.PATIENT,
            mobile=patient.mobile,
            first_name=first,
            last_name=last,
            must_change_password=True,
            is_staff=False,
            is_superuser=False,
        )
        patient.user = user
        patient.save(update_fields=["user"])
        return user

    def _sync_user(self, patient, reset_password=None):
        user = patient.user
        if not user:
            return
        first, last = split_name(patient.full_name)
        user.email = patient.email
        user.mobile = patient.mobile
        user.first_name = first
        user.last_name = last
        fields = ["email", "mobile", "first_name", "last_name"]
        if reset_password:
            password_validation.validate_password(reset_password, user)
            user.set_password(reset_password)
            user.must_change_password = True
            fields += ["password", "must_change_password"]
        user.save(update_fields=fields)

    @transaction.atomic
    def create(self, validated_data):
        temp = validated_data.pop("temporaryPassword", None) or self.initial_data.get("temporaryPassword")
        validated_data.pop("resetTemporaryPassword", None)
        validated_data = self._resolve_geo_hospital(validated_data)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
            validated_data["updated_by"] = request.user
        patient = super().create(validated_data)
        self._provision_user(patient, str(temp).strip())
        self._save_uploads(patient)
        self.issued_temporary_password = str(temp).strip()
        return patient

    @transaction.atomic
    def update(self, instance, validated_data):
        reset = validated_data.pop("resetTemporaryPassword", None) or self.initial_data.get(
            "resetTemporaryPassword"
        )
        validated_data.pop("temporaryPassword", None)
        validated_data = self._resolve_geo_hospital(validated_data)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["updated_by"] = request.user
        patient = super().update(instance, validated_data)
        reset_value = str(reset).strip() if reset else ""
        if not patient.user and reset_value:
            self._provision_user(patient, reset_value)
        else:
            self._sync_user(patient, reset_value or None)
        self._save_uploads(patient)
        return patient

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["province"] = instance.province.name
        data["district"] = instance.district.name
        data["primaryHospital"] = instance.primary_hospital.name
        data["wardNumber"] = str(instance.ward_number)
        level = instance.baseline_factor_level
        data["baselineFactorLevel"] = format(Decimal(str(level)), "f").rstrip("0").rstrip(".")
        return data
