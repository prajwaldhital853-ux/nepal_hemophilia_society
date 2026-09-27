from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_user_role_index"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="totp_secret_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="user",
            name="totp_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="totp_confirmed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
