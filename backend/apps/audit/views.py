from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import CanViewAudit
from apps.accounts.rbac import is_national_scope
from apps.audit.models import AuditLog
from apps.core.pagination import paginate_queryset
from apps.reports.views import _scoped_audit


class AuditListView(APIView):
    permission_classes = [IsAuthenticated, CanViewAudit]

    def get(self, request):
        search = (request.query_params.get("search") or "").strip()
        module = (request.query_params.get("module") or "").strip()
        date_from = (request.query_params.get("from") or "").strip()
        date_to = (request.query_params.get("to") or "").strip()
        qs = AuditLog.objects.all() if is_national_scope(request.user) else _scoped_audit(request.user)
        if search:
            qs = qs.filter(
                Q(actor__icontains=search)
                | Q(action__icontains=search)
                | Q(module__icontains=search)
                | Q(detail__icontains=search)
                | Q(object_id__icontains=search)
            )
        if module and module != "All":
            qs = qs.filter(module__iexact=module)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "logs": [
                    {
                        "id": row.id,
                        "actor": row.actor,
                        "action": row.action,
                        "module": row.module,
                        "objectId": row.object_id,
                        "detail": row.detail,
                        "ip": row.ip,
                        "createdAt": row.created_at.isoformat() if row.created_at else "",
                    }
                    for row in rows
                ],
                "total": qs.count(),
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )
