from datetime import timedelta

from django.utils import timezone

from apps.accounts.models import LoginDeviceLock

MAX_FAILED_ATTEMPTS = 3
LOCK_HOURS = 24


def normalize_identifier(value: str) -> str:
    return (value or "").strip().lower()


def get_lock(device_id: str, identifier: str) -> LoginDeviceLock | None:
    return LoginDeviceLock.objects.filter(
        device_id=device_id,
        identifier=normalize_identifier(identifier),
    ).first()


def is_device_locked(device_id: str, identifier: str) -> LoginDeviceLock | None:
    lock = get_lock(device_id, identifier)
    if not lock or not lock.locked_until:
        return None
    if lock.locked_until > timezone.now():
        return lock
    lock.failed_attempts = 0
    lock.locked_until = None
    lock.save(update_fields=["failed_attempts", "locked_until", "updated_at"])
    return None


def register_failure(device_id: str, identifier: str, user=None) -> LoginDeviceLock:
    ident = normalize_identifier(identifier)
    lock, _ = LoginDeviceLock.objects.get_or_create(device_id=device_id, identifier=ident)
    if user and lock.user_id != user.id:
        lock.user = user
    lock.failed_attempts = (lock.failed_attempts or 0) + 1
    if lock.failed_attempts >= MAX_FAILED_ATTEMPTS:
        lock.locked_until = timezone.now() + timedelta(hours=LOCK_HOURS)
    lock.save()
    return lock


def register_success(device_id: str, identifier: str, user=None):
    ident = normalize_identifier(identifier)
    LoginDeviceLock.objects.filter(device_id=device_id, identifier=ident).update(
        failed_attempts=0,
        locked_until=None,
        user=user,
    )
