"""Inventory ledger: stock in/out and auto-decrement when a dose is given."""

from decimal import Decimal

from django.db import transaction
from django.db.models import F, Sum
from rest_framework.exceptions import ValidationError


def available_stock_quantity(hospital, factor_medicine, batch_number=None):
    """Total on-hand quantity for a product at a treatment center (optionally one batch)."""
    qs = FactorStock.objects.filter(
        hospital=hospital,
        factor_medicine=factor_medicine,
        quantity__gt=0,
    )
    batch = (batch_number or "").strip()
    if batch:
        qs = qs.filter(batch_number=batch)
    return qs.aggregate(total=Sum("quantity"))["total"] or Decimal("0")


def ensure_stock_available(hospital, factor_medicine, dose, batch_number=None):
    """Raise ValidationError when the center cannot fulfil the requested dose."""
    qty = Decimal(dose)
    if qty <= 0:
        raise ValidationError({"dose": "Dose must be greater than zero."})
    available = available_stock_quantity(hospital, factor_medicine, batch_number)
    if available < qty:
        product = factor_medicine.name if factor_medicine else "Factor"
        center = hospital.name if hospital else "this center"
        unit = factor_medicine.unit if factor_medicine else ""
        raise ValidationError(
            {
                "error": (
                    f"Out of stock: {product} is not available at {center}. "
                    f"Only {available:g} {unit} on hand; {qty:g} requested."
                ),
                "code": "insufficient_stock",
            }
        )

from apps.injections.models import InjectionStatus
from apps.stock.models import FactorStock, GlobalStockShipment, StockMovement, StockMovementType


def _record_movement(*, stock, movement_type, delta, user, reason, notes="", patient=None, injection=None):
    stock.quantity = (stock.quantity or Decimal("0")) + delta
    if stock.quantity < 0:
        raise ValidationError("Insufficient stock at this treatment center for this product.")
    stock.save(update_fields=["quantity", "updated_at"])
    movement = StockMovement.objects.create(
        stock=stock,
        movement_type=movement_type,
        quantity_delta=delta,
        quantity_after=stock.quantity,
        reason=reason,
        notes=notes,
        recorded_by=user,
        patient=patient,
        injection=injection,
    )
    from apps.notifications.services import notify_stock_movement

    notify_stock_movement(movement)
    return movement


def _net_consumed_for_injection(injection):
    rows = (
        StockMovement.objects.filter(injection=injection)
        .values("stock_id")
        .annotate(net=Sum("quantity_delta"))
    )
    return {row["stock_id"]: row["net"] or Decimal("0") for row in rows}


def consume_for_injection(injection, user=None):
    """Decrement center stock when a completed dose is given. FIFO unless a batch is named."""
    if injection.status != InjectionStatus.COMPLETED:
        return []
    nets = _net_consumed_for_injection(injection)
    if sum((v for v in nets.values()), Decimal("0")) < 0:
        return []
    qty = Decimal(injection.dose)
    actor = user or injection.administered_by
    with transaction.atomic():
        qs = FactorStock.objects.select_for_update().filter(
            hospital=injection.hospital,
            factor_medicine=injection.factor_medicine,
        )
        batch = (injection.batch_number or "").strip()
        if batch:
            qs = qs.filter(batch_number=batch)
        else:
            qs = qs.order_by(F("expiry_date").asc(nulls_last=True), "created_at")
        remaining = qty
        movements = []
        for lot in qs:
            if remaining <= 0:
                break
            if lot.quantity <= 0:
                continue
            take = min(lot.quantity, remaining)
            movements.append(
                _record_movement(
                    stock=lot,
                    movement_type=StockMovementType.INJECTION,
                    delta=-take,
                    user=actor,
                    reason="Dose given to patient",
                    notes=f"{injection.patient.unique_patient_id} — {take:g} {injection.unit}",
                    patient=injection.patient,
                    injection=injection,
                )
            )
            remaining -= take
        if remaining > 0:
            product = injection.factor_medicine.name if injection.factor_medicine_id else injection.factor_type
            raise ValidationError(
                f"Out of stock: {product} is not available at {injection.hospital.name}. "
                f"Cannot log a completed injection until stock is allocated to this center."
            )
        if not batch and movements:
            first_batch = movements[0].stock.batch_number
            if first_batch and not injection.batch_number:
                injection.batch_number = first_batch
                injection.save(update_fields=["batch_number", "updated_at"])
        return movements


def reverse_for_injection(injection, user, reason="Injection reversed or corrected"):
    with transaction.atomic():
        created = []
        for stock_id, net in _net_consumed_for_injection(injection).items():
            if net >= 0:
                continue
            stock = FactorStock.objects.select_for_update().get(pk=stock_id)
            created.append(
                _record_movement(
                    stock=stock,
                    movement_type=StockMovementType.REVERSAL,
                    delta=-net,
                    user=user,
                    reason=reason,
                    notes=f"Restock for injection #{injection.id}",
                    patient=injection.patient,
                    injection=injection,
                )
            )
        return created


def allocate_global_stock(
    *,
    factor,
    total_quantity,
    batch_number="",
    expiry_date=None,
    notes="",
    reason="Global stock allocation",
    allocations,
    user,
):
    """Record global shipment and distribute stock to treatment centers."""
    from apps.notifications.services import notify_center_stock_update

    batch = (batch_number or "").strip()
    with transaction.atomic():
        shipment = GlobalStockShipment.objects.create(
            factor_medicine=factor,
            batch_number=batch,
            total_quantity=total_quantity,
            allocated_quantity=sum(qty for _, qty in allocations),
            unit=factor.unit,
            expiry_date=expiry_date,
            notes=notes,
            created_by=user,
        )
        stocks = []
        for hospital, qty in allocations:
            stock, created = FactorStock.objects.get_or_create(
                hospital=hospital,
                factor_medicine=factor,
                batch_number=batch,
                defaults={
                    "quantity": Decimal("0"),
                    "unit": factor.unit,
                    "expiry_date": expiry_date,
                    "notes": notes,
                    "created_by": user,
                    "updated_by": user,
                    "global_shipment": shipment,
                },
            )
            if not created:
                stock.global_shipment = shipment
                if expiry_date:
                    stock.expiry_date = expiry_date
                stock.updated_by = user
                stock.save(update_fields=["global_shipment", "expiry_date", "updated_by", "updated_at"])
            _record_movement(
                stock=stock,
                movement_type=StockMovementType.STOCK_IN,
                delta=qty,
                user=user,
                reason=reason,
                notes=f"Allocated from global stock (batch {batch or '—'})",
            )
            stock.refresh_from_db()
            notify_center_stock_update(hospital, factor.name, qty, factor.unit, user=user)
            stocks.append(stock)
        return shipment, stocks


def apply_injection_status_change(injection, old_status, user):
    was_completed = old_status == InjectionStatus.COMPLETED
    now_completed = injection.status == InjectionStatus.COMPLETED
    if was_completed and not now_completed:
        reverse_for_injection(injection, user, reason=f"Injection status changed to {injection.status}")
    elif now_completed and not was_completed:
        consume_for_injection(injection, user=user)
    elif now_completed and was_completed:
        reverse_for_injection(injection, user, reason="Injection dose updated")
        consume_for_injection(injection, user=user)
