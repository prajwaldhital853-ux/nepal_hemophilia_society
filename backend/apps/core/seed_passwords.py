"""Load bootstrap/seed passwords from environment — never hardcode in source."""

from __future__ import annotations

import os

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if value:
        return value
    raise ImproperlyConfigured(
        f"Set {name} in the environment before running seed/bootstrap commands in production."
    )


def super_admin_temp_password() -> str:
    """Break-glass / ensure_super_admin password (env in production)."""
    value = os.getenv("SUPER_ADMIN_TEMP_PASSWORD", "").strip()
    if value:
        return value
    if settings.DEBUG:
        return os.getenv("NHMS_DEV_SUPER_ADMIN_PASSWORD", "local-dev-only").strip() or "local-dev-only"
    return _required_env("SUPER_ADMIN_TEMP_PASSWORD")


def nhms_seed_staff_password() -> str:
    """Initial password for province/center staff created by seed_nhms."""
    if settings.DEBUG:
        return os.getenv("NHMS_SEED_STAFF_PASSWORD", "local-dev-only").strip() or "local-dev-only"
    return _required_env("NHMS_SEED_STAFF_PASSWORD")


def nhms_demo_password() -> str:
    """Shared password for demo seed accounts (seed_demo_data)."""
    if settings.DEBUG:
        return os.getenv("NHMS_DEMO_PASSWORD", "local-demo-only").strip() or "local-demo-only"
    return _required_env("NHMS_DEMO_PASSWORD")
