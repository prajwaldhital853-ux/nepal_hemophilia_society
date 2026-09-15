from django.urls import path

from apps.reports.views import ReportDashboardView, ReportSummaryView

app_name = "reports"

urlpatterns = [
    path("", ReportSummaryView.as_view(), name="list"),
    path("dashboard/", ReportDashboardView.as_view(), name="dashboard"),
]
