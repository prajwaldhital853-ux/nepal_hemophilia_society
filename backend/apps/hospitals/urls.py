from django.urls import path

from apps.hospitals.views import HospitalListView, HospitalStaffViewSet

app_name = "hospitals"

staff_list = HospitalStaffViewSet.as_view({"get": "list", "post": "create"})
staff_detail = HospitalStaffViewSet.as_view({"get": "retrieve", "put": "update"})
hospital_list = HospitalListView.as_view({"get": "list", "post": "create"})
hospital_detail = HospitalListView.as_view({"put": "update", "patch": "update"})

urlpatterns = [
    path("", hospital_list, name="list"),
    path("<int:pk>/", hospital_detail, name="detail"),
    path(
        "staff/treatment-admins/",
        HospitalStaffViewSet.as_view({"get": "list", "post": "create"}),
        {"staff_type": "treatment_admin"},
        name="treatment-admins",
    ),
    path(
        "staff/treatment-admins/<str:display_id>/",
        HospitalStaffViewSet.as_view({"get": "retrieve", "put": "update"}),
        {"staff_type": "treatment_admin"},
        name="treatment-admin-detail",
    ),
    path(
        "staff/center-admins/",
        HospitalStaffViewSet.as_view({"get": "list", "post": "create"}),
        {"staff_type": "center_admin"},
        name="center-admins",
    ),
    path(
        "staff/center-admins/<str:display_id>/",
        HospitalStaffViewSet.as_view({"get": "retrieve", "put": "update"}),
        {"staff_type": "center_admin"},
        name="center-admin-detail",
    ),
]
