"""Login throttles keyed by client device id, not IP address."""

from rest_framework.throttling import SimpleRateThrottle


class DeviceLoginThrottle(SimpleRateThrottle):
    scope = "login_device"

    def get_cache_key(self, request, view):
        device = ""
        if hasattr(request, "data"):
            device = str(request.data.get("deviceId") or "").strip()
        if not device:
            device = str(request.headers.get("X-Device-Id") or "").strip()
        if len(device) < 8:
            return None
        return self.cache_format % {"scope": self.scope, "ident": device[:64]}
