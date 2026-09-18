from rest_framework import serializers

from apps.cms.models import AppService, CmsArticle, ContentKind, ServiceAction, ServiceCategory


class AppServiceSerializer(serializers.ModelSerializer):
    iconSet = serializers.CharField(source="icon_set")
    iconName = serializers.CharField(source="icon_name")
    actionType = serializers.CharField(source="action_type")
    actionValue = serializers.CharField(source="action_value", required=False, allow_blank=True)
    websiteUrl = serializers.CharField(source="website_url", required=False, allow_blank=True)
    sortOrder = serializers.IntegerField(source="sort_order", required=False)
    categoryLabel = serializers.CharField(source="get_category_display", read_only=True)
    actionLabel = serializers.CharField(source="get_action_type_display", read_only=True)

    class Meta:
        model = AppService
        fields = (
            "id",
            "slug",
            "title",
            "description",
            "body",
            "category",
            "categoryLabel",
            "iconSet",
            "iconName",
            "actionType",
            "actionLabel",
            "actionValue",
            "phone",
            "email",
            "websiteUrl",
            "address",
            "published",
            "sortOrder",
        )

    def validate_category(self, value):
        if value not in ServiceCategory.values:
            raise serializers.ValidationError("Unknown category.")
        return value

    def validate_actionType(self, value):
        if value not in ServiceAction.values:
            raise serializers.ValidationError("Unknown action type.")
        return value

    def validate(self, attrs):
        icon_set = attrs.get("icon_set", getattr(self.instance, "icon_set", "ion"))
        if icon_set not in ("ion", "mci"):
            raise serializers.ValidationError({"iconSet": "Must be ion or mci."})
        return attrs


class AppServiceListSerializer(AppServiceSerializer):
    class Meta(AppServiceSerializer.Meta):
        fields = tuple(f for f in AppServiceSerializer.Meta.fields if f != "body")


def _absolute_cms_url(request, value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw
    if request is not None:
        return request.build_absolute_uri(raw)
    return raw


class CmsArticleSerializer(serializers.ModelSerializer):
    imageUrl = serializers.CharField(source="image_url", required=False, allow_blank=True)
    fileUrl = serializers.CharField(source="file_url", required=False, allow_blank=True)
    startsAt = serializers.DateTimeField(source="starts_at", required=False, allow_null=True)
    endsAt = serializers.DateTimeField(source="ends_at", required=False, allow_null=True)
    sortOrder = serializers.IntegerField(source="sort_order", required=False)
    kindLabel = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = CmsArticle
        fields = (
            "id",
            "kind",
            "kindLabel",
            "slug",
            "title",
            "summary",
            "body",
            "imageUrl",
            "fileUrl",
            "location",
            "startsAt",
            "endsAt",
            "published",
            "sortOrder",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        data["imageUrl"] = _absolute_cms_url(request, instance.image_url)
        data["fileUrl"] = _absolute_cms_url(request, instance.file_url)
        return data

    def validate_kind(self, value):
        if value not in ContentKind.values:
            raise serializers.ValidationError("Unknown content kind.")
        return value
