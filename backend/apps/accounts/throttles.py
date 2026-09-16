"""Login throttles keyed by client device id, not IP address."""

from rest_framework.throttling import SimpleRateThrottle

from apps.accounts.device_fingerprint import resolve_device_id


class DeviceLoginThrottle(SimpleRateThrottle):
    scope = "login_device"

    def get_cache_key(self, request, view):
        device = resolve_device_id(request)
        if len(device) < 8:
            return None
        return self.cache_format % {"scope": self.scope, "ident": device[:64]}
