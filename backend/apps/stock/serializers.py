from decimal import Decimal

from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.accounts.rbac import hospital_id_for, is_national_scope, province_id_for
from apps.core.clinical import get_hospital_admin_profile
from apps.factors.models import FactorMedicine
from apps.hospitals.models import Hospital
from apps.stock.models import FactorStock, GlobalStockShipment, StockMovement, StockMovementType
from apps.stock.services import _record_movement, allocate_global_stock


def resolve_stock_hospital(user, hospital_name=None):
    """Stock in/out is scoped: national any center, province own province, hospital own center."""
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = get_hospital_admin_profile(user)
        if not profile:
            return None, "Your account is not linked to a treatment center."
        return profile.hospital, None
    name = (hospital_name or "").strip()
    if is_national_scope(user):
        if not name:
            return None, "Specify the treatment center."
        hospital = Hospital.objects.filter(name__iexact=name, is_active=True).first()
        if not hospital:
            return None, "Unknown treatment center."
        return hospital, None
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        if not pid:
            return None, "Your account is not linked to a province."
        if not name:
            return None, "Specify the treatment center."
        hospital = Hospital.objects.filter(name__iexact=name, is_active=True).first()
        if not hospital:
            return None, "Unknown treatment center."
        if hospital.province_id != pid:
            return None, "You can only stock treatment centers in your province."
        return hospital, None
    return None, "You cannot add or adjust stock."


def _assert_hospital_in_stock_scope(user, hospital):
    if is_national_scope(user):
        return
    if user.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(user)
        if hid != hospital.id:
            raise serializers.ValidationError({"hospitalName": "You can only stock your own treatment center."})
        return
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        if not pid or hospital.province_id != pid:
            raise serializers.ValidationError({"hospitalName": "You can only stock treatment centers in your province."})
        return
    raise serializers.ValidationError({"hospitalName": "You cannot add or adjust stock."})


def actor_label(user):
    name = user.get_full_name() or user.username
    role = getattr(user, "role", "") or ""
    return {"name": name, "role": role, "username": user.username}


class FactorStockSerializer(serializers.ModelSerializer):
    hospitalName = serializers.CharField(source="hospital.name", read_only=True)
    province = serializers.CharField(source="hospital.province.name", read_only=True)
    factorMedicineId = serializers.IntegerField(source="factor_medicine_id", read_only=True)
    factorMedicineName = serializers.CharField(source="factor_medicine.name", read_only=True)
    factorType = serializers.CharField(source="factor_medicine.factor_type", read_only=True)
    batchNumber = serializers.CharField(source="batch_number")
    expiryDate = serializers.DateField(source="expiry_date", allow_null=True)
    createdBy = serializers.SerializerMethodField()
    updatedBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = FactorStock
        fields = (
            "id",
            "hospitalName",
            "province",
            "factorMedicineId",
            "factorMedicineName",
            "factorType",
            "batchNumber",
            "quantity",
            "unit",
            "expiryDate",
            "notes",
            "createdBy",
            "updatedBy",
            "createdAt",
            "updatedAt",
        )

    def get_createdBy(self, obj):
        return actor_label(obj.created_by) if obj.created_by_id else None

    def get_updatedBy(self, obj):
        return actor_label(obj.updated_by) if obj.updated_by_id else None


class StockMovementSerializer(serializers.ModelSerializer):
    hospitalName = serializers.CharField(source="stock.hospital.name", read_only=True)
    province = serializers.CharField(source="stock.hospital.province.name", read_only=True)
    factorMedicineName = serializers.CharField(source="stock.factor_medicine.name", read_only=True)
    factorType = serializers.CharField(source="stock.factor_medicine.factor_type", read_only=True)
    batchNumber = serializers.CharField(source="stock.batch_number", read_only=True)
    unit = serializers.CharField(source="stock.unit", read_only=True)
    movementType = serializers.CharField(source="movement_type")
    quantityDelta = serializers.DecimalField(source="quantity_delta", max_digits=12, decimal_places=2)
    quantityAfter = serializers.DecimalField(source="quantity_after", max_digits=12, decimal_places=2)
    recordedBy = serializers.SerializerMethodField()
    recordedAt = serializers.DateTimeField(source="created_at", read_only=True)
    patientId = serializers.CharField(source="patient.unique_patient_id", read_only=True, default="")
    patientName = serializers.CharField(source="patient.full_name", read_only=True, default="")
    injectionId = serializers.IntegerField(source="injection_id", read_only=True, allow_null=True)

    class Meta:
        model = StockMovement
        fields = (
            "id",
            "hospitalName",
            "province",
            "factorMedicineName",
            "factorType",
            "batchNumber",
            "unit",
            "movementType",
            "quantityDelta",
            "quantityAfter",
            "reason",
            "notes",
            "recordedBy",
            "recordedAt",
            "patientId",
            "patientName",
            "injectionId",
        )

    def get_recordedBy(self, obj):
        return actor_label(obj.recorded_by)


class CenterAllocationSerializer(serializers.Serializer):
    hospitalName = serializers.CharField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Allocation quantity must be greater than zero.")
        return value


class StockCreateSerializer(serializers.Serializer):
    factorMedicineId = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    batchNumber = serializers.CharField(required=False, allow_blank=True, default="")
    expiryDate = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    hospitalName = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, allow_blank=True, default="Initial stock")
    isGlobal = serializers.BooleanField(required=False, default=False)
    centerAllocations = CenterAllocationSerializer(many=True, required=False)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        factor = FactorMedicine.objects.filter(pk=attrs["factorMedicineId"], is_active=True).first()
        if not factor:
            raise serializers.ValidationError({"factorMedicineId": "Unknown or inactive factor product."})
        attrs["factor"] = factor
        allocations = attrs.get("centerAllocations") or []
        is_global = attrs.get("isGlobal") or bool(allocations)
        if is_global and allocations:
            total_alloc = sum(a["quantity"] for a in allocations)
            if total_alloc > attrs["quantity"]:
                raise serializers.ValidationError(
                    {"centerAllocations": "Total center allocations cannot exceed global quantity."}
                )
            hospitals = []
            for alloc in allocations:
                hospital = Hospital.objects.filter(name__iexact=alloc["hospitalName"].strip()).first()
                if not hospital:
                    raise serializers.ValidationError(
                        {"centerAllocations": f"Unknown treatment center: {alloc['hospitalName']}"}
                    )
                _assert_hospital_in_stock_scope(request.user, hospital)
                hospitals.append((hospital, alloc["quantity"]))
            attrs["resolved_allocations"] = hospitals
            attrs["is_global"] = True
            return attrs
        hospital, err = resolve_stock_hospital(request.user, attrs.get("hospitalName"))
        if err or not hospital:
            raise serializers.ValidationError({"hospitalName": err or "Specify the treatment center."})
        attrs["hospital"] = hospital
        attrs["is_global"] = False
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        if validated_data.get("is_global"):
            shipment, stocks = allocate_global_stock(
                factor=validated_data["factor"],
                total_quantity=validated_data["quantity"],
                batch_number=validated_data.get("batchNumber", ""),
                expiry_date=validated_data.get("expiryDate"),
                notes=validated_data.get("notes", ""),
                reason=validated_data.get("reason") or "Global stock allocation",
                allocations=validated_data.get("resolved_allocations", []),
                user=request.user,
            )
            self.context["global_shipment"] = shipment
            self.context["allocated_stocks"] = stocks
            return stocks[0] if stocks else None
        batch = (validated_data.get("batchNumber") or "").strip()
        stock, created = FactorStock.objects.get_or_create(
            hospital=validated_data["hospital"],
            factor_medicine=validated_data["factor"],
            batch_number=batch,
            defaults={
                "quantity": Decimal("0"),
                "unit": validated_data["factor"].unit,
                "expiry_date": validated_data.get("expiryDate"),
                "notes": validated_data.get("notes", ""),
                "created_by": request.user,
                "updated_by": request.user,
            },
        )
        if not created:
            if validated_data.get("expiryDate"):
                stock.expiry_date = validated_data["expiryDate"]
            if validated_data.get("notes"):
                stock.notes = validated_data["notes"]
            stock.updated_by = request.user
            stock.save(update_fields=["expiry_date", "notes", "updated_by", "updated_at"])
        _record_movement(
            stock=stock,
            movement_type=StockMovementType.STOCK_IN,
            delta=validated_data["quantity"],
            user=request.user,
            reason=validated_data.get("reason") or "Stock in",
            notes=validated_data.get("notes", ""),
        )
        stock.refresh_from_db()
        from apps.notifications.services import notify_center_stock_update

        notify_center_stock_update(
            stock.hospital,
            stock.factor_medicine.name,
            validated_data["quantity"],
            stock.unit,
            user=request.user,
        )
        return stock


class StockAdjustSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    reason = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    expiryDate = serializers.DateField(required=False, allow_null=True)
    batchNumber = serializers.CharField(required=False, allow_blank=True)
    factorMedicineId = serializers.IntegerField(required=False)

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value

    def update(self, instance, validated_data):
        request = self.context["request"]
        new_qty = validated_data.get("quantity", instance.quantity)
        delta = new_qty - instance.quantity
        if "expiryDate" in validated_data:
            instance.expiry_date = validated_data.get("expiryDate")
        if "batchNumber" in validated_data:
            instance.batch_number = (validated_data.get("batchNumber") or "").strip()
        if "factorMedicineId" in validated_data:
            factor = FactorMedicine.objects.filter(
                pk=validated_data["factorMedicineId"], is_active=True
            ).first()
            if not factor:
                raise serializers.ValidationError({"factorMedicineId": "Unknown or inactive factor product."})
            instance.factor_medicine = factor
            instance.unit = factor.unit
        instance.updated_by = request.user
        if validated_data.get("notes"):
            instance.notes = validated_data["notes"]
        instance.save()
        if delta != 0:
            _record_movement(
                stock=instance,
                movement_type=StockMovementType.ADJUSTMENT,
                delta=delta,
                user=request.user,
                reason=validated_data.get("reason") or "Stock adjustment",
                notes=validated_data.get("notes", ""),
            )
        instance.refresh_from_db()
        return instance


class StockMoveSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    reason = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value
