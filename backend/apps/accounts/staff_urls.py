from django.urls import path

from apps.accounts.staff_views import StaffCatalogView, StaffDetailView, StaffListCreateView

app_name = "admins"

urlpatterns = [
    path("catalog/", StaffCatalogView.as_view(), name="staff-catalog"),
    path("staff/", StaffListCreateView.as_view(), name="staff-list"),
    path("staff/<str:display_id>/", StaffDetailView.as_view(), name="staff-detail"),
]
