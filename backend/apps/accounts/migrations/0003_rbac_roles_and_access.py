from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_user_must_change_password_user_password_changed_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("patient", "Patient"),
                    ("hospital_admin", "Hospital Admin"),
                    ("province_admin", "Province Admin"),
                    ("admin", "Admin"),
                    ("super_admin", "Super Admin"),
                    ("website_manager", "Website Manager"),
                ],
                default="patient",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="staff_id",
            field=models.CharField(blank=True, db_index=True, max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="user",
            name="view_only",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="extra_permissions",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="gender",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="user",
            name="designation",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="user",
            name="employee_id",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="user",
            name="national_id",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="user",
            name="office_address",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="user",
            name="notes",
            field=models.TextField(blank=True),
        ),
    ]
