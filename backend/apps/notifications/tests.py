from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import UserRole
from apps.hospitals.models import Hospital
from apps.injections.models import InjectionRecord, InjectionStatus
from apps.notifications.jobs import send_injection_reminders, send_monthly_insights
from apps.notifications.models import PatientNotification, PushDevice
from apps.notifications.push import _active_push_tokens
from apps.notifications.services import notify_patient
from apps.patients.models import Patient
from apps.provinces.models import District, Province
from apps.factors.models import ApplicableType, DoseUnit, FactorMedicine, FactorType

User = get_user_model()


@override_settings(CRON_SECRET="cron-test-key")
class NotificationJobTests(TestCase):
    def setUp(self):
        province = Province.objects.create(name="Bagmati", code="P3")
        district = District.objects.create(province=province, name="Kathmandu")
        self.hospital = Hospital.objects.create(name="Test HTC", province=province, district=district)
        self.admin = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.patient_user = User.objects.create_user(
            username="HEM-0002001",
            password="OwnPass#2026",
            role=UserRole.PATIENT,
            must_change_password=False,
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            unique_patient_id="HEM-0002001",
            full_name="Reminder Patient",
            date_of_birth="2001-03-12",
            gender="Male",
            mobile="9841234567",
            email="remind@example.com",
            province=province,
            district=district,
            local_level="Kathmandu Metro",
            ward_number=5,
            address="Baneshwor",
            blood_group="O+",
            hemophilia_type="A",
            deficient_factor="VIII",
            severity="Severe",
            baseline_factor_level="0.5",
            primary_hospital=self.hospital,
            emergency_contact_name="Parent",
            emergency_contact_phone="9851234567",
        )
        self.factor = FactorMedicine.objects.create(
            name="Factor VIII",
            factor_type=FactorType.FVIII,
            applicable_type=ApplicableType.A,
            unit=DoseUnit.IU,
        )

    def _schedule(self, when):
        return InjectionRecord.objects.create(
            patient=self.patient,
            hospital=self.hospital,
            administered_by=self.admin,
            factor_medicine=self.factor,
            factor_type=FactorType.FVIII,
            dose="500",
            unit=DoseUnit.IU,
            indication="Prophylaxis",
            status=InjectionStatus.SCHEDULED,
            administered_at=when,
        )

    def test_day_before_sends_two_reminders_after_evening(self):
        tomorrow_evening = timezone.localtime().replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
        self._schedule(tomorrow_evening)
        now = timezone.localtime().replace(hour=18, minute=0, second=0, microsecond=0)
        first = send_injection_reminders(now)
        second = send_injection_reminders(now)
        self.assertEqual(first["sent"], 2)
        self.assertEqual(second["sent"], 0)
        self.assertEqual(PatientNotification.objects.filter(patient=self.patient, category="schedule").count(), 2)

    def test_cron_requires_key_and_runs_jobs(self):
        client = APIClient()
        denied = client.get("/api/v1/cron/notifications/")
        self.assertEqual(denied.status_code, 403)
        ok = client.get("/api/v1/cron/notifications/?key=cron-test-key&job=insights")
        self.assertEqual(ok.status_code, 200, ok.data)
        self.assertEqual(ok.data["monthlyInsights"]["sent"], 1)
        again = client.get("/api/v1/cron/notifications/?key=cron-test-key&job=insights")
        self.assertEqual(again.data["monthlyInsights"]["sent"], 0)
        self.assertEqual(send_monthly_insights()["sent"], 0)

    def test_push_token_registration_replaces_stale_devices(self):
        client = APIClient()
        client.force_authenticate(self.patient_user)
        first = client.post(
            "/api/v1/notifications/push-token/",
            {"token": "stale-fcm-token-1", "platform": "android", "app": "patient"},
            format="json",
        )
        second = client.post(
            "/api/v1/notifications/push-token/",
            {"token": "current-fcm-token-2", "platform": "android", "app": "patient"},
            format="json",
        )
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        tokens = list(
            PushDevice.objects.filter(user=self.patient_user, app="patient").values_list("token", flat=True)
        )
        self.assertEqual(tokens, ["current-fcm-token-2"])

    def test_active_push_tokens_keep_latest_per_app(self):
        PushDevice.objects.create(user=self.patient_user, token="old-expo", platform="android", app="patient")
        PushDevice.objects.create(user=self.patient_user, token="new-fcm", platform="android", app="patient")
        PushDevice.objects.create(user=self.admin, token="admin-web", platform="web", app="admin")
        active = _active_push_tokens([self.patient_user.id, self.admin.id])
        self.assertEqual(sorted(active), ["admin-web", "new-fcm"])

    def test_notify_patient_dedupes_same_related_event(self):
        first = notify_patient(
            patient=self.patient,
            category="injection",
            title="Injection recorded",
            message="First",
            related_type="injection",
            related_id=99,
        )
        second = notify_patient(
            patient=self.patient,
            category="injection",
            title="Injection recorded",
            message="Second",
            related_type="injection",
            related_id=99,
        )
        self.assertEqual(first.id, second.id)
        self.assertEqual(PatientNotification.objects.filter(patient=self.patient, related_id=99).count(), 1)
