from django.db import models

from apps.core.models import TimeStampedModel


class ServiceCategory(models.TextChoices):
    TREATMENT = "treatment", "Treatment & Health Management"
    EDUCATION = "education", "Education & Awareness"
    SUPPORT = "support", "Support & Community"
    MORE = "more", "More Services"


class ServiceAction(models.TextChoices):
    CONTENT = "content", "Detail page"
    APP_SCREEN = "app_screen", "Open app screen"
    URL = "url", "External link"
    NEWS = "news", "News list"
    EVENTS = "events", "Events list"
    RESOURCES = "resources", "Resources list"
    GALLERY = "gallery", "Gallery"


class ContentKind(models.TextChoices):
    NEWS = "news", "News & Notices"
    EVENT = "event", "Event"
    RESOURCE = "resource", "Resource / Download"
    GALLERY = "gallery", "Gallery"
    INSIGHT = "insight", "Health insight tip"


class AppService(TimeStampedModel):
    """Patient-app Services catalog. Admins publish, hide, and write detail copy."""

    slug = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=160)
    description = models.CharField(max_length=240)
    body = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=ServiceCategory.choices)
    icon_set = models.CharField(max_length=8, default="ion")
    icon_name = models.CharField(max_length=64, default="medkit-outline")
    action_type = models.CharField(max_length=20, choices=ServiceAction.choices, default=ServiceAction.CONTENT)
    action_value = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    website_url = models.URLField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    published = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "cms_app_services"
        ordering = ["category", "sort_order", "title"]

    def __str__(self):
        return self.title


class CmsArticle(TimeStampedModel):
    """News, events, resources, and gallery items shown from service detail pages."""

    kind = models.CharField(max_length=20, choices=ContentKind.choices)
    slug = models.SlugField(max_length=80)
    title = models.CharField(max_length=200)
    summary = models.CharField(max_length=400, blank=True)
    body = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    file_url = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    published = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "cms_articles"
        ordering = ["-starts_at", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["kind", "slug"], name="cms_article_kind_slug_unique"),
        ]

    def __str__(self):
        return f"{self.kind}: {self.title}"
