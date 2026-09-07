from django.urls import path

from apps.provinces.admin_views import ProvinceAdminDetailView, ProvinceAdminListCreateView
from apps.provinces.views import ProvinceListView

app_name = "provinces"

urlpatterns = [
    path("", ProvinceListView.as_view(), name="list"),
    path("admins/", ProvinceAdminListCreateView.as_view(), name="province-admins"),
    path("admins/<str:display_id>/", ProvinceAdminDetailView.as_view(), name="province-admin-detail"),
]
