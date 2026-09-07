from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.admin_auth import AdminChangePasswordView
from apps.accounts.jwt import NhmsTokenObtainPairView
from apps.accounts.patient_auth import PatientChangePasswordView, PatientLoginView
from apps.accounts.views import MeView

app_name = "accounts"

urlpatterns = [
    path("login/", NhmsTokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", AdminChangePasswordView.as_view(), name="admin-change-password"),
    path("patient/login/", PatientLoginView.as_view(), name="patient-login"),
    path("patient/change-password/", PatientChangePasswordView.as_view(), name="patient-change-password"),
]
