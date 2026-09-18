from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.factors.models import ApplicableType, FactorMedicine, FactorType
from apps.hospitals.models import Hospital
from apps.injections.models import InjectionIndication, InjectionRecord, InjectionStatus
from apps.patients.models import BleedingEpisode, Patient
from apps.provinces.models import District, Province
from apps.treatments.models import TreatmentRecord, TreatmentStatus, TreatmentType

User = get_user_model()


class PatientInsightsTests(APITestCase):
    def setUp(self):
        province = Province.objects.create(name="Bagmati", code="P3")
        district = District.objects.create(province=province, name="Kathmandu")
        hospital = Hospital.objects.create(name="Kathmandu Hemophilia Center", province=province, district=district)
        factor = FactorMedicine.objects.create(
            name="FVIII Test",
            factor_type=FactorType.FVIII,
            applicable_type=ApplicableType.A,
            unit="IU",
        )
        self.staff = User.objects.create_user(username="staff", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.patient_user = User.objects.create_user(
            username="HEM-0002001",
            password="OwnPass#2026",
            role=UserRole.PATIENT,
            must_change_password=False,
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            unique_patient_id="HEM-0002001",
            full_name="Chart Patient",
            date_of_birth="2005-01-01",
            gender="Male",
            mobile="9841000999",
            email="chart.patient@example.com",
            province=province,
            district=district,
            local_level="Kathmandu Metro",
            ward_number=5,
            address="Baneshwor",
            blood_group="O+",
            hemophilia_type="A",
            deficient_factor="FVIII",
            severity="Severe",
            baseline_factor_level="1.00",
            treatment_plan="Regular Prophylaxis",
            prescribed_factor_medicine=factor,
            primary_hospital=hospital,
            emergency_contact_name="Parent",
            emergency_contact_phone="9851000999",
        )
        now = timezone.now()
        InjectionRecord.objects.create(
            patient=self.patient,
            hospital=hospital,
            administered_by=self.staff,
            factor_medicine=factor,
            factor_type=FactorType.FVIII,
            dose=Decimal("2000"),
            unit="IU",
            indication=InjectionIndication.PROPHYLAXIS,
            status=InjectionStatus.COMPLETED,
            administered_at=now - timedelta(days=5),
        )
        InjectionRecord.objects.create(
            patient=self.patient,
            hospital=hospital,
            administered_by=self.staff,
            factor_medicine=factor,
            factor_type=FactorType.FVIII,
            dose=Decimal("2000"),
            unit="IU",
            indication=InjectionIndication.ON_DEMAND,
            status=InjectionStatus.COMPLETED,
            administered_at=now - timedelta(days=40),
        )
        BleedingEpisode.objects.create(
            patient=self.patient,
            hospital=hospital,
            episode_date=(now - timedelta(days=12)).date(),
            site="Knee",
            severity="Moderate",
            recorded_by=self.staff,
        )
        TreatmentRecord.objects.create(
            patient=self.patient,
            hospital=hospital,
            recorded_by=self.staff,
            treatment_type=TreatmentType.PHYSIOTHERAPY,
            status=TreatmentStatus.COMPLETED,
            description="Physio",
            treatment_date=(now - timedelta(days=8)).date(),
        )

    def test_patient_insights_returns_charts_and_status(self):
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/me/patient/insights/")
        self.assertEqual(res.status_code, 200, res.data)
        data = res.data["insights"]
        self.assertEqual(len(data["monthly"]["labels"]), 12)
        self.assertGreaterEqual(data["totals"]["injections12m"], 2)
        self.assertGreaterEqual(data["totals"]["bleeds12m"], 1)
        self.assertIn(data["status"]["tone"], {"good", "watch", "alert"})
        self.assertTrue(data["bleedSites"])
        self.assertTrue(data["indications"])

    def test_unauthenticated_insights_rejected(self):
        res = self.client.get("/api/v1/me/patient/insights/")
        self.assertEqual(res.status_code, 401)
