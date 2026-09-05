from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    PATIENT = "patient", "Patient"
    HOSPITAL_ADMIN = "hospital_admin", "Hospital Admin"
    PROVINCE_ADMIN = "province_admin", "Province Admin"
    SUPER_ADMIN = "super_admin", "Super Admin"


class User(AbstractUser):
    """Custom user model with role-based access."""

    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
    )
    mobile = models.CharField(max_length=20, blank=True)
    is_active_account = models.BooleanField(default=True)

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    @property
    def is_super_admin(self) -> bool:
        return self.role == UserRole.SUPER_ADMIN

    @property
    def is_province_admin(self) -> bool:
        return self.role == UserRole.PROVINCE_ADMIN

    @property
    def is_hospital_admin(self) -> bool:
        return self.role == UserRole.HOSPITAL_ADMIN

    @property
    def is_patient(self) -> bool:
        return self.role == UserRole.PATIENT
