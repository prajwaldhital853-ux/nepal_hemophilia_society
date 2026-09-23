from io import BytesIO

from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsSuperAdmin
from apps.audit.models import AuditLog
from apps.core.backups import decrypt_backup_bytes, list_backups, maybe_auto_backup, prune_backups, write_encrypted_backup
from apps.patients.views import client_ip


class BackupListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        auto = maybe_auto_backup(actor=request.user)
        if auto:
            auto.pop("rawZipBytes", None)
            from apps.notifications.services import notify_backup

            notify_backup("saved", auto.get("filename") or "backup", actor=request.user)
        rows = list_backups()
        return Response({"backups": rows, "autoCreated": bool(auto), "latest": rows[0] if rows else None})

    def post(self, request):
        kind = str(request.data.get("kind") or "manual").strip()
        if kind not in ("manual", "auto"):
            kind = "manual"
        meta = write_encrypted_backup(kind, actor=request.user)
        meta.pop("rawZipBytes", None)
        prune_backups()
        from apps.notifications.services import notify_backup

        notify_backup("saved", meta["filename"], actor=request.user)
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Created data backup",
            module="Backups",
            object_id=meta["filename"],
            ip=client_ip(request),
            detail=f"{kind} backup {meta['sizeBytes']} bytes",
        )
        return Response({"backup": meta}, status=201)


class BackupDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, filename):
        raw = decrypt_backup_bytes(filename)
        if not raw:
            return Response({"error": "Backup file not found."}, status=404)
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Downloaded data backup",
            module="Backups",
            object_id=filename,
            ip=client_ip(request),
            detail="Decrypted zip downloaded to Super Admin device only",
        )
        from apps.notifications.services import notify_backup

        notify_backup("downloaded", filename, actor=request.user)
        zip_name = filename.replace(".zip.enc", ".zip")
        return FileResponse(
            BytesIO(raw),
            as_attachment=True,
            filename=zip_name,
            content_type="application/zip",
        )
