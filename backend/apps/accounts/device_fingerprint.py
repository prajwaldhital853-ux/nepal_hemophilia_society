"""Hardware-bound device fingerprint. Same physical machine => same lock across browsers."""

import hashlib
import json
from base64 import b64decode

from apps.accounts.device_lock import MIN_DEVICE_ID_LENGTH, is_valid_device_id, normalize_device_id

WEB_SIGNAL_KEYS = (
    "platform",
    "screenW",
    "screenH",
    "colorDepth",
    "pixelRatio",
    "cores",
    "memory",
    "touch",
    "timezone",
    "locale",
)

MOBILE_SIGNAL_KEYS = (
    "brand",
    "model",
    "osName",
    "osVersion",
    "memory",
    "installId",
)


def _digest(parts: list[str]) -> str:
    raw = "|".join(parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def fingerprint_from_web_signals(signals: dict) -> str:
    if not isinstance(signals, dict):
        return ""
    parts = [str(signals.get(key, "")).strip() for key in WEB_SIGNAL_KEYS]
    if not any(parts):
        return ""
    return _digest(parts)


def fingerprint_from_mobile_signals(signals: dict) -> str:
    if not isinstance(signals, dict):
        return ""
    parts = [str(signals.get(key, "")).strip() for key in MOBILE_SIGNAL_KEYS]
    if not parts[-1]:  # installId required for mobile fingerprint
        return ""
    return _digest(parts)


def fingerprint_from_signals(signals: dict) -> str:
    if not isinstance(signals, dict):
        return ""
    if signals.get("installId") or signals.get("brand") or signals.get("model"):
        mobile = fingerprint_from_mobile_signals(signals)
        if mobile:
            return mobile
    return fingerprint_from_web_signals(signals)


def _signals_from_header(request) -> dict | None:
    raw = (request.headers.get("X-Device-Signals") or "").strip()
    if not raw:
        return None
    try:
        return json.loads(b64decode(raw).decode("utf-8"))
    except Exception:
        return None


def resolve_device_id(request) -> str:
    """Prefer server-computed fingerprint from hardware signals (not spoofable client UUID)."""
    data = getattr(request, "data", None)
    signals = None
    if isinstance(data, dict):
        signals = data.get("deviceSignals")
    if not isinstance(signals, dict):
        signals = _signals_from_header(request)

    if isinstance(signals, dict):
        fingerprint = fingerprint_from_signals(signals)
        if is_valid_device_id(fingerprint):
            return normalize_device_id(fingerprint)

    fallback = ""
    if isinstance(data, dict):
        fallback = str(data.get("deviceId") or "").strip()
    if not fallback:
        fallback = str(request.headers.get("X-Device-Id") or "").strip()
    if is_valid_device_id(fallback):
        return normalize_device_id(fallback)
    return ""
