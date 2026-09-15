from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_rbac_roles_and_access"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="photo",
            field=models.ImageField(blank=True, upload_to="admins/photos/"),
        ),
    ]
