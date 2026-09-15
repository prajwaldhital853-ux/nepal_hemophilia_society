from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    PATIENT = "patient", "Patient"
    HOSPITAL_ADMIN = "hospital_admin", "Hospital Admin"
    PROVINCE_ADMIN = "province_admin", "Province Admin"
    ADMIN = "admin", "Admin"
    SUPER_ADMIN = "super_admin", "Super Admin"
    WEBSITE_MANAGER = "website_manager", "Website Manager"


class User(AbstractUser):
    """Custom user model with role-based access."""

    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
    )
    mobile = models.CharField(max_length=20, blank=True)
    is_active_account = models.BooleanField(default=True)
    must_change_password = models.BooleanField(default=False)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    staff_id = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    view_only = models.BooleanField(default=False)
    extra_permissions = models.JSONField(default=list, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=120, blank=True)
    employee_id = models.CharField(max_length=40, blank=True)
    national_id = models.CharField(max_length=40, blank=True)
    office_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    photo = models.ImageField(upload_to="admins/photos/", blank=True)

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    @property
    def is_super_admin(self) -> bool:
        return self.role == UserRole.SUPER_ADMIN

    @property
    def is_national_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_province_admin(self) -> bool:
        return self.role == UserRole.PROVINCE_ADMIN

    @property
    def is_hospital_admin(self) -> bool:
        return self.role == UserRole.HOSPITAL_ADMIN

    @property
    def is_website_manager(self) -> bool:
        return self.role == UserRole.WEBSITE_MANAGER

    @property
    def is_patient(self) -> bool:
        return self.role == UserRole.PATIENT


class LoginDeviceLock(models.Model):
    """Failed-password lock scoped to one device + identifier, not the whole account."""

    device_id = models.CharField(max_length=64, db_index=True)
    identifier = models.CharField(max_length=255, db_index=True)
    user = models.ForeignKey(
        "User",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="device_locks",
    )
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "login_device_locks"
        unique_together = ("device_id", "identifier")

    def __str__(self):
        return f"{self.identifier} @ {self.device_id[:8]}"
