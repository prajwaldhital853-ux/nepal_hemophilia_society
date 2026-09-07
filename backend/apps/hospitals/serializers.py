import re
from datetime import date

from django.contrib.auth import get_user_model, password_validation
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.patients.serializers import normalize_mobile, split_name

User = get_user_model()

NEPAL_MOBILE = re.compile(r"^(97|98)\d{8}$")

TREATMENT_PERMISSIONS = [
    "Search Patients by ID",
    "View Treatment Records",
    "Add Injection Records",
    "Add Treatment Records",
    "View Stock Levels",
    "Generate Center Reports",
]

CENTER_PERMISSIONS = [
    "Manage Treatment Admins (own center)",
    "Search Patients by ID",
    "View Treatment Records",
    "Add Injection Records",
    "Add Treatment Records",
    "View Stock Levels",
    "Generate Center Reports",
    "Center Settings",
]


def staff_permissions(staff_type: str):
    if staff_type == HospitalStaffType.CENTER_ADMIN:
        return CENTER_PERMISSIONS
    return TREATMENT_PERMISSIONS


def staff_status(user) -> str:
    if not user.is_active_account:
        return "Inactive"
    if user.must_change_password:
        return "Pending"
    return "Active"


def format_joined(dt) -> str:
    if not dt:
        return ""
    return dt.strftime("%b %d, %Y")


def next_display_id(staff_type: str) -> str:
    prefix = "TADM" if staff_type == HospitalStaffType.TREATMENT_ADMIN else "CADM"
    latest = (
        HospitalAdmin.objects.filter(staff_type=staff_type, display_id__startswith=f"{prefix}-")
        .order_by("-display_id")
        .values_list("display_id", flat=True)
        .first()
    )
    if latest:
        try:
            seq = int(latest.split("-")[1]) + 1
        except (IndexError, ValueError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}-{seq:05d}"


def unique_username(base: str) -> str:
    slug = re.sub(r"[^a-z0-9._-]", "", (base or "staff").lower())[:24] or "staff"
    candidate = slug
    n = 1
    while User.objects.filter(username=candidate).exists():
        candidate = f"{slug}{n}"
        n += 1
    return candidate


class HospitalStaffSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="display_id", read_only=True)
    staffType = serializers.CharField(source="staff_type", read_only=True)
    fullName = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(source="user.mobile")
    treatmentCenter = serializers.CharField(source="hospital.name", read_only=True)
    hospitalId = serializers.IntegerField(source="hospital_id", read_only=True)
    province = serializers.CharField(source="hospital.province.name", read_only=True)
    status = serializers.SerializerMethodField()
    joinedDate = serializers.SerializerMethodField()
    dateOfBirth = serializers.DateField(source="date_of_birth", required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    permissions = serializers.SerializerMethodField()
    mustChangePassword = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username", read_only=True)
    lastLogin = serializers.SerializerMethodField()
    roleLabel = serializers.SerializerMethodField()
    temporaryPassword = serializers.CharField(write_only=True, required=False, allow_blank=True)
    resetTemporaryPassword = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = HospitalAdmin
        fields = (
            "id",
            "staffType",
            "fullName",
            "email",
            "phone",
            "treatmentCenter",
            "hospitalId",
            "province",
            "status",
            "joinedDate",
            "dateOfBirth",
            "gender",
            "address",
            "permissions",
            "mustChangePassword",
            "username",
            "lastLogin",
            "roleLabel",
            "temporaryPassword",
            "resetTemporaryPassword",
        )

    def get_fullName(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_status(self, obj):
        return staff_status(obj.user)

    def get_joinedDate(self, obj):
        return format_joined(obj.user.date_joined)

    def get_permissions(self, obj):
        return staff_permissions(obj.staff_type)

    def get_mustChangePassword(self, obj):
        return bool(obj.user.must_change_password)

    def get_lastLogin(self, obj):
        if not obj.user.last_login:
            return ""
        return timezone.localtime(obj.user.last_login).strftime("%b %d, %Y %I:%M %p")

    def get_roleLabel(self, obj):
        return obj.get_staff_type_display()

    def validate_phone(self, value):
        mobile = normalize_mobile(value)
        if mobile and not NEPAL_MOBILE.match(mobile):
            raise serializers.ValidationError("Enter a valid Nepal mobile number (98/97 + 8 digits)")
        return mobile

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if not email:
            raise serializers.ValidationError("Email is required.")
        qs = User.objects.filter(email__iexact=email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.user_id)
        if qs.exists():
            raise serializers.ValidationError("This email is already used by another account.")
        return email


class HospitalStaffCreateSerializer(serializers.Serializer):
    fullName = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True)
    treatmentCenter = serializers.CharField()
    dateOfBirth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    temporaryPassword = serializers.CharField(write_only=True)

    def validate_phone(self, value):
        mobile = normalize_mobile(value)
        if mobile and not NEPAL_MOBILE.match(mobile):
            raise serializers.ValidationError("Enter a valid Nepal mobile number (98/97 + 8 digits)")
        return mobile

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email is already used by another account.")
        return email

    def validate(self, attrs):
        temp = attrs.get("temporaryPassword")
        if not temp or not str(temp).strip():
            raise serializers.ValidationError(
                {"temporaryPassword": "Set a temporary password for first admin-panel login."}
            )
        try:
            password_validation.validate_password(str(temp))
        except Exception as exc:
            messages = getattr(exc, "messages", [str(exc)])
            raise serializers.ValidationError({"temporaryPassword": " ".join(messages)})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        staff_type = self.context["staff_type"]
        hospital_name = validated_data["treatmentCenter"]
        hospital = Hospital.objects.filter(name=hospital_name, is_active=True).select_related("province").first()
        if not hospital:
            raise serializers.ValidationError({"treatmentCenter": "Unknown treatment center."})

        if self.context["request"].user.role == UserRole.PROVINCE_ADMIN:
            province_admin = getattr(self.context["request"].user, "province_admin", None)
            if province_admin and hospital.province_id != province_admin.province_id:
                raise serializers.ValidationError({"treatmentCenter": "Hospital is outside your province."})

        if self.context["request"].user.role == UserRole.HOSPITAL_ADMIN:
            center_admin = getattr(self.context["request"].user, "hospital_admin", None)
            if center_admin and hospital.id != center_admin.hospital_id:
                raise serializers.ValidationError({"treatmentCenter": "You can only add staff to your own center."})

        first, last = split_name(validated_data["fullName"])
        email = validated_data["email"]
        username = unique_username(email.split("@")[0])
        temp_password = validated_data["temporaryPassword"]

        user = User.objects.create_user(
            username=username,
            email=email,
            password=temp_password,
            first_name=first,
            last_name=last,
            role=UserRole.HOSPITAL_ADMIN,
            mobile=normalize_mobile(validated_data.get("phone", "")),
            must_change_password=True,
            is_active_account=True,
        )

        profile = HospitalAdmin.objects.create(
            user=user,
            hospital=hospital,
            staff_type=staff_type,
            display_id=next_display_id(staff_type),
            date_of_birth=validated_data.get("dateOfBirth"),
            gender=validated_data.get("gender", ""),
            address=validated_data.get("address", ""),
        )
        self.issued_temporary_password = temp_password
        return profile


class HospitalStaffUpdateSerializer(HospitalStaffSerializer):
    fullName = serializers.CharField(required=False)
    treatmentCenter = serializers.CharField(required=False, write_only=True)
    status = serializers.ChoiceField(choices=["Active", "Pending", "Inactive"], required=False, write_only=True)

    @transaction.atomic
    def update(self, instance, validated_data):
        user = instance.user
        full_name = validated_data.pop("fullName", None)
        hospital_name = validated_data.pop("treatmentCenter", None)
        status = validated_data.pop("status", None)
        reset_temp = self.initial_data.get("resetTemporaryPassword")
        user_data = validated_data.pop("user", {})

        if full_name:
            first, last = split_name(full_name)
            user.first_name = first
            user.last_name = last

        if "email" in user_data:
            user.email = user_data["email"]
        if "mobile" in user_data:
            user.mobile = user_data["mobile"]

        if hospital_name:
            hospital = Hospital.objects.filter(name=hospital_name, is_active=True).first()
            if not hospital:
                raise serializers.ValidationError({"treatmentCenter": "Unknown treatment center."})
            instance.hospital = hospital

        if status == "Inactive":
            user.is_active_account = False
        elif status in ("Active", "Pending"):
            user.is_active_account = True
            if status == "Active":
                user.must_change_password = False

        if reset_temp and str(reset_temp).strip():
            try:
                password_validation.validate_password(str(reset_temp))
            except Exception as exc:
                messages = getattr(exc, "messages", [str(exc)])
                raise serializers.ValidationError({"resetTemporaryPassword": " ".join(messages)})
            user.set_password(str(reset_temp))
            user.must_change_password = True
            user.password_changed_at = None
            self.issued_temporary_password = str(reset_temp)

        for field in ("date_of_birth", "gender", "address"):
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        user.save()
        instance.save()
        return instance

    def to_internal_value(self, data):
        mapped = dict(data)
        if "email" in mapped:
            mapped["user"] = {"email": mapped.pop("email")}
        if "phone" in mapped:
            user = mapped.get("user", {})
            user["mobile"] = mapped.pop("phone")
            mapped["user"] = user
        return super().to_internal_value(mapped)
