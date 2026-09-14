from django.contrib import admin

from apps.stock.models import FactorStock, StockMovement


@admin.register(FactorStock)
class FactorStockAdmin(admin.ModelAdmin):
    list_display = ("hospital", "factor_medicine", "batch_number", "quantity", "unit", "expiry_date")
    search_fields = ("batch_number", "factor_medicine__name", "hospital__name")


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("stock", "movement_type", "quantity_delta", "recorded_by", "created_at")
    list_filter = ("movement_type",)
