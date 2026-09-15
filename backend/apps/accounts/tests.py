from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.accounts.rbac import (
    PERM_AUDIT_VIEW,
    PERM_DASHBOARD,
    PERM_INJECTIONS_ADD,
    PERM_INJECTIONS_CORRECT,
    PERM_INJECTIONS_VIEW,
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

    def test_stock_permissions_match_plan(self):
        from apps.accounts.rbac import PERM_STOCK_MANAGE, PERM_STOCK_VIEW

        self.assertTrue(has_perm(self.super, PERM_STOCK_VIEW))
        self.assertTrue(has_perm(self.super, PERM_STOCK_MANAGE))
        self.assertTrue(has_perm(self.treatment, PERM_STOCK_VIEW))
        self.assertTrue(has_perm(self.treatment, PERM_STOCK_MANAGE))
        self.assertTrue(has_perm(self.province_user, PERM_STOCK_VIEW))
        self.assertFalse(has_perm(self.province_user, PERM_STOCK_MANAGE))
        self.assertFalse(has_perm(self.patient, PERM_STOCK_VIEW))
        self.assertFalse(has_perm(self.patient, PERM_STOCK_MANAGE))

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

    def test_view_only_strips_write_permissions(self):
        self.center.view_only = True
        self.center.save(update_fields=["view_only"])
        self.assertIn(PERM_INJECTIONS_VIEW, permissions_for(self.center) or [PERM_PATIENTS_VIEW])
        self.assertNotIn(PERM_INJECTIONS_ADD, permissions_for(self.center))
        self.assertNotIn(PERM_HOSPITAL_STAFF_MANAGE, permissions_for(self.center))
        self.assertTrue(has_perm(self.center, PERM_PATIENTS_VIEW))
        self.assertFalse(has_perm(self.center, PERM_INJECTIONS_ADD))

    def test_national_admin_cannot_manage_super(self):
        from apps.accounts.rbac import can_manage_user, assignable_kinds

        admin = User.objects.create_user(username="natadmin", password="ChangeMe#2026", role=UserRole.ADMIN)
        self.assertNotIn("super_admin", assignable_kinds(admin))
        self.assertFalse(can_manage_user(admin, self.super))
        self.assertTrue(can_manage_user(self.super, admin))
        self.assertIn("website.view", permissions_for(admin))
        self.assertNotIn(PERM_INJECTIONS_CORRECT, permissions_for(admin))
        self.assertNotIn("settings.system", permissions_for(admin))

    def test_website_manager_only_sees_website_nav(self):
        wm = User.objects.create_user(username="webmgr", password="ChangeMe#2026", role=UserRole.WEBSITE_MANAGER)
        self.client.force_authenticate(wm)
        res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("/dashboard/website", res.data["nav"])
        self.assertNotIn("/dashboard/patients", res.data["nav"])
        self.assertNotIn("/dashboard/admins", res.data["nav"])
        self.assertNotIn("patients.view", res.data["permissions"])

    def test_province_cannot_create_national_admin(self):
        self.client.force_authenticate(self.province_user)
        res = self.client.post(
            "/api/v1/admins/staff/",
            {
                "kind": "admin",
                "fullName": "Should Fail",
                "email": "fail.admin@hemophilia.org.np",
                "phone": "9841112233",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_super_creates_website_manager_and_view_only_admin(self):
        self.client.force_authenticate(self.super)
        res = self.client.post(
            "/api/v1/admins/staff/",
            {
                "kind": "website_manager",
                "fullName": "Site Editor",
                "email": "web.editor@hemophilia.org.np",
                "phone": "9841223344",
                "dateOfBirth": "1990-01-15",
                "gender": "Female",
                "designation": "Content Manager",
                "employeeId": "NHS-W-01",
                "nationalId": "1234567890",
                "officeAddress": "Kathmandu",
                "temporaryPassword": "TempPass#123",
                "viewOnly": True,
                "permissions": ["website.view", "website.manage"],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data["admin"]["id"].startswith("WADM-"))
        self.assertEqual(res.data["admin"]["status"], "Pending")
        self.assertTrue(res.data["admin"]["mustChangePassword"])
        self.assertTrue(res.data["credentials"]["username"])
        self.assertEqual(res.data["credentials"]["email"], "web.editor@hemophilia.org.np")
        self.assertTrue(res.data["admin"]["viewOnly"])
        self.assertIn("website.view", res.data["admin"]["effectivePermissions"])
        self.assertNotIn("website.manage", res.data["admin"]["effectivePermissions"])

        catalog = self.client.get("/api/v1/admins/catalog/?kind=admin")
        self.assertEqual(catalog.status_code, 200)
        patient_codes = [
            perm["code"]
            for group in catalog.data["permissionGroups"]
            if group["page"] == "patients"
            for perm in group["permissions"]
        ]
        self.assertIn("patients.create", patient_codes)
        self.assertIn("patients.update", patient_codes)
        self.assertIn("patients.delete", patient_codes)

    def test_center_admin_creates_treatment_admin_only(self):
        self.client.force_authenticate(self.center)
        catalog = self.client.get("/api/v1/admins/catalog/")
        self.assertEqual(catalog.status_code, 200)
        kinds = [row["kind"] for row in catalog.data["assignableRoles"]]
        self.assertEqual(kinds, ["treatment_admin"])
        res = self.client.post(
            "/api/v1/admins/staff/",
            {
                "kind": "treatment_admin",
                "fullName": "New Treatment",
                "email": "new.tadmin@hemophilia.org.np",
                "phone": "9841334455",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        blocked = self.client.post(
            "/api/v1/admins/staff/",
            {
                "kind": "province_admin",
                "fullName": "Nope",
                "email": "nope@hemophilia.org.np",
                "phone": "9841445566",
                "province": "Bagmati",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(blocked.status_code, 403)

    def test_extra_permissions_limit_role_catalog(self):
        self.province_user.extra_permissions = [PERM_PATIENTS_VIEW, PERM_DASHBOARD]
        self.province_user.save(update_fields=["extra_permissions"])
        perms = permissions_for(self.province_user)
        self.assertEqual(set(perms), {PERM_PATIENTS_VIEW, PERM_DASHBOARD})
        self.assertFalse(has_perm(self.province_user, PERM_PATIENTS_CREATE))

    def test_login_accepts_email_and_admin_id(self):
        self.province_user.email = "prov.admin@hemophilia.org.np"
        self.province_user.staff_id = "PADM-00001"
        self.province_user.save()
        for ident in ("prov", "prov.admin@hemophilia.org.np", "PADM-00001"):
            res = self.client.post(
                "/api/v1/auth/login/",
                {"username": ident, "password": "ChangeMe#2026"},
                format="json",
            )
            self.assertEqual(res.status_code, 200, ident)
            self.assertTrue(res.data.get("access"), ident)

    def test_created_admin_pending_until_own_password(self):
        self.client.force_authenticate(self.super)
        created = self.client.post(
            "/api/v1/admins/staff/",
            {
                "kind": "admin",
                "fullName": "National Pending",
                "email": "pending.admin@hemophilia.org.np",
                "phone": "9841556677",
                "dateOfBirth": "1988-05-01",
                "gender": "Male",
                "designation": "Coordinator",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data["admin"]["status"], "Pending")
        self.client.force_authenticate(None)
        login = self.client.post(
            "/api/v1/auth/login/",
            {"username": "pending.admin@hemophilia.org.np", "password": "TempPass#123"},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.assertTrue(login.data["mustChangePassword"])
        self.assertEqual(login.data["accountStatus"], "Pending")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        blocked = self.client.get("/api/v1/admins/catalog/")
        self.assertEqual(blocked.status_code, 403)
        changed = self.client.post(
            "/api/v1/auth/change-password/",
            {
                "currentPassword": "TempPass#123",
                "newPassword": "OwnPass#2026",
                "confirmPassword": "OwnPass#2026",
            },
            format="json",
        )
        self.assertEqual(changed.status_code, 200, changed.data)
        self.client.credentials()
        again = self.client.post(
            "/api/v1/auth/login/",
            {"username": created.data["credentials"]["username"], "password": "OwnPass#2026"},
            format="json",
        )
        self.assertEqual(again.status_code, 200, again.data)
        self.assertFalse(again.data["mustChangePassword"])
        self.client.force_authenticate(self.super)
        staff = self.client.get(f"/api/v1/admins/staff/{created.data['admin']['id']}/")
        self.assertEqual(staff.status_code, 200)
        self.assertEqual(staff.data["admin"]["status"], "Active")


class StaffDeleteTests(APITestCase):
    def setUp(self):
        self.province = Province.objects.create(name="Bagmati", code="P3")
        self.hospital = Hospital.objects.create(name="Kathmandu Hemophilia Center", province=self.province)
        self.super = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.super.staff_id = "SADM-00001"
        self.super.save(update_fields=["staff_id"])
        self.national = User.objects.create_user(username="nat", password="ChangeMe#2026", role=UserRole.ADMIN)
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

    def test_super_deletes_managed_admin(self):
        self.client.force_authenticate(self.super)
        detail = self.client.get("/api/v1/admins/staff/TADM-00001/")
        self.assertEqual(detail.status_code, 200)
        self.assertTrue(detail.data["admin"]["canDelete"])
        res = self.client.delete("/api/v1/admins/staff/TADM-00001/")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(User.objects.filter(username="tadmin").exists())

    def test_center_admin_deletes_treatment_admin_at_same_center(self):
        self.client.force_authenticate(self.center)
        detail = self.client.get("/api/v1/admins/staff/TADM-00001/")
        self.assertTrue(detail.data["admin"]["canDelete"])
        res = self.client.delete("/api/v1/admins/staff/TADM-00001/")
        self.assertEqual(res.status_code, 204)

    def test_treatment_admin_cannot_delete_center_admin(self):
        self.client.force_authenticate(self.treatment)
        res = self.client.delete("/api/v1/admins/staff/CADM-00001/")
        self.assertEqual(res.status_code, 403)
        self.assertTrue(User.objects.filter(username="cadmin").exists())

    def test_national_admin_cannot_delete_super_admin(self):
        self.client.force_authenticate(self.national)
        res = self.client.delete(f"/api/v1/admins/staff/{self.super.staff_id or 'SADM-00001'}/")
        self.assertIn(res.status_code, (403, 404))

    def test_admin_cannot_delete_self(self):
        self.client.force_authenticate(self.center)
        res = self.client.delete("/api/v1/admins/staff/CADM-00001/")
        self.assertEqual(res.status_code, 403)

    def test_province_admin_deletes_treatment_admin_in_province(self):
        self.client.force_authenticate(self.province_user)
        res = self.client.delete("/api/v1/admins/staff/TADM-00001/")
        self.assertEqual(res.status_code, 204)

