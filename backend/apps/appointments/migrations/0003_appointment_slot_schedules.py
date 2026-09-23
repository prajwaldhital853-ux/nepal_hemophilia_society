from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("appointments", "0002_appointment_slots"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("hospitals", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AppointmentSlotSchedule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("times", models.JSONField(default=list)),
                (
                    "repeat_mode",
                    models.CharField(
                        choices=[
                            ("every_day", "Every day"),
                            ("weekdays", "Weekdays (Mon–Fri)"),
                            ("except_days", "Every day except selected days"),
                        ],
                        default="every_day",
                        max_length=20,
                    ),
                ),
                ("exclude_weekdays", models.JSONField(blank=True, default=list)),
                ("weeks_ahead", models.PositiveSmallIntegerField(default=8)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="appointment_slot_schedules_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "hospital",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="appointment_slot_schedules",
                        to="hospitals.hospital",
                    ),
                ),
            ],
            options={
                "db_table": "appointment_slot_schedules",
                "ordering": ["-created_at"],
            },
        ),
    ]
