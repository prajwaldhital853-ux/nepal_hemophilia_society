from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import CanViewAudit
from apps.audit.models import AuditLog


class AuditListView(APIView):
    permission_classes = [IsAuthenticated, CanViewAudit]

    def get(self, request):
        qs = AuditLog.objects.all()[:200]
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
                    for row in qs
                ]
            }
        )
