"""Device-scoped login lockout. Never keyed by IP."""

from datetime import timedelta

from django.utils import timezone

from apps.accounts.models import LoginDeviceLock

MAX_FAILED_ATTEMPTS = 3
LOCK_MINUTES = 5
IDLE_RESET = timedelta(hours=1)
MIN_DEVICE_ID_LENGTH = 8


def normalize_identifier(value: str) -> str:
    return (value or "").strip().lower()


def normalize_device_id(value: str) -> str:
    return (value or "").strip()[:64]


def is_valid_device_id(value: str) -> bool:
    device_id = normalize_device_id(value)
    return len(device_id) >= MIN_DEVICE_ID_LENGTH


def get_device_lock(device_id: str) -> LoginDeviceLock | None:
    qs = LoginDeviceLock.objects.filter(device_id=normalize_device_id(device_id)).order_by("-updated_at")
    lock = qs.first()
    if lock:
        qs.exclude(pk=lock.pk).delete()
    return lock


def remaining_lock_seconds(lock: LoginDeviceLock) -> int:
    if not lock.locked_until:
        return 0
    delta = lock.locked_until - timezone.now()
    return max(0, int(delta.total_seconds()))


def _clear_lock(lock: LoginDeviceLock):
    lock.failed_attempts = 0
    lock.locked_until = None
    lock.save(update_fields=["failed_attempts", "locked_until", "updated_at"])


def is_device_locked(device_id: str, identifier: str | None = None) -> LoginDeviceLock | None:
    """Lock is per device only. `identifier` is accepted for call-site compatibility."""
    del identifier
    lock = get_device_lock(device_id)
    if not lock:
        return None
    now = timezone.now()
    if lock.locked_until and lock.locked_until > now:
        return lock
    if lock.locked_until and lock.locked_until <= now:
        _clear_lock(lock)
        return None
    if lock.failed_attempts and lock.updated_at and (now - lock.updated_at) >= IDLE_RESET:
        _clear_lock(lock)
    return None


def register_failure(device_id: str, identifier: str, user=None) -> LoginDeviceLock:
    device = normalize_device_id(device_id)
    ident = normalize_identifier(identifier)
    now = timezone.now()
    lock = get_device_lock(device)
    if lock is None:
        lock, _ = LoginDeviceLock.objects.get_or_create(
            device_id=device,
            defaults={"identifier": ident or "unknown"},
        )
    if lock.locked_until and lock.locked_until <= now:
        lock.failed_attempts = 0
        lock.locked_until = None
    elif lock.failed_attempts and lock.updated_at and (now - lock.updated_at) >= IDLE_RESET:
        lock.failed_attempts = 0
        lock.locked_until = None
    if ident:
        lock.identifier = ident
    if user and lock.user_id != getattr(user, "id", None):
        lock.user = user
    lock.failed_attempts = (lock.failed_attempts or 0) + 1
    if lock.failed_attempts >= MAX_FAILED_ATTEMPTS:
        lock.locked_until = now + timedelta(minutes=LOCK_MINUTES)
    lock.save()
    return lock


def register_success(device_id: str, identifier: str, user=None):
    del identifier
    LoginDeviceLock.objects.filter(device_id=normalize_device_id(device_id)).update(
        failed_attempts=0,
        locked_until=None,
        user=user,
    )


def lockout_payload(lock: LoginDeviceLock) -> dict:
    seconds = remaining_lock_seconds(lock)
    return {
        "error": (
            f"This device is locked after {MAX_FAILED_ATTEMPTS} failed login attempts. "
            f"Try again in {max(1, seconds // 60)} minute(s). Other devices are not affected."
        ),
        "code": "device_locked",
        "lockedUntil": lock.locked_until.isoformat() if lock.locked_until else None,
        "retryAfterSeconds": seconds,
        "attemptsRemaining": 0,
    }
