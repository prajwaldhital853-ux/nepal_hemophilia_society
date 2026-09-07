from django.contrib import admin

from apps.patients.models import Patient, PatientDocument


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "unique_patient_id",
        "full_name",
        "hemophilia_type",
        "severity",
        "province",
        "verification_status",
        "created_at",
    )
    list_filter = ("hemophilia_type", "severity", "verification_status", "province")
    search_fields = ("unique_patient_id", "full_name", "mobile", "email")
    readonly_fields = ("unique_patient_id", "deficient_factor", "created_at", "updated_at")


@admin.register(PatientDocument)
class PatientDocumentAdmin(admin.ModelAdmin):
    list_display = ("original_name", "patient", "size", "created_at")
    search_fields = ("original_name", "patient__unique_patient_id")
