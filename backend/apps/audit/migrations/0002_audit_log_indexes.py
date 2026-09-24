from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("audit", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["-created_at"], name="audit_created_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["actor"], name="audit_actor_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["module", "-created_at"], name="audit_module_created_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["action"], name="audit_action_idx"),
        ),
    ]
