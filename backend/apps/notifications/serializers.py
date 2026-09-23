from rest_framework import serializers

from apps.notifications.models import AdminNotification, PatientNotification


class PatientNotificationSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    category = serializers.CharField(read_only=True)
    isRead = serializers.BooleanField(source="is_read")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    relatedType = serializers.CharField(source="related_type", read_only=True)
    relatedId = serializers.IntegerField(source="related_id", read_only=True)

    class Meta:
        model = PatientNotification
        fields = (
            "id",
            "category",
            "title",
            "message",
            "isRead",
            "relatedType",
            "relatedId",
            "createdAt",
        )


class AdminNotificationSerializer(serializers.ModelSerializer):
    isRead = serializers.BooleanField(source="is_read")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    actorName = serializers.CharField(source="actor_name", read_only=True)
    relatedType = serializers.CharField(source="related_type", read_only=True)
    relatedId = serializers.IntegerField(source="related_id", read_only=True)

    class Meta:
        model = AdminNotification
        fields = (
            "id",
            "category",
            "title",
            "message",
            "isRead",
            "actorName",
            "relatedType",
            "relatedId",
            "createdAt",
        )
