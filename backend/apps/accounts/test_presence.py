from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.accounts.presence import presence_state

User = get_user_model()


class LoginPresenceTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="superadmin",
            password="ChangeMe#2026",
            role=UserRole.SUPER_ADMIN,
            is_staff=True,
        )

    def _login(self):
        return self.client.post(
            "/api/v1/auth/login/",
            {"username": "superadmin", "password": "ChangeMe#2026", "deviceId": "testdevice-admin-01"},
            format="json",
        )

    def test_admin_login_records_last_login_and_shows_online(self):
        self.assertIsNone(self.admin.last_login)
        res = self._login()
        self.assertEqual(res.status_code, 200, res.data)
        self.admin.refresh_from_db()
        self.assertIsNotNone(self.admin.last_login)
        self.assertIsNotNone(self.admin.last_seen_at)
        self.assertEqual(presence_state(self.admin), "online")

    def test_authenticated_request_refreshes_last_seen(self):
        token = self._login().data["access"]
        stale = timezone.now() - timedelta(hours=3)
        User.objects.filter(pk=self.admin.pk).update(last_seen_at=stale)
        res = self.client.get("/api/v1/auth/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.admin.refresh_from_db()
        self.assertGreater(self.admin.last_seen_at, stale)

    def test_logout_marks_signed_out_and_directory_reports_it(self):
        token = self._login().data["access"]
        res = self.client.post("/api/v1/auth/logout/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 204)
        self.admin.refresh_from_db()
        self.assertEqual(presence_state(self.admin), "signed_out")

        viewer = User.objects.create_user(username="viewer", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.client.force_authenticate(viewer)
        data = self.client.get("/api/v1/users/").data
        tracked = {row["username"]: row for row in data["loginTracking"]}
        self.assertEqual(tracked["superadmin"]["presence"], "signed_out")
        self.assertTrue(tracked["superadmin"]["lastLogin"])
        self.assertIn("online", data["counts"])
        self.assertIn("signedInToday", data["counts"])

    def test_never_logged_in_account_reports_never(self):
        self.assertEqual(presence_state(self.admin), "never")

    def test_directory_pages_in_the_database(self):
        User.objects.create_user(
            username="aaa",
            first_name="Aaa",
            last_name="One",
            password="ChangeMe#2026",
            role=UserRole.ADMIN,
            staff_id="NADM-00901",
        )
        User.objects.create_user(
            username="bbb",
            first_name="Bbb",
            last_name="Two",
            password="ChangeMe#2026",
            role=UserRole.ADMIN,
            staff_id="NADM-00902",
        )
        self.client.force_authenticate(self.admin)
        page1 = self.client.get("/api/v1/users/?kind=admin&limit=1")
        self.assertEqual(page1.status_code, 200, page1.data)
        self.assertEqual(len(page1.data["users"]), 1)
        self.assertEqual(page1.data["counts"]["admins"], 2)
        self.assertEqual(page1.data["total"], 2)
        self.assertTrue(page1.data["nextCursor"])
        page2 = self.client.get(
            "/api/v1/users/",
            {"kind": "admin", "limit": "1", "cursor": page1.data["nextCursor"]},
        )
        self.assertEqual(page2.status_code, 200, page2.data)
        self.assertEqual(len(page2.data["users"]), 1)
        self.assertNotEqual(page1.data["users"][0]["username"], page2.data["users"][0]["username"])
        self.assertIsNone(page2.data["nextCursor"])

    def test_dashboard_uses_scoped_counts_and_a_short_patient_list(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/v1/reports/dashboard/")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertIn("recentPatients", res.data)
        self.assertLessEqual(len(res.data["recentPatients"]), 20)
        self.assertIn("provinceStats", res.data)
        self.assertIn("totals", res.data)
        self.assertIn("patients", res.data["totals"])
