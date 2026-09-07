from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.provinces.models import District, Province


class Hospital(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)
    province = models.ForeignKey(Province, on_delete=models.PROTECT, related_name="hospitals")
    district = models.ForeignKey(District, null=True, blank=True, on_delete=models.SET_NULL, related_name="hospitals")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hospitals"
        ordering = ["name"]

    def __str__(self):
        return self.name


class HospitalStaffType(models.TextChoices):
    TREATMENT_ADMIN = "treatment_admin", "Treatment Admin"
    CENTER_ADMIN = "center_admin", "Center Admin"


class HospitalAdmin(TimeStampedModel):
    """
    Hospital staff account linked to one treatment center (hospital).
    Maps UI Treatment Admin / Center Admin to plan.md Hospital Admin role on User.
    """

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hospital_admin")
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="admins")
    staff_type = models.CharField(max_length=32, choices=HospitalStaffType.choices, default=HospitalStaffType.TREATMENT_ADMIN)
    display_id = models.CharField(max_length=20, unique=True, db_index=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    class Meta:
        db_table = "hospital_admins"
        indexes = [
            models.Index(fields=["staff_type"]),
        ]

    def __str__(self):
        return f"{self.display_id} — {self.user.get_full_name() or self.user.username}"
