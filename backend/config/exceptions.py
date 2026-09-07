from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response
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
