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
    payload = build_payload()
    stamp = timezone.localtime().strftime("%Y%m%d-%H%M%S")
    inner_name = f"nhms-{kind}-{stamp}.json"
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(inner_name, json.dumps(payload, default=_json_default))
        archive.writestr(
            "README.txt",
            "NHMS encrypted backup. Keep this file on the Super Admin workstation only.\n",
        )
    raw = zip_buffer.getvalue()
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
    rows = list_backups()
    autos = [row for row in rows if row.get("kind") == "auto"]
    if autos:
        created = parse_datetime(str(autos[0].get("createdAt") or ""))
        if created and timezone.now() - created < timedelta(hours=20):
            return None
    meta = write_encrypted_backup("auto", actor=actor)
    prune_backups()
    return meta
