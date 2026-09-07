from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models, transaction

from apps.core.models import TimeStampedModel
from apps.hospitals.models import Hospital
from apps.provinces.models import District, Province


class HemophiliaType(models.TextChoices):
    A = "A", "Hemophilia A"
    B = "B", "Hemophilia B"


class Severity(models.TextChoices):
    MILD = "Mild", "Mild"
    MODERATE = "Moderate", "Moderate"
    SEVERE = "Severe", "Severe"


class InhibitorStatus(models.TextChoices):
    NONE = "None", "None"
    PAST = "Past", "Past"
    CURRENT = "Current", "Current"


class Gender(models.TextChoices):
    MALE = "Male", "Male"
    FEMALE = "Female", "Female"
    OTHER = "Other", "Other"


class VerificationStatus(models.TextChoices):
    PENDING = "Pending", "Pending"
    ACTIVE = "Active", "Active"
    REJECTED = "Rejected", "Rejected"


def patient_photo_path(instance, filename):
    return f"patients/{instance.unique_patient_id or 'pending'}/photo/{filename}"


def patient_document_path(instance, filename):
    return f"patients/{instance.patient.unique_patient_id}/documents/{filename}"


class Patient(TimeStampedModel):
    unique_patient_id = models.CharField(max_length=20, unique=True, db_index=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="patient_profile",
    )
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=Gender.choices)
    mobile = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    photo = models.ImageField(upload_to=patient_photo_path, blank=True)
    province = models.ForeignKey(Province, on_delete=models.PROTECT, related_name="patients")
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name="patients")
    local_level = models.CharField(max_length=255)
    ward_number = models.PositiveSmallIntegerField()
    address = models.TextField()
    blood_group = models.CharField(max_length=5)
    hemophilia_type = models.CharField(max_length=5, choices=HemophiliaType.choices)
    deficient_factor = models.CharField(max_length=10)
    severity = models.CharField(max_length=20, choices=Severity.choices)
    baseline_factor_level = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(40)],
    )
    inhibitor_status = models.CharField(
        max_length=20,
        choices=InhibitorStatus.choices,
        default=InhibitorStatus.NONE,
    )
    diagnosis_date = models.DateField(null=True, blank=True)
    primary_hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT, related_name="primary_patients")
    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_phone = models.CharField(max_length=20)
    emergency_contact_relation = models.CharField(max_length=80, blank=True)
    documents = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    verification_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.ACTIVE,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="patients_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="patients_updated",
    )

    class Meta:
        db_table = "patients"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["hemophilia_type"]),
            models.Index(fields=["severity"]),
            models.Index(fields=["province"]),
        ]

    def __str__(self):
        return f"{self.unique_patient_id} — {self.full_name}"

    def save(self, *args, **kwargs):
        self.deficient_factor = "FVIII" if self.hemophilia_type == HemophiliaType.A else "FIX"
        if not self.unique_patient_id:
            self.unique_patient_id = Patient.next_unique_id()
        super().save(*args, **kwargs)

    @classmethod
    def next_unique_id(cls) -> str:
        with transaction.atomic():
            last = cls.objects.select_for_update().order_by("-id").first()
            n = 8744
            if last and last.unique_patient_id:
                digits = "".join(ch for ch in last.unique_patient_id if ch.isdigit())
                if digits:
                    n = max(n, int(digits) + 1)
            return f"HEM-{n:07d}"


class PatientDocument(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to=patient_document_path)
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "patient_documents"
        ordering = ["-created_at"]

    def __str__(self):
        return self.original_name
