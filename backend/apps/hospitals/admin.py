from django.contrib import admin

from apps.hospitals.models import Hospital


@admin.register(Hospital)
class HospitalRecordAdmin(admin.ModelAdmin):
    list_display = ("name", "province", "is_active")
    list_filter = ("province", "is_active")
    search_fields = ("name",)
