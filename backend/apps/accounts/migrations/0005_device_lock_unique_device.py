from django.db import migrations, models


def collapse_device_locks(apps, schema_editor):
    LoginDeviceLock = apps.get_model("accounts", "LoginDeviceLock")
    seen = {}
    for row in LoginDeviceLock.objects.order_by("-updated_at"):
        if row.device_id in seen:
            row.delete()
            continue
        seen[row.device_id] = row.pk


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_user_photo"),
    ]

    operations = [
        migrations.RunPython(collapse_device_locks, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="logindevicelock",
            unique_together=set(),
        ),
        migrations.AlterField(
            model_name="logindevicelock",
            name="device_id",
            field=models.CharField(max_length=64, unique=True),
        ),
    ]
