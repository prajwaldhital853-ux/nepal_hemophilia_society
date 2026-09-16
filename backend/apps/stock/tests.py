from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.accounts.rbac import PERM_STOCK_MANAGE, PERM_STOCK_VIEW, has_perm
from apps.factors.models import ApplicableType, FactorMedicine, FactorType
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.patients.models import InhibitorStatus, Patient, VerificationStatus
from apps.provinces.models import District, Province, ProvinceAdmin
from apps.stock.models import FactorStock

User = get_user_model()


class StockAndDocumentPermissionTests(APITestCase):
    def setUp(self):
        self.province = Province.objects.create(name="Bagmati", code="P3")
        self.other_province = Province.objects.create(name="Koshi", code="P1")
        self.district = District.objects.create(province=self.province, name="Kathmandu")
        self.hospital = Hospital.objects.create(
            name="Kathmandu Hemophilia Center", province=self.province, district=self.district
        )
        self.other_hospital = Hospital.objects.create(
            name="Biratnagar Hemophilia Center", province=self.other_province
        )
        self.super = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.province_admin_user = User.objects.create_user(
            username="prov", password="ChangeMe#2026", role=UserRole.PROVINCE_ADMIN, email="prov@test.com"
        )
        ProvinceAdmin.objects.create(user=self.province_admin_user, province=self.province, display_id="PADM-00011")
        self.treatment_admin = User.objects.create_user(
            username="tadmin", password="ChangeMe#2026", role=UserRole.HOSPITAL_ADMIN, email="tadmin@test.com"
        )
        HospitalAdmin.objects.create(
            user=self.treatment_admin,
            hospital=self.hospital,
            staff_type=HospitalStaffType.TREATMENT_ADMIN,
            display_id="TADM-00111",
        )
        self.other_admin = User.objects.create_user(
            username="otherhosp", password="ChangeMe#2026", role=UserRole.HOSPITAL_ADMIN
        )
        HospitalAdmin.objects.create(
            user=self.other_admin,
            hospital=self.other_hospital,
            staff_type=HospitalStaffType.TREATMENT_ADMIN,
            display_id="TADM-00112",
        )
        self.factor_a = FactorMedicine.objects.create(
            name="FVIII Stock",
            factor_type=FactorType.FVIII,
            applicable_type=ApplicableType.A,
            unit="IU",
        )
        self.patient = Patient.objects.create(
            unique_patient_id="HEM-0009101",
            full_name="Stock Patient",
            date_of_birth="2000-01-01",
            gender="Male",
            mobile="9841111199",
            email="stock.patient@test.com",
            province=self.province,
            district=self.district,
            local_level="Metro",
            ward_number=1,
            address="Address",
            blood_group="O+",
            hemophilia_type="A",
            deficient_factor="FVIII",
            severity="Severe",
            baseline_factor_level=Decimal("0.5"),
            inhibitor_status=InhibitorStatus.NONE,
            primary_hospital=self.hospital,
            emergency_contact_name="EC",
            emergency_contact_phone="9842222299",
            verification_status=VerificationStatus.ACTIVE,
        )
        self.patient_user = User.objects.create_user(
            username=self.patient.unique_patient_id,
            password="Patient#2026",
            role=UserRole.PATIENT,
            email="stock.patient@test.com",
            must_change_password=False,
        )
        self.patient.user = self.patient_user
        self.patient.save()

    def _stock_in(self, user, quantity="5000", hospital_name=None):
        self.client.force_authenticate(user)
        payload = {
            "factorMedicineId": self.factor_a.id,
            "quantity": quantity,
            "batchNumber": "LOT-100",
            "reason": "Shipment received",
        }
        if hospital_name:
            payload["hospitalName"] = hospital_name
        return self.client.post("/api/v1/stock/", payload, format="json")

    def test_rbac_stock_permissions(self):
        self.assertTrue(has_perm(self.super, PERM_STOCK_VIEW))
        self.assertTrue(has_perm(self.super, PERM_STOCK_MANAGE))
        self.assertTrue(has_perm(self.treatment_admin, PERM_STOCK_VIEW))
        self.assertTrue(has_perm(self.treatment_admin, PERM_STOCK_MANAGE))
        self.assertTrue(has_perm(self.province_admin_user, PERM_STOCK_VIEW))
        self.assertTrue(has_perm(self.province_admin_user, PERM_STOCK_MANAGE))
        self.assertFalse(has_perm(self.patient_user, PERM_STOCK_VIEW))
        self.assertFalse(has_perm(self.patient_user, PERM_STOCK_MANAGE))

    def test_super_admin_stock_in_uses_named_hospital(self):
        res = self._stock_in(self.super, hospital_name=self.hospital.name)
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Decimal(res.data["stock"]["quantity"]), Decimal("5000"))

    def test_hospital_admin_stocks_own_center_only(self):
        res = self._stock_in(self.treatment_admin)
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["stock"]["hospitalName"], self.hospital.name)
        other = self._stock_in(self.other_admin)
        self.assertEqual(other.status_code, 201)
        self.assertEqual(other.data["stock"]["hospitalName"], self.other_hospital.name)
        self.client.force_authenticate(self.treatment_admin)
        listed = self.client.get("/api/v1/stock/")
        names = {row["hospitalName"] for row in listed.data["stock"]}
        self.assertEqual(names, {self.hospital.name})

    def test_province_admin_can_stock_in_own_province(self):
        res = self._stock_in(self.province_admin_user, hospital_name=self.hospital.name)
        self.assertEqual(res.status_code, 201, res.data)
        self.client.force_authenticate(self.province_admin_user)
        viewed = self.client.get("/api/v1/stock/")
        self.assertEqual(viewed.status_code, 200)
        self.assertGreaterEqual(viewed.data["total"], 1)
        blocked = self._stock_in(self.province_admin_user, hospital_name=self.other_hospital.name)
        self.assertIn(blocked.status_code, (400, 403))

    def test_patient_cannot_list_or_manage_admin_stock(self):
        self._stock_in(self.treatment_admin)
        self.client.force_authenticate(self.patient_user)
        listed = self.client.get("/api/v1/stock/")
        self.assertIn(listed.status_code, (403, 401))
        created = self.client.post(
            "/api/v1/stock/",
            {"factorMedicineId": self.factor_a.id, "quantity": "10", "reason": "hack"},
            format="json",
        )
        self.assertEqual(created.status_code, 403)

    def test_patient_can_see_own_center_stock(self):
        self._stock_in(self.treatment_admin)
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/me/patient/stock/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["hospitalName"], self.hospital.name)
        self.assertGreater(Decimal(str(res.data["totalQuantity"])), 0)

    def test_stock_out_requires_reason_and_decrements(self):
        created = self._stock_in(self.treatment_admin, "1000")
        lot_id = created.data["stock"]["id"]
        out = self.client.post(
            f"/api/v1/stock/{lot_id}/out/",
            {"quantity": "200", "reason": "Expired vial discarded"},
            format="json",
        )
        self.assertEqual(out.status_code, 200, out.data)
        self.assertEqual(Decimal(out.data["stock"]["quantity"]), Decimal("800"))
        missing_reason = self.client.post(
            f"/api/v1/stock/{lot_id}/out/",
            {"quantity": "10"},
            format="json",
        )
        self.assertEqual(missing_reason.status_code, 400)

    def test_cannot_stock_out_more_than_on_hand(self):
        created = self._stock_in(self.treatment_admin, "50")
        lot_id = created.data["stock"]["id"]
        out = self.client.post(
            f"/api/v1/stock/{lot_id}/out/",
            {"quantity": "80", "reason": "Count error"},
            format="json",
        )
        self.assertEqual(out.status_code, 400)

    def test_other_hospital_cannot_adjust_this_center_stock(self):
        created = self._stock_in(self.treatment_admin, "500")
        lot_id = created.data["stock"]["id"]
        self.client.force_authenticate(self.other_admin)
        patched = self.client.patch(
            f"/api/v1/stock/{lot_id}/",
            {"quantity": "1", "reason": "tamper"},
            format="json",
        )
        self.assertIn(patched.status_code, (403, 404))

    def test_injection_auto_decrements_stock_and_writes_history(self):
        self._stock_in(self.treatment_admin, "3000")
        inj = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        self.assertEqual(inj.status_code, 201, inj.data)
        lot = FactorStock.objects.get(hospital=self.hospital, factor_medicine=self.factor_a)
        self.assertEqual(lot.quantity, Decimal("2000"))
        self.client.force_authenticate(self.super)
        history = self.client.get("/api/v1/stock/movements/?type=injection")
        self.assertEqual(history.status_code, 200)
        row = history.data["movements"][0]
        self.assertEqual(row["patientId"], self.patient.unique_patient_id)
        self.assertEqual(row["hospitalName"], self.hospital.name)
        self.assertEqual(row["recordedBy"]["username"], self.treatment_admin.username)

    def test_completed_injection_rejected_without_stock(self):
        self.client.force_authenticate(self.treatment_admin)
        inj = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "1000",
                "indication": "On-demand",
            },
            format="json",
        )
        self.assertEqual(inj.status_code, 400)
        self.assertEqual(FactorStock.objects.count(), 0)

    def test_pending_injection_does_not_decrement_until_completed(self):
        self._stock_in(self.treatment_admin, "1000")
        inj = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "400",
                "indication": "On-demand",
                "status": "Pending",
            },
            format="json",
        )
        self.assertEqual(inj.status_code, 201, inj.data)
        lot = FactorStock.objects.get()
        self.assertEqual(lot.quantity, Decimal("1000"))
        patched = self.client.patch(
            f"/api/v1/injections/{inj.data['injection']['id']}/",
            {"status": "Completed"},
            format="json",
        )
        self.assertEqual(patched.status_code, 200, patched.data)
        lot.refresh_from_db()
        self.assertEqual(lot.quantity, Decimal("600"))

    def test_cancel_completed_injection_restocks(self):
        self._stock_in(self.treatment_admin, "1000")
        inj = self.client.post(
            "/api/v1/injections/",
            {
                "patientId": self.patient.unique_patient_id,
                "factorMedicineId": self.factor_a.id,
                "dose": "250",
                "indication": "Prophylaxis",
            },
            format="json",
        )
        inj_id = inj.data["injection"]["id"]
        self.client.patch(f"/api/v1/injections/{inj_id}/", {"status": "Cancelled"}, format="json")
        lot = FactorStock.objects.get()
        self.assertEqual(lot.quantity, Decimal("1000"))

    def test_hospital_cannot_delete_lot_with_quantity(self):
        created = self._stock_in(self.treatment_admin, "100")
        lot_id = created.data["stock"]["id"]
        deleted = self.client.delete(f"/api/v1/stock/{lot_id}/")
        self.assertEqual(deleted.status_code, 403)

    def test_add_document_without_editing_patient(self):
        pdf = SimpleUploadedFile("factor-assay.pdf", b"%PDF-1.4 lab", content_type="application/pdf")
        self.client.force_authenticate(self.treatment_admin)
        res = self.client.post(
            f"/api/v1/patients/{self.patient.unique_patient_id}/documents/",
            {"documents": pdf},
            format="multipart",
        )
        self.assertEqual(res.status_code, 201, res.data)
        doc = res.data["documents"][0]
        self.assertEqual(doc["name"], "factor-assay.pdf")
        self.assertEqual(doc["hospitalName"], self.hospital.name)
        self.assertTrue(doc["uploadedBy"])
        self.client.force_authenticate(self.patient_user)
        mine = self.client.get("/api/v1/me/patient/documents/")
        self.assertEqual(mine.status_code, 200)
        self.assertEqual(mine.data["total"], 1)
        filtered = self.client.get(
            f"/api/v1/me/patient/documents/?center={self.hospital.name}&search=assay"
        )
        self.assertEqual(filtered.data["total"], 1)

    def test_patient_cannot_upload_documents(self):
        pdf = SimpleUploadedFile("hack.pdf", b"%PDF-1.4 x", content_type="application/pdf")
        self.client.force_authenticate(self.patient_user)
        res = self.client.post(
            f"/api/v1/patients/{self.patient.unique_patient_id}/documents/",
            {"documents": pdf},
            format="multipart",
        )
        self.assertEqual(res.status_code, 403)

    def test_province_admin_cannot_see_other_province_stock(self):
        self._stock_in(self.other_admin, "10")
        self.client.force_authenticate(self.province_admin_user)
        listed = self.client.get("/api/v1/stock/")
        names = {row["hospitalName"] for row in listed.data["stock"]}
        self.assertNotIn(self.other_hospital.name, names)
