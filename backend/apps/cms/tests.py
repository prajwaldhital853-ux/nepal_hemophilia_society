from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.cms.models import AppService, CmsArticle, ContentKind
from apps.cms.seed import seed_cms_defaults
from apps.hospitals.models import Hospital
from apps.patients.models import Patient
from apps.provinces.models import District, Province

User = get_user_model()


class CmsApiTests(APITestCase):
    def setUp(self):
        seed_cms_defaults()
        self.super = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.web = User.objects.create_user(username="webmgr", password="ChangeMe#2026", role=UserRole.WEBSITE_MANAGER)
        province = Province.objects.create(name="Bagmati", code="P3")
        district = District.objects.create(province=province, name="Kathmandu")
        hospital = Hospital.objects.create(name="Kathmandu Hemophilia Center", province=province, district=district)
        patient_user = User.objects.create_user(
            username="HEM-0001001",
            password="OwnPass#2026",
            role=UserRole.PATIENT,
            must_change_password=False,
        )
        Patient.objects.create(
            user=patient_user,
            unique_patient_id="HEM-0001001",
            full_name="App Patient",
            date_of_birth="2001-03-12",
            gender="Male",
            mobile="9841234567",
            email="cms.patient@example.com",
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
            primary_hospital=hospital,
            emergency_contact_name="Parent",
            emergency_contact_phone="9851234567",
        )
        self.patient_user = patient_user

    def test_patient_sees_published_services_grouped(self):
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/cms/services/")
        self.assertEqual(res.status_code, 200, res.data)
        ids = {row["id"] for row in res.data["categories"]}
        self.assertIn("treatment", ids)
        titles = [item["title"] for cat in res.data["categories"] for item in cat["services"]]
        self.assertIn("Injection Logs", titles)

    def test_unpublished_service_hidden_from_patient(self):
        AppService.objects.filter(slug="help").update(published=False)
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/cms/services/help/")
        self.assertEqual(res.status_code, 404)

    def test_website_manager_can_update_service_body(self):
        self.client.force_authenticate(self.web)
        service = AppService.objects.get(slug="contact")
        res = self.client.put(
            f"/api/v1/cms/admin/services/{service.id}/",
            {"body": "Updated contact copy from admin.", "phone": "9800000000"},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["service"]["body"], "Updated contact copy from admin.")
        self.assertEqual(res.data["service"]["phone"], "9800000000")
        self.client.force_authenticate(self.patient_user)
        detail = self.client.get("/api/v1/cms/services/contact/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["service"]["phone"], "9800000000")

    def test_admin_can_publish_news_for_patient_app(self):
        self.client.force_authenticate(self.super)
        created = self.client.post(
            "/api/v1/cms/admin/content/",
            {
                "kind": "news",
                "slug": "factor-supply-notice",
                "title": "Factor supply notice",
                "summary": "Temporary update on factor distribution.",
                "body": "Centres will share allocation details with registered patients.",
                "published": True,
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        self.client.force_authenticate(self.patient_user)
        listing = self.client.get("/api/v1/cms/content/news/")
        self.assertEqual(listing.status_code, 200)
        titles = [row["title"] for row in listing.data["articles"]]
        self.assertIn("Factor supply notice", titles)
        detail = self.client.get("/api/v1/cms/content/news/factor-supply-notice/")
        self.assertEqual(detail.status_code, 200)
        self.assertIn("allocation", detail.data["article"]["body"])

    def test_patient_can_list_treatment_centers(self):
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/cms/centers/")
        self.assertEqual(res.status_code, 200)
        names = {row["name"] for row in res.data["centers"]}
        self.assertIn("Kathmandu Hemophilia Center", names)

    def test_patient_cannot_use_admin_cms_api(self):
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/cms/admin/services/")
        self.assertEqual(res.status_code, 403)

    def test_patient_can_read_insight_tips(self):
        self.client.force_authenticate(self.patient_user)
        res = self.client.get("/api/v1/cms/content/insights/")
        self.assertEqual(res.status_code, 200)
        titles = [row["title"] for row in res.data["articles"]]
        self.assertIn("How to read your charts", titles)
