from django.db import migrations


def reset_superadmin_2fa(apps, schema_editor):
    """Clear stale 2FA on SUPERADMIN / legacy superadmin so setup QR runs on next login."""
    User = apps.get_model("accounts", "User")
    TotpBackupCode = apps.get_model("accounts", "TotpBackupCode")
    usernames = ("SUPERADMIN", "superadmin", "super", "Superadmin", "SuperAdmin")
    for username in usernames:
        user = User.objects.filter(username=username).first()
        if not user:
            continue
        if username != "SUPERADMIN":
            user.username = "SUPERADMIN"
        user.totp_secret_encrypted = ""
        user.totp_enabled = False
        user.totp_confirmed_at = None
        user.totp_backup_issued = False
        user.role = "super_admin"
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.is_active_account = True
        user.save(
            update_fields=[
                "username",
                "totp_secret_encrypted",
                "totp_enabled",
                "totp_confirmed_at",
                "totp_backup_issued",
                "role",
                "is_staff",
                "is_superuser",
                "is_active",
                "is_active_account",
            ]
        )
        TotpBackupCode.objects.filter(user_id=user.pk).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0011_totp_backup_codes"),
    ]

    operations = [
        migrations.RunPython(reset_superadmin_2fa, migrations.RunPython.noop),
    ]
