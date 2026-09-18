from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView


class CronPingView(APIView):
    """Minimal 200 OK for external cron jobs (e.g. keep Render awake). No DB access."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})

    def head(self, request):
        return Response(status=200)


class HealthCheckView(APIView):
    """Simple health check for load balancers and dev verification."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        pending_migrations = []
        try:
            executor = MigrationExecutor(connection)
            targets = executor.loader.graph.leaf_nodes()
            pending_migrations = [f"{app}.{name}" for app, name in executor.migration_plan(targets)]
        except Exception:
            pending_migrations = ["unavailable"]

        return Response(
            {
                "status": "ok" if not pending_migrations else "degraded",
                "service": "nhms-api",
                "pendingMigrations": pending_migrations,
            }
        )


app_name = "core"

urlpatterns = [
    path("", HealthCheckView.as_view(), name="health"),
]
