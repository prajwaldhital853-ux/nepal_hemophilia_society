from django.db import models

from apps.core.models import TimeStampedModel


class AuditLog(TimeStampedModel):
    actor = models.CharField(max_length=255)
    action = models.CharField(max_length=255)
    module = models.CharField(max_length=64)
    object_id = models.CharField(max_length=64, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    detail = models.TextField(blank=True)
    extra = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"], name="audit_created_idx"),
            models.Index(fields=["actor"], name="audit_actor_idx"),
            models.Index(fields=["module", "-created_at"], name="audit_module_created_idx"),
            models.Index(fields=["action"], name="audit_action_idx"),
        ]

    def __str__(self):
        return f"{self.action} ({self.module})"
