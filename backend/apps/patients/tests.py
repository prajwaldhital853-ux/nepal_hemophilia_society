from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.patients.models import Patient, VerificationStatus
from apps.provinces.models import District, Province, ProvinceAdmin

User = get_user_model()


class PatientAdminApiTests(APITestCase):
    def setUp(self):
        province = Province.objects.create(name="Bagmati", code="P3")
        district = District.objects.create(province=province, name="Kathmandu")
        Hospital.objects.create(name="Kathmandu Hemophilia Center", province=province, district=district)
        self.admin = User.objects.create_user(
            username="superadmin",
            password="ChangeMe#2026",
            role=UserRole.SUPER_ADMIN,
            is_staff=True,
        )
        self.patient_user = User.objects.create_user(
            username="patient1",
            password="Patient#2026",
            role=UserRole.PATIENT,
        )
        self.payload = {
            "fullName": "Test Patient",
            "dateOfBirth": "2001-03-12",
            "gender": "Male",
            "mobile": "9841234567",
            "email": "test.patient@example.com",
            "temporaryPassword": "TempPass#2026",
            "province": "Bagmati",
            "district": "Kathmandu",
            "localLevel": "Kathmandu Metro",
            "wardNumber": "5",
            "address": "Baneshwor",
            "bloodGroup": "O+",
            "hemophiliaType": "A",
            "severity": "Severe",
            "baselineFactorLevel": "0.5",
            "inhibitorStatus": "None",
            "diagnosisDate": "2010-01-01",
            "primaryHospital": "Kathmandu Hemophilia Center",
            "emergencyContactName": "Parent",
            "emergencyContactPhone": "9851234567",
            "emergencyContactRelation": "Father",
            "notes": "",
            "status": "Active",
        }

    def test_patient_cannot_create_record(self):
        self.client.force_authenticate(self.patient_user)
        res = self.client.post("/api/v1/patients/", self.payload, format="json")
        self.assertEqual(res.status_code, 403)

    def test_admin_creates_patient_with_email_and_temp_password(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post("/api/v1/patients/", self.payload, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data["patient"]["id"].startswith("HEM-"))
        self.assertEqual(res.data["patient"]["email"], "test.patient@example.com")
        self.assertTrue(res.data["patient"]["mustChangePassword"])
        self.assertEqual(res.data["credentials"]["temporaryPassword"], "TempPass#2026")
        user = User.objects.get(username=res.data["patient"]["id"])
        self.assertEqual(user.role, UserRole.PATIENT)
        self.assertTrue(user.must_change_password)
        self.assertTrue(user.check_password("TempPass#2026"))

    def test_email_is_required(self):
        self.client.force_authenticate(self.admin)
        payload = {**self.payload, "email": ""}
        res = self.client.post("/api/v1/patients/", payload, format="json")
        self.assertEqual(res.status_code, 400)

    def test_admin_creates_patient_with_multiple_uploaded_documents(self):
        self.client.force_authenticate(self.admin)
        payload = {**self.payload, "email": "docs.patient@example.com"}
        doc1 = SimpleUploadedFile("lab-report.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        doc2 = SimpleUploadedFile("xray.jpg", b"fake-jpeg-bytes", content_type="image/jpeg")
        res = self.client.post(
            "/api/v1/patients/",
            {**payload, "documents": [doc1, doc2]},
            format="multipart",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(len(res.data["patient"]["documents"]), 2)
        names = {item["name"] for item in res.data["patient"]["documents"]}
        self.assertEqual(names, {"lab-report.pdf", "xray.jpg"})

    def test_register_endpoint_is_absent(self):
        res = self.client.post("/api/v1/auth/register/", {"username": "x"}, format="json")
        self.assertEqual(res.status_code, 404)

    def test_admin_login_returns_jwt(self):
        res = self.client.post(
            "/api/v1/auth/login/",
            {"username": "superadmin", "password": "ChangeMe#2026"},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["role"], "super_admin")

    def test_patient_cannot_use_admin_login(self):
        self.client.force_authenticate(self.admin)
        created = self.client.post("/api/v1/patients/", self.payload, format="json")
        self.client.force_authenticate(user=None)
        res = self.client.post(
            "/api/v1/auth/login/",
            {"username": created.data["patient"]["id"], "password": "TempPass#2026"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)


class PatientAppAuthTests(APITestCase):
    def setUp(self):
        province = Province.objects.create(name="Bagmati", code="P3")
        district = District.objects.create(province=province, name="Kathmandu")
        Hospital.objects.create(name="Kathmandu Hemophilia Center", province=province, district=district)
        admin = User.objects.create_user(
            username="superadmin",
            password="ChangeMe#2026",
            role=UserRole.SUPER_ADMIN,
            is_staff=True,
        )
        self.client.force_authenticate(admin)
        payload = {
            "fullName": "App Patient",
            "dateOfBirth": "2001-03-12",
            "gender": "Male",
            "mobile": "9841234567",
            "email": "app.patient@example.com",
            "temporaryPassword": "TempPass#2026",
            "province": "Bagmati",
            "district": "Kathmandu",
            "localLevel": "Kathmandu Metro",
            "wardNumber": "5",
            "address": "Baneshwor",
            "bloodGroup": "O+",
            "hemophiliaType": "A",
            "severity": "Severe",
            "baselineFactorLevel": "0.5",
            "primaryHospital": "Kathmandu Hemophilia Center",
            "emergencyContactName": "Parent",
            "emergencyContactPhone": "9851234567",
        }
        created = self.client.post("/api/v1/patients/", payload, format="json")
        self.patient_id = created.data["patient"]["id"]
        self.client.force_authenticate(user=None)
        self.device_a = "device-aaaa-1111"
        self.device_b = "device-bbbb-2222"

    def test_first_login_requires_password_change_and_scopes_record(self):
        login = self.client.post(
            "/api/v1/auth/patient/login/",
            {
                "identifier": "app.patient@example.com",
                "password": "TempPass#2026",
                "deviceId": self.device_a,
            },
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.assertTrue(login.data["mustChangePassword"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        blocked = self.client.get("/api/v1/me/patient/")
        self.assertEqual(blocked.status_code, 403)
        changed = self.client.post(
            "/api/v1/auth/patient/change-password/",
            {
                "currentPassword": "TempPass#2026",
                "newPassword": "NewPass#2026",
                "confirmPassword": "NewPass#2026",
            },
            format="json",
        )
        self.assertEqual(changed.status_code, 200, changed.data)
        self.assertFalse(changed.data["mustChangePassword"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {changed.data['access']}")
        me = self.client.get("/api/v1/me/patient/")
        self.assertEqual(me.status_code, 200, me.data)
        self.assertEqual(me.data["patient"]["id"], self.patient_id)
        self.assertEqual(me.data["patient"]["email"], "app.patient@example.com")
        stale = self.client.post(
            "/api/v1/auth/patient/login/",
            {
                "identifier": self.patient_id,
                "password": "TempPass#2026",
                "deviceId": self.device_a,
            },
            format="json",
        )
        self.assertEqual(stale.status_code, 401)
        fresh = self.client.post(
            "/api/v1/auth/patient/login/",
            {
                "identifier": self.patient_id,
                "password": "NewPass#2026",
                "deviceId": self.device_a,
            },
            format="json",
        )
        self.assertEqual(fresh.status_code, 200, fresh.data)

    def test_device_lock_is_scoped_to_one_device(self):
        for _ in range(3):
            res = self.client.post(
                "/api/v1/auth/patient/login/",
                {
                    "identifier": "app.patient@example.com",
                    "password": "WrongPass#1",
                    "deviceId": self.device_a,
                },
                format="json",
            )
        self.assertEqual(res.status_code, 423)
        other = self.client.post(
            "/api/v1/auth/patient/login/",
            {
                "identifier": "app.patient@example.com",
                "password": "TempPass#2026",
                "deviceId": self.device_b,
            },
            format="json",
        )
        self.assertEqual(other.status_code, 200, other.data)
        locked = self.client.post(
            "/api/v1/auth/patient/login/",
            {
                "identifier": "app.patient@example.com",
                "password": "TempPass#2026",
                "deviceId": self.device_a,
            },
            format="json",
        )
        self.assertEqual(locked.status_code, 423)

    def test_admin_update_is_visible_on_patient_me(self):
        login = self.client.post(
            "/api/v1/auth/patient/login/",
            {
                "identifier": "app.patient@example.com",
                "password": "TempPass#2026",
                "deviceId": self.device_b,
            },
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        self.client.post(
            "/api/v1/auth/patient/change-password/",
            {
                "currentPassword": "TempPass#2026",
                "newPassword": "NewPass#2026",
                "confirmPassword": "NewPass#2026",
            },
            format="json",
        )
        patient_token = self.client.post(
            "/api/v1/auth/patient/login/",
            {
                "identifier": "app.patient@example.com",
                "password": "NewPass#2026",
                "deviceId": self.device_b,
            },
            format="json",
        ).data["access"]
        admin = User.objects.get(username="superadmin")
        self.client.force_authenticate(admin)
        patient = Patient.objects.get(unique_patient_id=self.patient_id)
        self.client.put(
            f"/api/v1/patients/{self.patient_id}/",
            {
                "fullName": "Updated Patient",
                "dateOfBirth": "2001-03-12",
                "gender": "Male",
                "mobile": "9841234567",
                "email": "app.patient@example.com",
                "province": "Bagmati",
                "district": "Kathmandu",
                "localLevel": "Kathmandu Metro",
                "wardNumber": "5",
                "address": "Baneshwor updated",
                "bloodGroup": "O+",
                "hemophiliaType": "A",
                "severity": "Severe",
                "baselineFactorLevel": "0.5",
                "primaryHospital": "Kathmandu Hemophilia Center",
                "emergencyContactName": "Parent",
                "emergencyContactPhone": "9851234567",
            },
            format="json",
        )
        self.client.force_authenticate(user=None)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {patient_token}")
        me = self.client.get("/api/v1/me/patient/")
        self.assertEqual(me.data["patient"]["fullName"], "Updated Patient")
        self.assertEqual(me.data["patient"]["address"], "Baneshwor updated")
        self.assertNotEqual(patient.pk, None)


class PatientRbacScopeTests(APITestCase):
    def setUp(self):
        self.bagmati = Province.objects.create(name="Bagmati", code="P3")
        self.koshi = Province.objects.create(name="Koshi", code="P1")
        self.ktm = District.objects.create(province=self.bagmati, name="Kathmandu")
        self.morang = District.objects.create(province=self.koshi, name="Morang")
        self.h_ktm = Hospital.objects.create(name="Kathmandu Hemophilia Center", province=self.bagmati, district=self.ktm)
        self.h_brt = Hospital.objects.create(name="Biratnagar Hemophilia Center", province=self.koshi, district=self.morang)
        self.super = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.prov = User.objects.create_user(username="bagmati.admin", password="ChangeMe#2026", role=UserRole.PROVINCE_ADMIN)
        ProvinceAdmin.objects.create(user=self.prov, province=self.bagmati, display_id="PADM-00001")
        self.tadmin = User.objects.create_user(username="tadmin", password="ChangeMe#2026", role=UserRole.HOSPITAL_ADMIN)
        HospitalAdmin.objects.create(
            user=self.tadmin,
            hospital=self.h_ktm,
            staff_type=HospitalStaffType.TREATMENT_ADMIN,
            display_id="TADM-00001",
        )
        self.payload = {
            "fullName": "Scoped Patient",
            "dateOfBirth": "2001-03-12",
            "gender": "Male",
            "mobile": "9841234567",
            "email": "scoped.patient@example.com",
            "temporaryPassword": "TempPass#2026",
            "province": "Bagmati",
            "district": "Kathmandu",
            "localLevel": "Kathmandu Metro",
            "wardNumber": "5",
            "address": "Baneshwor",
            "bloodGroup": "O+",
            "hemophiliaType": "A",
            "severity": "Severe",
            "baselineFactorLevel": "0.5",
            "primaryHospital": "Kathmandu Hemophilia Center",
            "emergencyContactName": "Parent",
            "emergencyContactPhone": "9851234567",
            "status": "Pending",
        }

    def test_hospital_admin_cannot_create_or_verify_patient(self):
        self.client.force_authenticate(self.tadmin)
        create = self.client.post("/api/v1/patients/", self.payload, format="json")
        self.assertEqual(create.status_code, 403)
        self.client.force_authenticate(self.super)
        created = self.client.post("/api/v1/patients/", self.payload, format="json")
        pid = created.data["patient"]["id"]
        self.client.force_authenticate(self.tadmin)
        verify = self.client.put(f"/api/v1/patients/{pid}/verify/", {}, format="json")
        self.assertEqual(verify.status_code, 403)

    def test_province_admin_cannot_create_outside_province(self):
        self.client.force_authenticate(self.prov)
        payload = {**self.payload, "province": "Koshi", "district": "Morang", "primaryHospital": "Biratnagar Hemophilia Center"}
        res = self.client.post("/api/v1/patients/", payload, format="json")
        self.assertEqual(res.status_code, 403)

    def test_province_admin_sees_only_own_province_and_can_verify(self):
        self.client.force_authenticate(self.super)
        bagmati = self.client.post("/api/v1/patients/", self.payload, format="json")
        koshi = self.client.post(
            "/api/v1/patients/",
            {
                **self.payload,
                "email": "koshi.patient@example.com",
                "province": "Koshi",
                "district": "Morang",
                "primaryHospital": "Biratnagar Hemophilia Center",
            },
            format="json",
        )
        self.client.force_authenticate(self.prov)
        listed = self.client.get("/api/v1/patients/")
        ids = {row["id"] for row in listed.data["patients"]}
        self.assertIn(bagmati.data["patient"]["id"], ids)
        self.assertNotIn(koshi.data["patient"]["id"], ids)
        verify = self.client.put(f"/api/v1/patients/{bagmati.data['patient']['id']}/verify/", {}, format="json")
        self.assertEqual(verify.status_code, 200)
        self.assertEqual(verify.data["patient"]["status"], "Active")

    def test_hospital_admin_lists_own_center_and_can_search_hem_id(self):
        self.client.force_authenticate(self.super)
        own = self.client.post("/api/v1/patients/", self.payload, format="json")
        other = self.client.post(
            "/api/v1/patients/",
            {
                **self.payload,
                "email": "other.center@example.com",
                "province": "Koshi",
                "district": "Morang",
                "primaryHospital": "Biratnagar Hemophilia Center",
            },
            format="json",
        )
        self.client.force_authenticate(self.tadmin)
        listed = self.client.get("/api/v1/patients/")
        ids = {row["id"] for row in listed.data["patients"]}
        self.assertIn(own.data["patient"]["id"], ids)
        self.assertNotIn(other.data["patient"]["id"], ids)
        searched = self.client.get(f"/api/v1/patients/?search={other.data['patient']['id']}")
        self.assertEqual(len(searched.data["patients"]), 1)
        detail = self.client.get(f"/api/v1/patients/{other.data['patient']['id']}/")
        self.assertEqual(detail.status_code, 200)
        update = self.client.put(f"/api/v1/patients/{own.data['patient']['id']}/", self.payload, format="json")
        self.assertEqual(update.status_code, 403)
