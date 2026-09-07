from rest_framework import serializers

from apps.factors.models import FactorMedicine


class FactorMedicineSerializer(serializers.ModelSerializer):
    brandName = serializers.CharField(source="brand_name", required=False, allow_blank=True)
    factorType = serializers.CharField(source="factor_type")
    applicableType = serializers.CharField(source="applicable_type")
    standardDoseNotes = serializers.CharField(source="standard_dose_notes", required=False, allow_blank=True)
    isActive = serializers.BooleanField(source="is_active", required=False)

    class Meta:
        model = FactorMedicine
        fields = (
            "id",
            "name",
            "brandName",
            "factorType",
            "applicableType",
            "unit",
            "standardDoseNotes",
            "isActive",
        )
