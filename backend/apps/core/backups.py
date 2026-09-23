"""Encrypted JSON backups of users, admins, and clinical registry data."""

from __future__ import annotations

import hashlib
import json
import os
import zipfile
from datetime import timedelta
from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.dateparse import parse_datetime

User = get_user_model()


def backup_root() -> Path:
    root = Path(getattr(settings, "BACKUP_ROOT", settings.BASE_DIR / "private_backups"))
    root.mkdir(parents=True, exist_ok=True)
    return root


def _fernet():
    from cryptography.fernet import Fernet

    secret = (os.getenv("BACKUP_ENCRYPTION_KEY") or settings.SECRET_KEY).encode()
    digest = hashlib.sha256(secret).digest()
    import base64

    return Fernet(base64.urlsafe_b64encode(digest))


def _json_default(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _dump_qs(qs, fields=None):
    if fields:
        return list(qs.values(*fields))
    return list(qs.values())


def build_payload() -> dict:
    from apps.accounts.models import LoginDeviceLock
    from apps.audit.models import AuditLog
    from apps.factors.models import FactorMedicine
    from apps.hospitals.models import Hospital, HospitalAdmin
    from apps.injections.models import InjectionRecord
    from apps.patients.models import BleedingEpisode, Patient
    from apps.provinces.models import Province, ProvinceAdmin
    from apps.stock.models import FactorStock, StockMovement
    from apps.treatments.models import TreatmentRecord

    cutoff = timezone.now() - timedelta(days=400)
    return {
        "format": "nhms-backup-v1",
        "generatedAt": timezone.now().isoformat(),
        "users": _dump_qs(User.objects.all()),
        "provinces": _dump_qs(Province.objects.all()),
        "provinceAdmins": _dump_qs(ProvinceAdmin.objects.all()),
        "hospitals": _dump_qs(Hospital.objects.all()),
        "hospitalAdmins": _dump_qs(HospitalAdmin.objects.all()),
        "patients": _dump_qs(Patient.objects.all()),
        "factors": _dump_qs(FactorMedicine.objects.all()),
        "injections": _dump_qs(InjectionRecord.objects.filter(created_at__gte=cutoff)),
        "treatments": _dump_qs(TreatmentRecord.objects.filter(created_at__gte=cutoff)),
        "bleeding": _dump_qs(BleedingEpisode.objects.filter(created_at__gte=cutoff)),
        "stock": _dump_qs(FactorStock.objects.all()),
        "stockMovements": _dump_qs(StockMovement.objects.filter(created_at__gte=cutoff)),
        "deviceLocks": _dump_qs(LoginDeviceLock.objects.all()),
        "audit": _dump_qs(AuditLog.objects.filter(created_at__gte=cutoff)[:20000]),
    }


def write_encrypted_backup(kind: str = "auto", actor=None) -> dict:
    from apps.core.backup_excel import build_excel_zip

    payload = build_payload()
    stamp = timezone.localtime().strftime("%Y%m%d-%H%M%S")
    raw = build_excel_zip(payload)
    token = _fernet().encrypt(raw)
    filename = f"nhms-{kind}-{stamp}.zip.enc"
    path = backup_root() / filename
    path.write_bytes(token)
    sha = hashlib.sha256(token).hexdigest()
    meta = {
        "filename": filename,
        "kind": kind,
        "sizeBytes": path.stat().st_size,
        "sha256": sha,
        "createdAt": timezone.now().isoformat(),
        "actor": getattr(actor, "username", "") if actor else "system",
        "recordCounts": {key: len(value) if isinstance(value, list) else 0 for key, value in payload.items()},
    }
    (backup_root() / f"{filename}.meta.json").write_text(json.dumps(meta, indent=2))
    meta["rawZipBytes"] = raw
    return meta


def email_backup_to_super_admins(zip_bytes: bytes, meta: dict) -> int:
    """Email the Excel zip to every active super admin (works without browser login)."""
    from django.conf import settings
    from django.core.mail import EmailMessage

    if not zip_bytes:
        return 0
    from apps.accounts.models import User, UserRole

    recipients = list(
        User.objects.filter(role=UserRole.SUPER_ADMIN, is_active=True, is_active_account=True)
        .exclude(email="")
        .values_list("email", flat=True)
    )
    if not recipients:
        return 0
    if not getattr(settings, "EMAIL_HOST_USER", ""):
        return 0

    zip_name = str(meta.get("filename", "nhms-backup.zip.enc")).replace(".zip.enc", ".zip")
    body = (
        "Nepal Hemophilia Digital Management System — daily encrypted backup archive.\n\n"
        f"File: {zip_name}\n"
        "Extract the zip to open Excel (.xlsx) spreadsheets for patients, admins, stock, and clinical data.\n"
        "Store this file securely on the Super Admin workstation only.\n"
    )
    message = EmailMessage(
        subject=f"NHMS daily backup — {zip_name}",
        body=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER),
        to=recipients,
    )
    message.attach(zip_name, zip_bytes, "application/zip")
    try:
        message.send(fail_silently=False)
        return len(recipients)
    except Exception:
        return 0


def run_daily_backup(actor=None) -> dict | None:
    """Create today's backup on the server and email super admins the Excel zip."""
    rows = list_backups()
    autos = [row for row in rows if row.get("kind") == "auto"]
    if autos:
        created = parse_datetime(str(autos[0].get("createdAt") or ""))
        if created and timezone.localtime(created).date() >= timezone.localdate():
            return None
    meta = write_encrypted_backup("auto", actor=actor)
    raw_zip = meta.pop("rawZipBytes", b"")
    emailed = email_backup_to_super_admins(raw_zip, meta)
    meta["emailedSuperAdmins"] = emailed
    prune_backups()
    return meta


def list_backups() -> list[dict]:
    rows = []
    for meta_path in sorted(backup_root().glob("*.meta.json"), reverse=True):
        try:
            rows.append(json.loads(meta_path.read_text()))
        except Exception:
            continue
    return rows


def decrypt_backup_bytes(filename: str) -> bytes | None:
    path = backup_file_path(filename)
    if not path:
        return None
    return _fernet().decrypt(path.read_bytes())


def backup_file_path(filename: str) -> Path | None:
    name = Path(filename).name
    if not name.endswith(".zip.enc") or ".." in name:
        return None
    path = backup_root() / name
    if path.is_file():
        return path
    return None


def prune_backups(keep: int = 14) -> int:
    rows = list_backups()
    removed = 0
    for meta in rows[keep:]:
        name = meta.get("filename")
        if not name:
            continue
        path = backup_file_path(name)
        if path:
            path.unlink(missing_ok=True)
        meta_path = backup_root() / f"{name}.meta.json"
        meta_path.unlink(missing_ok=True)
        removed += 1
    return removed


def maybe_auto_backup(actor=None) -> dict | None:
    """Fallback when a super admin opens backups — prefer server cron for daily runs."""
    return run_daily_backup(actor=actor)
