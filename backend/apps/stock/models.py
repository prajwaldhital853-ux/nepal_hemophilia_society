from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel
from apps.factors.models import DoseUnit, FactorMedicine
from apps.hospitals.models import Hospital
from apps.patients.models import Patient


class GlobalStockShipment(TimeStampedModel):
    """Central stock intake before allocation to treatment centers."""

    factor_medicine = models.ForeignKey(FactorMedicine, on_delete=models.PROTECT, related_name="global_shipments")
    batch_number = models.CharField(max_length=64, blank=True, default="")
    total_quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    allocated_quantity = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0"), validators=[MinValueValidator(Decimal("0"))]
    )
    unit = models.CharField(max_length=10, choices=DoseUnit.choices, default=DoseUnit.IU)
    expiry_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="global_shipments_created",
    )

    class Meta:
        db_table = "global_stock_shipments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Global {self.factor_medicine.name} — {self.total_quantity} {self.unit}"


class StockMovementType(models.TextChoices):
    STOCK_IN = "stock_in", "Stock in"
    STOCK_OUT = "stock_out", "Stock out"
    ADJUSTMENT = "adjustment", "Adjustment"
    INJECTION = "injection", "Given to patient"
    REVERSAL = "reversal", "Reversal"


class FactorStock(TimeStampedModel):
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT, related_name="factor_stock")
    global_shipment = models.ForeignKey(
        GlobalStockShipment,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="center_lots",
    )
    factor_medicine = models.ForeignKey(FactorMedicine, on_delete=models.PROTECT, related_name="stock_lots")
    batch_number = models.CharField(max_length=64, blank=True, default="")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    unit = models.CharField(max_length=10, choices=DoseUnit.choices, default=DoseUnit.IU)
    expiry_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stock_lots_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stock_lots_updated",
    )

    class Meta:
        db_table = "factor_stock"
        ordering = ["hospital__name", "factor_medicine__name", "expiry_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["hospital", "factor_medicine", "batch_number"],
                name="uniq_stock_hospital_factor_batch",
            )
        ]
        indexes = [
            models.Index(fields=["hospital", "factor_medicine"]),
        ]

    def __str__(self):
        batch = self.batch_number or "no-batch"
        return f"{self.hospital.name} — {self.factor_medicine.name} ({batch})"


class StockMovement(TimeStampedModel):
    stock = models.ForeignKey(FactorStock, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=20, choices=StockMovementType.choices)
    quantity_delta = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_after = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="stock_movements",
    )
    patient = models.ForeignKey(
        Patient,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stock_movements",
    )
    injection = models.ForeignKey(
        "injections.InjectionRecord",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stock_movements",
    )

    class Meta:
        db_table = "stock_movements"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["movement_type", "created_at"]),
            models.Index(fields=["patient", "created_at"]),
        ]

    def __str__(self):
        return f"{self.movement_type} {self.quantity_delta} @ {self.stock_id}"
