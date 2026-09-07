from django.urls import path

from apps.factors.views import FactorAdminView, FactorListView

app_name = "factors"

urlpatterns = [
    path("", FactorListView.as_view(), name="list"),
    path("manage/", FactorAdminView.as_view(), name="manage"),
]
