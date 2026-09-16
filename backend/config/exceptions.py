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


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API exception", exc_info=exc)
        return Response({"error": _expose_exception_message(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    detail = response.data
    if isinstance(detail, dict) and "error" in detail:
        return response
    if isinstance(detail, dict) and "detail" in detail:
        response.data = {"error": str(detail["detail"])}
        return response
    if isinstance(detail, list):
        response.data = {"error": str(detail[0])}
        return response
    if isinstance(detail, dict):
        parts = []
        for key, value in detail.items():
            if isinstance(value, (list, tuple)):
                parts.append(f"{key}: {value[0]}")
            else:
                parts.append(f"{key}: {value}")
        response.data = {"error": "; ".join(parts) if parts else "Request failed"}
    return response
