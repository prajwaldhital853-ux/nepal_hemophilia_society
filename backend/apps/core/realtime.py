"""In-memory pub/sub for patient SSE streams (single-server dev/small deploy)."""

from __future__ import annotations

import json
import threading
from queue import Empty, Queue
from typing import Any

_subscribers: dict[str, list[Queue[str]]] = {}
_lock = threading.Lock()


def subscribe(patient_id: str) -> Queue[str]:
    queue: Queue[str] = Queue()
    with _lock:
        _subscribers.setdefault(patient_id, []).append(queue)
    return queue


def unsubscribe(patient_id: str, queue: Queue[str]) -> None:
    with _lock:
        listeners = _subscribers.get(patient_id, [])
        if queue in listeners:
            listeners.remove(queue)
        if not listeners and patient_id in _subscribers:
            del _subscribers[patient_id]


def publish_patient_event(patient_id: str, event_type: str, **payload: Any) -> None:
    if not patient_id:
        return
    message = json.dumps({"type": event_type, **payload})
    with _lock:
        listeners = list(_subscribers.get(patient_id, []))
    for queue in listeners:
        try:
            queue.put_nowait(message)
        except Exception:
            pass
