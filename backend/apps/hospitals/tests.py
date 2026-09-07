from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.provinces.models import District, Province, ProvinceAdmin

User = get_user_model()


class HospitalStaffApiTests(APITestCase):
    def setUp(self):
        self.province = Province.objects.create(name="Bagmati", code="P3")
        self.hospital = Hospital.objects.create(name="Kathmandu Hemophilia Center", province=self.province)
        self.super = User.objects.create_user(
            username="super",
            password="ChangeMe#2026",
            role=UserRole.SUPER_ADMIN,
        )
        self.province_user = User.objects.create_user(
            username="provadmin",
            password="ChangeMe#2026",
            role=UserRole.PROVINCE_ADMIN,
            email="prov@hemophilia.org.np",
        )
        ProvinceAdmin.objects.create(user=self.province_user, province=self.province, display_id="PADM-00099")

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def test_create_treatment_admin(self):
        self.auth(self.super)
        res = self.client.post(
            "/api/v1/hospitals/staff/treatment-admins/",
            {
                "fullName": "Anjali KC",
                "email": "anjali.kc@hemophilia.org.np",
                "phone": "9844567890",
                "treatmentCenter": self.hospital.name,
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["staff"]["id"].startswith("TADM-"))
        self.assertIn("credentials", res.data)
        profile = HospitalAdmin.objects.get(display_id=res.data["staff"]["id"])
        self.assertEqual(profile.staff_type, HospitalStaffType.TREATMENT_ADMIN)
        self.assertEqual(profile.user.role, UserRole.HOSPITAL_ADMIN)

    def test_list_center_admins_empty(self):
        self.auth(self.super)
        res = self.client.get("/api/v1/hospitals/staff/center-admins/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total"], 0)

    def test_province_admin_scoped_to_province(self):
        other = Province.objects.create(name="Koshi", code="P1")
        Hospital.objects.create(name="Biratnagar Hemophilia Center", province=other)
        self.auth(self.province_user)
        res = self.client.post(
            "/api/v1/hospitals/staff/treatment-admins/",
            {
                "fullName": "Wrong Province",
                "email": "wrong@hemophilia.org.np",
                "treatmentCenter": "Biratnagar Hemophilia Center",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_super_creates_province_admin_and_hospital(self):
        District.objects.create(province=self.province, name="Kathmandu")
        self.auth(self.super)
        admin_res = self.client.post(
            "/api/v1/provinces/admins/",
            {
                "fullName": "Koshi Admin",
                "email": "koshi.admin@hemophilia.org.np",
                "province": "Koshi",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(admin_res.status_code, 400)
        koshi = Province.objects.create(name="Koshi", code="P1")
        admin_res = self.client.post(
            "/api/v1/provinces/admins/",
            {
                "fullName": "Koshi Admin",
                "email": "koshi.admin@hemophilia.org.np",
                "province": "Koshi",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(admin_res.status_code, 201, admin_res.data)
        self.assertTrue(admin_res.data["admin"]["id"].startswith("PADM-"))
        hospital_res = self.client.post(
            "/api/v1/hospitals/",
            {"name": "Bhaktapur Treatment Center", "province": "Bagmati", "district": "Kathmandu"},
            format="json",
        )
        self.assertEqual(hospital_res.status_code, 201)
        self.auth(self.province_user)
        forbidden = self.client.post(
            "/api/v1/provinces/admins/",
            {
                "fullName": "Extra",
                "email": "extra@hemophilia.org.np",
                "province": "Bagmati",
                "temporaryPassword": "TempPass#123",
            },
            format="json",
        )
        self.assertEqual(forbidden.status_code, 403)
        outside = self.client.post(
            "/api/v1/hospitals/",
            {"name": "Biratnagar Extra", "province": "Koshi"},
            format="json",
        )
        self.assertEqual(outside.status_code, 403)
