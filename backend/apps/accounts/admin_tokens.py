import os
from datetime import timedelta

from rest_framework_simplejwt.tokens import RefreshToken

ADMIN_ACCESS_LIFETIME = timedelta(hours=int(os.getenv("JWT_ADMIN_ACCESS_HOURS", "8")))
ADMIN_REFRESH_LIFETIME = timedelta(hours=int(os.getenv("JWT_ADMIN_REFRESH_HOURS", "12")))


def issue_admin_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["username"] = user.username
    refresh.set_exp(lifetime=ADMIN_REFRESH_LIFETIME)
    access = refresh.access_token
    access["role"] = user.role
    access["username"] = user.username
    access["must_change_password"] = user.must_change_password
    access.set_exp(lifetime=ADMIN_ACCESS_LIFETIME)
    return {"refresh": str(refresh), "access": str(access)}
