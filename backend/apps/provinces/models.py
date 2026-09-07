from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Province(TimeStampedModel):
    name = models.CharField(max_length=64, unique=True)
    code = models.CharField(max_length=32, unique=True)

    class Meta:
        db_table = "provinces"
        ordering = ["id"]

    def __str__(self):
        return self.name


class District(TimeStampedModel):
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name="districts")
    name = models.CharField(max_length=128)

    class Meta:
        db_table = "districts"
        ordering = ["name"]
        unique_together = ("province", "name")

    def __str__(self):
        return f"{self.name}, {self.province.name}"


class ProvinceAdmin(TimeStampedModel):
    """Province Admin user ↔ province mapping (plan.md §9)."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="province_admin")
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name="admins")
    display_id = models.CharField(max_length=20, unique=True, db_index=True)

    class Meta:
        db_table = "province_admins"

    def __str__(self):
        return f"{self.display_id} — {self.province.name}"
