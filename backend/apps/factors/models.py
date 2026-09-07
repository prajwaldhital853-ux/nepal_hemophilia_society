from django.db import models

from apps.core.models import TimeStampedModel


class FactorType(models.TextChoices):
    FVIII = "FVIII", "Factor VIII"
    FIX = "FIX", "Factor IX"
    BYPASSING = "Bypassing", "Bypassing agent"
    OTHER = "Other", "Other"


class ApplicableType(models.TextChoices):
    A = "A", "Hemophilia A"
    B = "B", "Hemophilia B"
    BOTH = "Both", "Both"


class DoseUnit(models.TextChoices):
    IU = "IU", "IU"
    MG = "mg", "mg"


class FactorMedicine(TimeStampedModel):
    name = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=255, blank=True)
    factor_type = models.CharField(max_length=20, choices=FactorType.choices)
    applicable_type = models.CharField(max_length=10, choices=ApplicableType.choices)
    unit = models.CharField(max_length=10, choices=DoseUnit.choices, default=DoseUnit.IU)
    standard_dose_notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "factors_medicines"
        ordering = ["name"]

    def __str__(self):
        return self.name
