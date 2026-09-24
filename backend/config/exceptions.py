import logging
import os

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def _expose_exception_message(exc: Exception) -> str:
    if settings.DEBUG:
        return str(exc)
    if os.getenv("DJANGO_API_DEBUG_ERRORS", "").lower() in ("true", "1", "yes"):
        return str(exc)
    return "An unexpected server error occurred. Please try again or contact support."


def _attach_must_change_password_code(response):
    if response.status_code != status.HTTP_403_FORBIDDEN:
        return
    detail = response.data
    message = ""
    if isinstance(detail, dict):
        message = str(detail.get("error") or detail.get("detail") or "")
    elif isinstance(detail, list) and detail:
        message = str(detail[0])
    if "must set a new password" in message.lower():
        if isinstance(detail, dict):
            response.data = {**detail, "code": "must_change_password"}
        else:
            response.data = {"error": message, "code": "must_change_password"}


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API exception", exc_info=exc)
        return Response({"error": _expose_exception_message(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    detail = response.data
    if isinstance(detail, dict) and "error" in detail:
        _attach_must_change_password_code(response)
        return response
    if isinstance(detail, dict) and "detail" in detail:
        response.data = {"error": str(detail["detail"])}
    elif isinstance(detail, list):
        response.data = {"error": str(detail[0])}
    elif isinstance(detail, dict):
        parts = []
        for key, value in detail.items():
            if isinstance(value, (list, tuple)):
                parts.append(f"{key}: {value[0]}")
            else:
                parts.append(f"{key}: {value}")
        response.data = {"error": "; ".join(parts) if parts else "Request failed"}
    _attach_must_change_password_code(response)
    return response
