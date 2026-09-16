from django.urls import path

from apps.accounts.directory_views import UsersDirectoryView

app_name = "users"

urlpatterns = [
    path("", UsersDirectoryView.as_view(), name="directory"),
]
