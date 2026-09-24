"""Login / activity presence for users — backs the "Last login" and "Online" columns in the admin panel."""

from datetime import timedelta

from django.utils import timezone

ONLINE_WINDOW = timedelta(minutes=5)
# Authenticated requests refresh last_seen_at at most this often to avoid a write per request.
SEEN_WRITE_INTERVAL = timedelta(minutes=2)


def _iso(value):
    return value.isoformat() if value else ""


def presence_state(user, now=None) -> str:
    """One of: never, online, signed_out, away."""
    if not user or not user.last_login:
        return "never"
    now = now or timezone.now()
    seen = user.last_seen_at or user.last_login
    logout = getattr(user, "last_logout_at", None)
    if logout and logout >= seen:
        return "signed_out"
    if now - seen <= ONLINE_WINDOW:
        return "online"
    return "away"


def presence_fields(user, now=None) -> dict:
    """Serializable presence block shared by every endpoint that lists accounts."""
    if not user:
        return {"lastLogin": "", "lastSeen": "", "lastLogout": "", "presence": "never", "online": False}
    state = presence_state(user, now)
    return {
        "lastLogin": _iso(user.last_login),
        "lastSeen": _iso(user.last_seen_at or user.last_login),
        "lastLogout": _iso(getattr(user, "last_logout_at", None)),
        "presence": state,
        "online": state == "online",
    }


def online_cutoff(now=None):
    return (now or timezone.now()) - ONLINE_WINDOW


def mark_login(user):
    """Record a successful password sign-in."""
    from apps.accounts.models import User

    now = timezone.now()
    User.objects.filter(pk=user.pk).update(last_login=now, last_seen_at=now)
    user.last_login = now
    user.last_seen_at = now


def mark_seen(user, force=False):
    """Refresh last_seen_at, throttled so busy sessions don't write on every request."""
    from apps.accounts.models import User

    if not user or not getattr(user, "pk", None):
        return
    now = timezone.now()
    seen = getattr(user, "last_seen_at", None)
    logout = getattr(user, "last_logout_at", None)
    signed_out = bool(logout and seen and logout >= seen)
    if not force and not signed_out and seen and now - seen < SEEN_WRITE_INTERVAL:
        return
    User.objects.filter(pk=user.pk).update(last_seen_at=now)
    user.last_seen_at = now


def mark_logout(user):
    from apps.accounts.models import User

    now = timezone.now()
    User.objects.filter(pk=user.pk).update(last_logout_at=now)
    user.last_logout_at = now
