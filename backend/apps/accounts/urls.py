from django.urls import path

from apps.accounts.admin_auth import AdminChangePasswordView
from apps.accounts.forgot_password import AdminForgotPasswordView, AdminResetPasswordView, AdminVerifyResetOtpView
from apps.accounts.jwt import NhmsTokenObtainPairView, NhmsTokenRefreshView
from apps.accounts.patient_auth import PatientChangePasswordView, PatientLoginView
from apps.accounts.staff_views import StaffCatalogView, StaffDetailView, StaffListCreateView
from apps.accounts.views import MeProfileView, MeView

app_name = "accounts"

urlpatterns = [
    path("login/", NhmsTokenObtainPairView.as_view(), name="login"),
    path("refresh/", NhmsTokenRefreshView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("me/profile/", MeProfileView.as_view(), name="me-profile"),
    path("change-password/", AdminChangePasswordView.as_view(), name="admin-change-password"),
    path("forgot-password/", AdminForgotPasswordView.as_view(), name="admin-forgot-password"),
    path("verify-reset-otp/", AdminVerifyResetOtpView.as_view(), name="admin-verify-reset-otp"),
    path("reset-password/", AdminResetPasswordView.as_view(), name="admin-reset-password"),
    path("patient/login/", PatientLoginView.as_view(), name="patient-login"),
    path("patient/change-password/", PatientChangePasswordView.as_view(), name="patient-change-password"),
]
