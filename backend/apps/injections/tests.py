from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.factors.models import ApplicableType, FactorMedicine, FactorType
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.patients.models import InhibitorStatus, Patient, VerificationStatus
from apps.provinces.models import District, Province, ProvinceAdmin
from apps.treatments.models import HospitalVisit, TreatmentRecord

User = get_user_model()


class ClinicalWorkflowTests(APITestCase):
    def setUp(self):
        self.province = Province.objects.create(name="Bagmati", code="P3")
        self.other_province = Province.objects.create(name="Koshi", code="P1")
        self.district = District.objects.create(province=self.province, name="Kathmandu")
        self.hospital = Hospital.objects.create(name="Kathmandu Hemophilia Center", province=self.province, district=self.district)
        self.other_hospital = Hospital.objects.create(name="Biratnagar Hemophilia Center", province=self.other_province)

        self.super = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.province_admin_user = User.objects.create_user(
            username="prov", password="ChangeMe#2026", role=UserRole.PROVINCE_ADMIN, email="prov@test.com"
        )
        ProvinceAdmin.objects.create(user=self.province_admin_user, province=self.province, display_id="PADM-00001")

        self.treatment_admin = User.objects.create_user(
            username="tadmin", password="ChangeMe#2026", role=UserRole.HOSPITAL_ADMIN, email="tadmin@test.com"
        )
        HospitalAdmin.objects.create(
            user=self.treatment_admin,
            hospital=self.hospital,
            staff_type=HospitalStaffType.TREATMENT_ADMIN,
            display_id="TADM-00099",
        )

        self.factor_a = FactorMedicine.objects.create(
            name="FVIII Test",
            factor_type=FactorType.FVIII,
            applicable_type=ApplicableType.A,
            unit="IU",
        )
        self.factor_b = FactorMedicine.objects.create(
            name="FIX Test",
            factor_type=FactorType.FIX,
            applicable_type=ApplicableType.B,
            unit="IU",
        )

        self.patient_a = self._create_patient("HEM-0009001", "A", InhibitorStatus.NONE)
        self.patient_b = self._create_patient("HEM-0009002", "B", InhibitorStatus.NONE)
        self.patient_inhibitor = self._create_patient("HEM-0009003", "A", InhibitorStatus.CURRENT)

        self.patient_user = User.objects.create_user(
            username=self.patient_a.unique_patient_id,
            password="Patient#2026",
            role=UserRole.PATIENT,
            email="patienta@test.com",
            must_change_password=False,
        )
        self.patient_a.user = self.patient_user
        self.patient_a.save()

    def _create_patient(self, pid, hem_type, inhibitor):
        return Patient.objects.create(
            unique_patient_id=pid,
            full_name="Test Patient",
            date_of_birth="2000-01-01",
            gender="Male",
            mobile="9841111111",
            email=f"{pid.lower()}@test.com",
            province=self.province,
            district=self.district,
            local_level="Metro",
            ward_number=1,
            address="Address",
            blood_group="O+",
            hemophilia_type=hem_type,
            deficient_factor="FVIII" if hem_type == "A" else "FIX",
            severity="Severe",
            baseline_factor_level=Decimal("0.5"),
            inhibitor_status=inhibitor,
            primary_hospital=self.hospital,
            emergency_contact_name="EC",
            emergency_contact_phone="9842222222",
            verification_status=VerificationStatus.ACTIVE,
        )

    def test_hospital_admin_adds_injection_and_visit(self):
        self.client.force_authenticate(self.treatment_admin)
        res = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "2000",
                "indication": "On-demand",
                "bleedSite": "knee",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertIn("injection", res.data)
        self.assertTrue(HospitalVisit.objects.filter(patient=self.patient_a, hospital=self.hospital).exists())

    def test_reject_fix_for_type_a(self):
        self.client.force_authenticate(self.treatment_admin)
        res = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_b.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_reject_zero_dose(self):
        self.client.force_authenticate(self.treatment_admin)
        res = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "0",
                "indication": "On-demand",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_inhibitor_warning_requires_acknowledgement(self):
        self.client.force_authenticate(self.treatment_admin)
        res = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_inhibitor.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data.get("code"), "inhibitor_warning")

        res2 = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_inhibitor.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
                "acknowledgeInhibitorWarning": True,
            },
            format="json",
        )
        self.assertEqual(res2.status_code, 201)
        self.assertTrue(res2.data["injection"]["inhibitorWarning"])

    def test_province_admin_cannot_add_injection(self):
        self.client.force_authenticate(self.province_admin_user)
        res = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_super_admin_adds_treatment_with_hospital(self):
        self.client.force_authenticate(self.super)
        res = self.client.post(
            "/api/v1/treatments/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "treatmentType": "Physiotherapy",
                "description": "Knee rehab session",
                "treatmentDate": "2026-03-01",
                "treatmentCenter": self.hospital.name,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(TreatmentRecord.objects.count(), 1)
        self.assertTrue(HospitalVisit.objects.filter(reason="treatment").exists())

    def test_patient_sees_own_injection_history(self):
        self.client.force_authenticate(self.treatment_admin)
        self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1500",
                "indication": "Prophylaxis",
            },
            format="json",
        )
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/me/patient/injections/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["injections"]), 1)
        self.assertIn("label", res.data["injections"][0])

    def test_patient_history_timeline(self):
        self.client.force_authenticate(self.treatment_admin)
        self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1500",
                "indication": "Prophylaxis",
            },
            format="json",
        )
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/me/patient/history/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data["timeline"]), 1)

    def test_super_admin_corrects_injection(self):
        self.client.force_authenticate(self.treatment_admin)
        create = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1500",
                "indication": "Prophylaxis",
            },
            format="json",
        )
        inj_id = create.data["injection"]["id"]
        self.client.force_authenticate(self.super)
        res = self.client.post(
            f"/api/v1/injections/{inj_id}/correct/",
            {
                "factorMedicineId": self.factor_a.id,
                "dose": "1800",
                "indication": "Prophylaxis",
                "correctionReason": "Dose entry typo",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.client.force_authenticate(self.patient_user)
        visible = self.client.get("/api/v1/me/patient/injections/")
        self.assertEqual(len(visible.data["injections"]), 1)
        self.assertEqual(float(visible.data["injections"][0]["dose"]), 1800)

    def test_pending_patient_rejected(self):
        pending = self._create_patient("HEM-0009010", "A", InhibitorStatus.NONE)
        pending.verification_status = VerificationStatus.PENDING
        pending.save()
        self.client.force_authenticate(self.treatment_admin)
        res = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": pending.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_update_injection_status(self):
        self.client.force_authenticate(self.treatment_admin)
        create = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
                "status": "Pending",
            },
            format="json",
        )
        inj_id = create.data["injection"]["id"]
        res = self.client.patch(f"/api/v1/injections/{inj_id}/", {"status": "Completed"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["injection"]["status"], "Completed")

    def test_admin_patient_history_endpoint(self):
        self.client.force_authenticate(self.treatment_admin)
        self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        self.client.force_authenticate(self.super)
        res = self.client.get(f"/api/v1/patients/{self.patient_a.unique_patient_id}/history/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("timeline", res.data)

    def test_province_can_monitor_but_hospital_cannot_edit_other_center(self):
        self.client.force_authenticate(self.treatment_admin)
        created = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient_a.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        inj_id = created.data["injection"]["id"]
        self.client.force_authenticate(self.province_admin_user)
        listed = self.client.get("/api/v1/injections/")
        self.assertEqual(listed.status_code, 200)
        self.assertGreaterEqual(listed.data["total"], 1)
        other = User.objects.create_user(username="otherhosp", password="ChangeMe#2026", role=UserRole.HOSPITAL_ADMIN)
        HospitalAdmin.objects.create(
            user=other,
            hospital=self.other_hospital,
            staff_type=HospitalStaffType.TREATMENT_ADMIN,
            display_id="TADM-00088",
        )
        self.client.force_authenticate(other)
        patch = self.client.patch(f"/api/v1/injections/{inj_id}/", {"status": "Cancelled"}, format="json")
        self.assertEqual(patch.status_code, 400)
        self.client.force_authenticate(self.province_admin_user)
        audit = self.client.get("/api/v1/audit/")
        self.assertEqual(audit.status_code, 403)
        factor = self.client.post(
            "/api/v1/factors/manage/",
            {"name": "X", "factorType": "FVIII", "applicableType": "A", "unit": "IU"},
            format="json",
        )
        self.assertEqual(factor.status_code, 403)
