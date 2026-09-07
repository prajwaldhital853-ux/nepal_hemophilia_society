# Move ProvinceAdmin state from hospitals app to provinces app (table already exists).

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("provinces", "0001_initial"),
        ("hospitals", "0002_hospital_staff_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
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
                    options={"db_table": "province_admins"},
                ),
            ],
            database_operations=[],
        ),
    ]
