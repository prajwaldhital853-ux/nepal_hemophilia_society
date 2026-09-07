# Generated manually for hospital staff admin fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def assign_display_ids(apps, schema_editor):
    HospitalAdmin = apps.get_model("hospitals", "HospitalAdmin")
    counters = {"treatment_admin": 0, "center_admin": 0}
    for profile in HospitalAdmin.objects.order_by("id"):
        staff_type = profile.staff_type or "treatment_admin"
        counters[staff_type] = counters.get(staff_type, 0) + 1
        prefix = "TADM" if staff_type == "treatment_admin" else "CADM"
        profile.display_id = f"{prefix}-{counters[staff_type]:05d}"
        profile.save(update_fields=["display_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("hospitals", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("provinces", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="hospitaladmin",
            name="staff_type",
            field=models.CharField(
                choices=[("treatment_admin", "Treatment Admin"), ("center_admin", "Center Admin")],
                default="treatment_admin",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="hospitaladmin",
            name="display_id",
            field=models.CharField(db_index=True, max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="hospitaladmin",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="hospitaladmin",
            name="gender",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="hospitaladmin",
            name="address",
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(assign_display_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="hospitaladmin",
            name="display_id",
            field=models.CharField(db_index=True, max_length=20, unique=True),
        ),
        migrations.AddIndex(
            model_name="hospitaladmin",
            index=models.Index(fields=["staff_type"], name="hospital_ad_staff_t_idx"),
        ),
        migrations.CreateModel(
            name="ProvinceAdmin",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("display_id", models.CharField(db_index=True, max_length=20, unique=True)),
                (
                    "province",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="admins", to="provinces.province"),
                ),
                (
                    "user",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="province_admin", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "db_table": "province_admins",
            },
        ),
    ]
