from django.urls import path

from apps.cms.views import (
    AdminArticleDetailView,
    AdminArticlesView,
    AdminServiceDetailView,
    AdminServicesView,
    PatientArticleDetailView,
    PatientArticlesView,
    PatientCentersView,
    PatientServiceDetailView,
    PatientServicesView,
)

app_name = "cms"

urlpatterns = [
    path("services/", PatientServicesView.as_view(), name="patient-services"),
    path("services/<slug:slug>/", PatientServiceDetailView.as_view(), name="patient-service-detail"),
    path("centers/", PatientCentersView.as_view(), name="patient-centers"),
    path("content/<str:kind>/", PatientArticlesView.as_view(), name="patient-articles"),
    path("content/<str:kind>/<slug:slug>/", PatientArticleDetailView.as_view(), name="patient-article-detail"),
    path("admin/services/", AdminServicesView.as_view(), name="admin-services"),
    path("admin/services/<int:pk>/", AdminServiceDetailView.as_view(), name="admin-service-detail"),
    path("admin/content/", AdminArticlesView.as_view(), name="admin-articles"),
    path("admin/content/<int:pk>/", AdminArticleDetailView.as_view(), name="admin-article-detail"),
]
