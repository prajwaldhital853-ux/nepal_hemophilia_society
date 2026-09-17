from django.db import migrations


def seed_defaults(apps, schema_editor):
    from apps.cms.seed import seed_cms_defaults

    seed_cms_defaults()


def unseed(apps, schema_editor):
    AppService = apps.get_model("cms", "AppService")
    CmsArticle = apps.get_model("cms", "CmsArticle")
    AppService.objects.filter(
        slug__in=[
            "treatment-history",
            "injection-logs",
            "upcoming-events",
            "health-records",
            "bleeding-history",
            "factor-stock",
            "analytics",
            "emergency-support",
            "resources",
            "training",
            "campaigns",
            "tools",
            "community",
            "programs",
            "help",
            "contact",
            "downloads",
            "centers",
            "emergency-id",
            "settings",
        ]
    ).delete()
    CmsArticle.objects.filter(
        slug__in=["world-hemophilia-day", "family-education-day", "home-infusion-guide", "nhs-community"]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("cms", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_defaults, unseed),
    ]
