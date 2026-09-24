from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.presence import mark_seen


class ActivityJWTAuthentication(JWTAuthentication):
    """JWT auth that also keeps users' last_seen_at current (throttled)."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, _token = result
            try:
                mark_seen(user)
            except Exception:
                pass
        return result
