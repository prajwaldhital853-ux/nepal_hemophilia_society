from django.urls import path

from apps.reports.views import ReportSummaryView

app_name = "reports"

urlpatterns = [
    path("", ReportSummaryView.as_view(), name="list"),
]
