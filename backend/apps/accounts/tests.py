from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.accounts.rbac import (
    PERM_AUDIT_VIEW,
    PERM_INJECTIONS_ADD,
    PERM_INJECTIONS_CORRECT,
    PERM_PATIENTS_CREATE,
    PERM_PATIENTS_VERIFY,
    PERM_PATIENTS_VIEW,
    PERM_HOSPITAL_STAFF_MANAGE,
    PERM_PROVINCE_ADMINS_MANAGE,
    has_perm,
    permissions_for,
)
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.provinces.models import Province, ProvinceAdmin

User = get_user_model()


class RbacMatrixTests(APITestCase):
    def setUp(self):
        self.province = Province.objects.create(name="Bagmati", code="P3")
        self.hospital = Hospital.objects.create(name="Kathmandu Hemophilia Center", province=self.province)
        self.super = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.province_user = User.objects.create_user(
            username="prov", password="ChangeMe#2026", role=UserRole.PROVINCE_ADMIN
        )
        ProvinceAdmin.objects.create(user=self.province_user, province=self.province, display_id="PADM-00001")
        self.treatment = User.objects.create_user(
            username="tadmin", password="ChangeMe#2026", role=UserRole.HOSPITAL_ADMIN
        )
        HospitalAdmin.objects.create(
            user=self.treatment,
            hospital=self.hospital,
            staff_type=HospitalStaffType.TREATMENT_ADMIN,
            display_id="TADM-00001",
        )
        self.center = User.objects.create_user(
            username="cadmin", password="ChangeMe#2026", role=UserRole.HOSPITAL_ADMIN
        )
        HospitalAdmin.objects.create(
            user=self.center,
            hospital=self.hospital,
            staff_type=HospitalStaffType.CENTER_ADMIN,
            display_id="CADM-00001",
        )
        self.patient = User.objects.create_user(username="pat", password="ChangeMe#2026", role=UserRole.PATIENT)

    def test_super_admin_has_national_controls(self):
        self.assertTrue(has_perm(self.super, PERM_AUDIT_VIEW))
        self.assertTrue(has_perm(self.super, PERM_INJECTIONS_CORRECT))
        self.assertTrue(has_perm(self.super, PERM_PROVINCE_ADMINS_MANAGE))
        self.assertTrue(has_perm(self.super, PERM_INJECTIONS_ADD))

    def test_province_admin_cannot_add_injections_or_see_audit(self):
        self.assertTrue(has_perm(self.province_user, PERM_PATIENTS_VERIFY))
        self.assertTrue(has_perm(self.province_user, PERM_PATIENTS_CREATE))
        self.assertFalse(has_perm(self.province_user, PERM_INJECTIONS_ADD))
        self.assertFalse(has_perm(self.province_user, PERM_AUDIT_VIEW))
        self.assertFalse(has_perm(self.province_user, PERM_PROVINCE_ADMINS_MANAGE))

    def test_treatment_admin_cannot_create_patients_or_manage_staff(self):
        self.assertTrue(has_perm(self.treatment, PERM_INJECTIONS_ADD))
        self.assertFalse(has_perm(self.treatment, PERM_PATIENTS_CREATE))
        self.assertFalse(has_perm(self.treatment, PERM_PATIENTS_VERIFY))
        self.assertFalse(has_perm(self.treatment, PERM_HOSPITAL_STAFF_MANAGE))
        self.assertFalse(has_perm(self.treatment, PERM_AUDIT_VIEW))

    def test_center_admin_can_manage_own_hospital_staff(self):
        self.assertTrue(has_perm(self.center, PERM_HOSPITAL_STAFF_MANAGE))
        self.assertTrue(has_perm(self.center, PERM_INJECTIONS_ADD))
        self.assertFalse(has_perm(self.center, PERM_PATIENTS_CREATE))

    def test_patient_has_no_admin_permissions(self):
        self.assertFalse(has_perm(self.patient, PERM_PATIENTS_VIEW))
        self.assertNotIn(PERM_INJECTIONS_ADD, permissions_for(self.patient))

    def test_me_returns_permissions_and_nav(self):
        self.client.force_authenticate(self.province_user)
        res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["role"], "province_admin")
        self.assertIn(PERM_PATIENTS_VERIFY, res.data["permissions"])
        self.assertNotIn("/dashboard/audit", res.data["nav"])
        self.assertIn("/dashboard/patients", res.data["nav"])
        self.assertEqual(res.data["scope"]["kind"], "province_admin")

    def test_inactive_admin_has_no_permissions(self):
        self.treatment.is_active_account = False
        self.treatment.save()
        self.assertEqual(permissions_for(self.treatment), [])

    def test_admin_login_rejects_patient(self):
        res = self.client.post(
            "/api/v1/auth/login/",
            {"username": "pat", "password": "ChangeMe#2026"},
            format="json",
        )
        self.assertIn(res.status_code, (400, 401))
        self.assertFalse(res.data.get("access"))

    def test_inactive_admin_cannot_login(self):
        self.treatment.is_active_account = False
        self.treatment.save()
        res = self.client.post(
            "/api/v1/auth/login/",
            {"username": "tadmin", "password": "ChangeMe#2026"},
            format="json",
        )
        self.assertIn(res.status_code, (400, 401))
        self.assertFalse(res.data.get("access"))

    def test_province_cannot_view_audit_or_manage_users_nav(self):
        self.client.force_authenticate(self.province_user)
        audit = self.client.get("/api/v1/audit/")
        self.assertEqual(audit.status_code, 403)
        me = self.client.get("/api/v1/auth/me/")
        self.assertNotIn("/dashboard/users", me.data["nav"])
        self.assertNotIn("/dashboard/settings", me.data["nav"])
        self.assertNotIn("/dashboard/admins", me.data["nav"])

    def test_reports_are_role_scoped(self):
        other = Province.objects.create(name="Koshi", code="P1")
        Hospital.objects.create(name="Biratnagar Hemophilia Center", province=other)
        self.client.force_authenticate(self.province_user)
        res = self.client.get("/api/v1/reports/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["scope"], "province_admin")
        self.assertEqual(res.data["totals"]["hospitals"], 1)

    def test_treatment_admin_nav_hides_national_tools(self):
        self.client.force_authenticate(self.treatment)
        res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("/dashboard/injections", res.data["nav"])
        self.assertIn("/dashboard/patients", res.data["nav"])
        self.assertNotIn("/dashboard/audit", res.data["nav"])
        self.assertNotIn("/dashboard/admins", res.data["nav"])
        self.assertNotIn("patients.create", res.data["permissions"])
        self.assertIn("injections.add", res.data["permissions"])
        self.assertNotIn("hospitalStaff.manage", res.data["permissions"])

    def test_center_admin_has_staff_manage_in_me(self):
        self.client.force_authenticate(self.center)
        res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("hospitalStaff.manage", res.data["permissions"])
