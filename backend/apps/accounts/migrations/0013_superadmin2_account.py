from django.db import migrations


def migrate_primary_super_admin(apps, schema_editor):
    """Rename legacy super-admin logins to SUPERADMIN2 and clear stale 2FA."""
    User = apps.get_model("accounts", "User")
    TotpBackupCode = apps.get_model("accounts", "TotpBackupCode")
    target = "SUPERADMIN2"
    legacy_names = ("SUPERADMIN", "superadmin", "super", "Superadmin", "SuperAdmin")

    primary = User.objects.filter(username=target).first()
    for legacy_name in legacy_names:
        legacy = User.objects.filter(username=legacy_name).first()
        if not legacy:
            continue
        if primary and primary.pk != legacy.pk:
            legacy.is_active = False
            legacy.is_active_account = False
            legacy.save(update_fields=["is_active", "is_active_account"])
            continue
        legacy.username = target
        legacy.totp_secret_encrypted = ""
        legacy.totp_enabled = False
        legacy.totp_confirmed_at = None
        legacy.totp_backup_issued = False
        legacy.role = "super_admin"
        legacy.is_staff = True
        legacy.is_superuser = True
        legacy.is_active = True
        legacy.is_active_account = True
        legacy.save(
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
        TotpBackupCode.objects.filter(user_id=legacy.pk).delete()
        primary = legacy


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0012_reset_superadmin_2fa"),
    ]

    operations = [
        migrations.RunPython(migrate_primary_super_admin, migrations.RunPython.noop),
    ]
