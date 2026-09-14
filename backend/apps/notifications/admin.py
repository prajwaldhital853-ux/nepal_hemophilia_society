from django.contrib import admin

from apps.notifications.models import PatientNotification


@admin.register(PatientNotification)
class PatientNotificationAdmin(admin.ModelAdmin):
    list_display = ("patient", "category", "title", "is_read", "created_at")
    list_filter = ("category", "is_read")
    search_fields = ("patient__unique_patient_id", "title", "message")
