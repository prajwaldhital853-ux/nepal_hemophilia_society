from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "module", "object_id")
    list_filter = ("module",)
    search_fields = ("actor", "action", "object_id", "detail")
    readonly_fields = ("created_at", "updated_at")
