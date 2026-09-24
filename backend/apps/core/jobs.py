"""Run network work off the request thread without a separate job queue."""

import logging
import threading

from django.db import close_old_connections

logger = logging.getLogger(__name__)


def run_in_background(fn, *args, **kwargs):
    """Start fn on a daemon thread. Database connections are closed when it finishes."""

    def _target():
        close_old_connections()
        try:
            fn(*args, **kwargs)
        except Exception:
            logger.exception("Background task failed: %s", getattr(fn, "__name__", fn))
        finally:
            close_old_connections()

    threading.Thread(target=_target, name="nhms-bg", daemon=True).start()


def run_with_timeout(fn, timeout=8):
    """Run fn in the background, but surface a fast failure to the caller.

    If the work is still going when the timeout ends, the caller continues and
    the thread keeps running. That keeps a hung mail or push server from holding
    the web worker.
    """
    box: dict = {}

    def _target():
        close_old_connections()
        try:
            fn()
        except Exception as exc:
            box["error"] = exc
        finally:
            close_old_connections()

    thread = threading.Thread(target=_target, name="nhms-bg", daemon=True)
    thread.start()
    thread.join(timeout)
    if "error" in box:
        raise box["error"]
