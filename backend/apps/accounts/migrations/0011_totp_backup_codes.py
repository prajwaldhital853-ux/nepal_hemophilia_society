from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_user_totp"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="totp_backup_issued",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="TotpBackupCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code_hash", models.CharField(max_length=128)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="totp_backup_codes",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "db_table": "totp_backup_codes",
                "indexes": [models.Index(fields=["user", "used_at"], name="totp_backup_user_used_idx")],
            },
        ),
        migrations.RunPython(
            code=lambda apps, schema_editor: apps.get_model("accounts", "User")
            .objects.filter(totp_enabled=True)
            .update(totp_backup_issued=True),
            reverse_code=migrations.RunPython.noop,
        ),
    ]
