from django.contrib import admin

from apps.cms.models import AppService, CmsArticle


@admin.register(AppService)
class AppServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "category", "action_type", "published", "sort_order")
    list_filter = ("category", "action_type", "published")
    search_fields = ("title", "slug", "description")


@admin.register(CmsArticle)
class CmsArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "slug", "published", "starts_at")
    list_filter = ("kind", "published")
    search_fields = ("title", "slug", "summary")
