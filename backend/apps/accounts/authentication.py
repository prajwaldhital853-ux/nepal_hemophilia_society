from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.presence import mark_seen
from apps.accounts.session import session_token_stale


class SessionExpiredAuthentication(AuthenticationFailed):
    default_detail = "Session expired. Sign in again."
    default_code = "session_expired"


class ActivityJWTAuthentication(JWTAuthentication):
    """JWT auth that also keeps users' last_seen_at current (throttled)."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, validated_token = result
        if session_token_stale(user, validated_token.payload):
            raise SessionExpiredAuthentication()
        try:
            mark_seen(user)
        except Exception:
            pass
        return user, validated_token
