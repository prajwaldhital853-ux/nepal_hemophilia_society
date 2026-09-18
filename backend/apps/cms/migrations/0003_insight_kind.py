from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0002_seed_defaults"),
    ]

    operations = [
        migrations.AlterField(
            model_name="cmsarticle",
            name="kind",
            field=models.CharField(
                choices=[
                    ("news", "News & Notices"),
                    ("event", "Event"),
                    ("resource", "Resource / Download"),
                    ("gallery", "Gallery"),
                    ("insight", "Health insight tip"),
                ],
                max_length=20,
            ),
        ),
    ]
