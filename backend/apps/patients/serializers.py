import os
import re
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model, password_validation
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.accounts.password_policy import record_password_history
from apps.core.clinical import can_delete_patient, can_edit_patient, can_log_clinical_for_patient
from apps.factors.models import FactorMedicine, FactorType
from apps.hospitals.models import Hospital
from apps.patients.models import InhibitorStatus, Patient, PatientDocument, TreatmentPlan
from apps.provinces.models import District, Province

User = get_user_model()

NEPAL_MOBILE = re.compile(r"^(97|98)\d{8}$")
ALLOWED_DOC_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def serialize_patient_document(doc, request=None):
    url = doc.file.url if doc.file else ""
    if request and url:
        url = request.build_absolute_uri(url)
    uploaded_by = ""
    uploaded_by_role = ""
    if doc.uploaded_by:
        uploaded_by = doc.uploaded_by.get_full_name() or doc.uploaded_by.username
        uploaded_by_role = getattr(doc.uploaded_by, "role", "") or ""
    return {
        "id": doc.id,
        "name": doc.original_name,
        "size": doc.size,
        "type": doc.content_type,
        "url": url,
        "uploadedAt": doc.created_at.isoformat() if doc.created_at else "",
        "uploadedBy": uploaded_by,
        "uploadedByRole": uploaded_by_role,
        "hospitalName": doc.hospital.name if doc.hospital_id else "",
        "center": doc.hospital.name if doc.hospital_id else "",
    }


def validate_document_upload(upload, image_only=False):
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
    treatmentPlan = serializers.CharField(source="treatment_plan", required=False)
    prescribedFactorMedicineId = serializers.IntegerField(
        source="prescribed_factor_medicine_id", required=False, allow_null=True
    )
    prescribedFactorMedicineName = serializers.CharField(
        source="prescribed_factor_medicine.name", read_only=True, default=""
    )
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
    canEdit = serializers.SerializerMethodField()
    canDelete = serializers.SerializerMethodField()
    canLogClinical = serializers.SerializerMethodField()

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
            "treatmentPlan",
            "prescribedFactorMedicineId",
            "prescribedFactorMedicineName",
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
            "canEdit",
            "canDelete",
            "canLogClinical",
        )

    def get_canLogClinical(self, obj):
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return False
        return can_log_clinical_for_patient(request.user, obj)

    def get_canEdit(self, obj):
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return False
        return can_edit_patient(request.user, obj)

    def get_canDelete(self, obj):
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return False
        return can_delete_patient(request.user, obj)

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
        files = obj.files.all() if hasattr(obj, "files") else []
        return [serialize_patient_document(doc, request) for doc in files]

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

        inhibitor = attrs.get("inhibitor_status")
        if inhibitor is None and self.instance:
            inhibitor = self.instance.inhibitor_status
        plan = attrs.get("treatment_plan")
        if plan is None and self.instance:
            plan = self.instance.treatment_plan
        if plan == TreatmentPlan.BYPASSING and inhibitor != InhibitorStatus.CURRENT:
            raise serializers.ValidationError(
                {"treatmentPlan": "Bypassing / Specialist plan is only for patients with current inhibitors."}
            )

        factor_id = attrs.get("prescribed_factor_medicine_id")
        hem_type = attrs.get("hemophilia_type") or (self.instance.hemophilia_type if self.instance else None)
        if factor_id:
            factor = FactorMedicine.objects.filter(pk=factor_id, is_active=True).first()
            if not factor:
                raise serializers.ValidationError({"prescribedFactorMedicineId": "Unknown or inactive factor product."})
            if hem_type == "A" and factor.factor_type == FactorType.FIX:
                raise serializers.ValidationError(
                    {"prescribedFactorMedicineId": "Factor IX products cannot be prescribed for Hemophilia A."}
                )
            if hem_type == "B" and factor.factor_type == FactorType.FVIII:
                raise serializers.ValidationError(
                    {"prescribedFactorMedicineId": "Factor VIII products cannot be prescribed for Hemophilia B."}
                )
            if inhibitor == InhibitorStatus.CURRENT and factor.factor_type in (FactorType.FVIII, FactorType.FIX):
                raise serializers.ValidationError(
                    {
                        "prescribedFactorMedicineId": "Patients with current inhibitors need a bypassing agent, not standard factor."
                    }
                )
            attrs["prescribed_factor_medicine"] = factor
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
        if incoming.get("prescribedFactorMedicineId") in ("", None):
            incoming["prescribedFactorMedicineId"] = None
        return super().to_internal_value(incoming)

    def _save_uploads(self, patient):
        request = self.context.get("request")
        if not request:
            return
        try:
            photo = request.FILES.get("photo")
            if photo:
                validate_document_upload(photo, image_only=True)
                patient.photo = photo
                patient.save(update_fields=["photo", "updated_at"])
            actor_hospital = None
            if request.user and getattr(request.user, "is_authenticated", False):
                from apps.core.clinical import get_hospital_admin_profile

                profile = get_hospital_admin_profile(request.user)
                if profile:
                    actor_hospital = profile.hospital
                elif patient.primary_hospital_id:
                    actor_hospital = patient.primary_hospital
            for upload in request.FILES.getlist("documents"):
                validate_document_upload(upload)
                PatientDocument.objects.create(
                    patient=patient,
                    file=upload,
                    original_name=upload.name,
                    content_type=getattr(upload, "content_type", "") or "",
                    size=getattr(upload, "size", 0) or 0,
                    uploaded_by=request.user if request.user.is_authenticated else None,
                    hospital=actor_hospital,
                )
        except Exception as exc:
            message = str(exc)
            if "Invalid Signature" in message or "invalid signature" in message.lower():
                raise serializers.ValidationError(
                    {
                        "photo": "Photo upload failed: Cloudinary credentials on the server are invalid. "
                        "Set only CLOUDINARY_URL on Render (from Cloudinary dashboard) and remove "
                        "CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET if present."
                    }
                )
            if "photo" in request.FILES:
                raise serializers.ValidationError({"photo": f"Photo upload failed: {message}"})
            raise serializers.ValidationError({"documents": f"Document upload failed: {message}"})

    def _validate_upload(self, upload, image_only=False):
        validate_document_upload(upload, image_only=image_only)

    def _provision_user(self, patient, temporary_password):
        first, last = split_name(patient.full_name)
        try:
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
        except Exception as exc:
            messages = getattr(exc, "messages", [str(exc)])
            raise serializers.ValidationError({"temporaryPassword": " ".join(messages)})
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
        user.username = patient.unique_patient_id
        fields = ["email", "mobile", "first_name", "last_name", "username"]
        reset_value = str(reset_password or "").strip()
        if reset_value:
            password_validation.validate_password(reset_value, user)
            record_password_history(user)
            user.set_password(reset_value)
            user.must_change_password = True
            user.password_changed_at = None
            fields += ["password", "must_change_password", "password_changed_at"]
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
        if request and request.user.is_authenticated:
            from apps.notifications.services import notify_patient_created

            notify_patient_created(patient, user=request.user)
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
        if request and request.user.is_authenticated:
            from apps.notifications.services import notify_profile_updated

            notify_profile_updated(patient, user=request.user)
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
