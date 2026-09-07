from django.conf import settings
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel
from apps.factors.models import DoseUnit, FactorMedicine, FactorType
from apps.hospitals.models import Hospital
from apps.patients.models import Patient


class InjectionIndication(models.TextChoices):
    PROPHYLAXIS = "Prophylaxis", "Prophylaxis"
    ON_DEMAND = "On-demand", "On-demand"
    ITI = "ITI", "ITI"
    SURGERY = "Surgery", "Surgery/Procedure"
    TRAUMA = "Trauma", "Trauma"
    EMERGENCY = "Emergency", "Emergency"
    OTHER = "Other", "Other"


class InjectionStatus(models.TextChoices):
    PENDING = "Pending", "Pending"
    SCHEDULED = "Scheduled", "Scheduled"
    COMPLETED = "Completed", "Completed"
    CANCELLED = "Cancelled", "Cancelled"


class InjectionRecord(TimeStampedModel):
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="injections")
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT, related_name="injections")
    administered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="injections_administered",
    )
    factor_medicine = models.ForeignKey(FactorMedicine, on_delete=models.PROTECT, related_name="injections")
    factor_type = models.CharField(max_length=20, choices=FactorType.choices)
    dose = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    unit = models.CharField(max_length=10, choices=DoseUnit.choices)
    indication = models.CharField(max_length=30, choices=InjectionIndication.choices)
    status = models.CharField(
        max_length=20,
        choices=InjectionStatus.choices,
        default=InjectionStatus.COMPLETED,
        db_index=True,
    )
    administered_at = models.DateTimeField(db_index=True)
    batch_number = models.CharField(max_length=64, blank=True)
    bleed_site = models.CharField(max_length=128, blank=True)
    notes = models.TextField(blank=True)
    inhibitor_warning = models.BooleanField(default=False)
    is_correction = models.BooleanField(default=False)
    corrects_record = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="corrections",
    )
    is_void = models.BooleanField(default=False)

    class Meta:
        db_table = "injection_records"
        ordering = ["-administered_at"]
        indexes = [
            models.Index(fields=["patient", "administered_at"]),
            models.Index(fields=["hospital", "administered_at"]),
            models.Index(fields=["factor_type"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.patient.unique_patient_id} — {self.factor_type} {self.dose}{self.unit}"
