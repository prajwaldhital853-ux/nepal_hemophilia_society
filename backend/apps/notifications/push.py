"""Deliver out-of-app notifications through Expo Push (Expo Go) and Firebase Cloud Messaging."""

from __future__ import annotations

import json
import logging
import os
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.db import transaction

from apps.notifications.models import PushDevice

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _active_push_tokens(user_ids: list[int]) -> list[str]:
    """Keep one current token per user and app (latest registration wins)."""
    rows = PushDevice.objects.filter(user_id__in=user_ids).order_by("-updated_at", "-id")
    chosen: dict[tuple[int, str], str] = {}
    for row in rows:
        key = (row.user_id, row.app)
        if key in chosen:
            continue
        chosen[key] = row.token
    return list(chosen.values())


def send_push_now(user_ids, title: str, body: str, data: dict | None = None):
    """Send push immediately (call from inside transaction.on_commit)."""
    ids = [uid for uid in user_ids if uid]
    if not ids:
        return
    token_values = _active_push_tokens(ids)
    if not token_values:
        logger.info("No push tokens registered for users %s", ids)
        return
    payload = data or {}
    expo = [token for token in token_values if token.startswith("ExponentPushToken")]
    fcm = [token for token in token_values if not token.startswith("ExponentPushToken")]
    if expo:
        _send_expo(expo, title, body, payload)
    if fcm:
        _send_fcm(fcm, title, body, payload)


def dispatch_push(user_ids, title: str, body: str, data: dict | None = None):
    ids = [uid for uid in user_ids if uid]
    if not ids:
        return
    payload = dict(data or {})

    def _send():
        from apps.core.jobs import run_in_background

        run_in_background(send_push_now, ids, title, body, payload)

    transaction.on_commit(_send)


def _send_expo(tokens: list[str], title: str, body: str, data: dict):
    messages = [
        {
            "to": token,
            "title": title[:120],
            "body": body[:240],
            "sound": "default",
            "data": {k: str(v) for k, v in data.items()},
        }
        for token in tokens
    ]
    payload = json.dumps(messages).encode("utf-8")
    request = Request(
        EXPO_PUSH_URL,
        data=payload,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=12) as response:
            if response.status >= 400:
                logger.warning("Expo push failed: %s", response.status)
    except URLError:
        logger.exception("Expo push request failed")
    except Exception:
        logger.exception("Expo push request failed")


def _firebase_app():
    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError:
        logger.info("firebase-admin is not installed; FCM push skipped")
        return None
    if firebase_admin._apps:
        return firebase_admin.get_app()
    raw = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()
    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if raw:
        cred = credentials.Certificate(json.loads(raw))
    elif path and os.path.exists(path):
        cred = credentials.Certificate(path)
    else:
        return None
    return firebase_admin.initialize_app(cred)


def _admin_link(data: dict) -> str:
    base = os.getenv("ADMIN_PANEL_URL", "https://nepal-hemophilia-society.onrender.com").rstrip("/")
    topic = data.get("relatedType") or data.get("category") or ""
    if topic == "appointment":
        return f"{base}/dashboard/appointments"
    if topic in ("injection", "schedule", "treatment", "bleeding", "bleeding_episode"):
        return f"{base}/dashboard/injections"
    if topic == "stock":
        return f"{base}/dashboard/stock"
    if topic in ("patient", "profile", "document"):
        return f"{base}/dashboard/patients"
    if topic == "admin":
        return f"{base}/dashboard/admins"
    if topic in ("website", "system"):
        return f"{base}/dashboard/website"
    if topic == "backup":
        return f"{base}/dashboard/settings"
    return f"{base}/dashboard"


def _send_fcm(tokens: list[str], title: str, body: str, data: dict):
    app = _firebase_app()
    if app is None:
        return
    from firebase_admin import messaging

    payload = {k: str(v) for k, v in data.items()}
    payload.setdefault("title", title[:120])
    payload.setdefault("body", body[:240])
    devices = {row.token: row for row in PushDevice.objects.filter(token__in=tokens)}
    admin_messages = []
    mobile_messages = []
    link = _admin_link(payload)
    for token in tokens:
        device = devices.get(token)
        is_admin_web = bool(device and device.platform == "web" and device.app == "admin")
        if is_admin_web:
            # Data-only for admin web — our service worker / foreground handler shows one notification.
            admin_messages.append(
                messaging.Message(
                    data=payload,
                    webpush=messaging.WebpushConfig(
                        headers={"Urgency": "high"},
                        fcm_options=messaging.WebpushFCMOptions(link=link),
                    ),
                    token=token,
                )
            )
        else:
            mobile_messages.append(
                messaging.Message(
                    notification=messaging.Notification(title=title[:120], body=body[:240]),
                    data=payload,
                    webpush=messaging.WebpushConfig(
                        headers={"Urgency": "high"},
                        notification=messaging.WebpushNotification(
                            title=title[:120],
                            body=body[:240],
                            icon=f"{link.split('/dashboard')[0]}/nhs-logo.png",
                        ),
                        fcm_options=messaging.WebpushFCMOptions(link=link),
                    ),
                    token=token,
                )
            )
    sender = getattr(messaging, "send_each", None)
    for batch in (admin_messages, mobile_messages):
        if not batch:
            continue
        try:
            if sender:
                sender(batch, app=app)
            else:
                for message in batch:
                    messaging.send(message, app=app)
        except Exception:
            logger.exception("FCM send failed")
