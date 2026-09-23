import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0001_appointment_system"),
        ("hospitals", "0003_province_admin_state"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AppointmentSlot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("slot_at", models.DateTimeField(db_index=True)),
                ("capacity", models.PositiveSmallIntegerField(default=1)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="appointment_slots_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "hospital",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="appointment_slots",
                        to="hospitals.hospital",
                    ),
                ),
            ],
            options={
                "db_table": "appointment_slots",
                "ordering": ["slot_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="appointmentslot",
            constraint=models.UniqueConstraint(fields=("hospital", "slot_at"), name="uniq_hospital_slot"),
        ),
    ]
