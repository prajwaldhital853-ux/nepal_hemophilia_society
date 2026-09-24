from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_user_last_logout_at_user_last_seen_at_and_more"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["role"], name="users_role_idx"),
        ),
    ]
