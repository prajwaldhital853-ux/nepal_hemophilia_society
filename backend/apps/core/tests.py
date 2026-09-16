from pathlib import Path
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.core.backups import write_encrypted_backup
from apps.provinces.models import Province, ProvinceAdmin

User = get_user_model()


class BackupApiTests(APITestCase):
    def setUp(self):
        self.super = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.province = Province.objects.create(name="Bagmati", code="P3")
        self.prov = User.objects.create_user(username="prov", password="ChangeMe#2026", role=UserRole.PROVINCE_ADMIN)
        ProvinceAdmin.objects.create(user=self.prov, province=self.province, display_id="PADM-00001")

    def test_super_admin_can_create_and_list_encrypted_backup(self):
        with TemporaryDirectory() as tmp:
            with override_settings(BACKUP_ROOT=Path(tmp)):
                self.client.force_authenticate(self.super)
                created = self.client.post("/api/v1/backups/", {"kind": "manual"}, format="json")
                self.assertEqual(created.status_code, 201, created.data)
                name = created.data["backup"]["filename"]
                listed = self.client.get("/api/v1/backups/")
                self.assertEqual(listed.status_code, 200)
                self.assertTrue(any(row["filename"] == name for row in listed.data["backups"]))
                download = self.client.get(f"/api/v1/backups/{name}/download/")
                self.assertEqual(download.status_code, 200)
                chunk = next(iter(download.streaming_content))
                self.assertGreater(len(chunk), 20)
                download.close()

    def test_province_admin_cannot_access_backups(self):
        self.client.force_authenticate(self.prov)
        self.assertEqual(self.client.get("/api/v1/backups/").status_code, 403)
        self.assertEqual(self.client.post("/api/v1/backups/", {"kind": "manual"}, format="json").status_code, 403)

    def test_write_encrypted_backup_creates_file(self):
        with TemporaryDirectory() as tmp:
            with override_settings(BACKUP_ROOT=Path(tmp)):
                meta = write_encrypted_backup("manual", actor=self.super)
                path = Path(tmp) / meta["filename"]
                self.assertTrue(path.is_file())
                self.assertGreater(path.stat().st_size, 20)
