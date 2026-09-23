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


def dispatch_push(user_ids, title: str, body: str, data: dict | None = None):
    ids = [uid for uid in user_ids if uid]
    if not ids:
        return

    def _send():
        tokens = list(PushDevice.objects.filter(user_id__in=ids))
        if not tokens:
            return
        expo = [row.token for row in tokens if row.token.startswith("ExponentPushToken")]
        fcm = [row.token for row in tokens if not row.token.startswith("ExponentPushToken")]
        if expo:
            _send_expo(expo, title, body, data or {})
        if fcm:
            _send_fcm(fcm, title, body, data or {})

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


def _send_fcm(tokens: list[str], title: str, body: str, data: dict):
    app = _firebase_app()
    if app is None:
        return
    from firebase_admin import messaging

    payload = {k: str(v) for k, v in data.items()}
    for token in tokens:
        try:
            messaging.send(
                messaging.Message(
                    notification=messaging.Notification(title=title[:120], body=body[:240]),
                    data=payload,
                    token=token,
                ),
                app=app,
            )
        except Exception:
            logger.exception("FCM send failed for a device token")
