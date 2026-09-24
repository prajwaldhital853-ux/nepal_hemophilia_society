from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.accounts.models import UserRole
from apps.core.models import RecordNote
from apps.hospitals.models import Hospital
from apps.provinces.models import District, Province

User = get_user_model()

PATIENT_PAYLOAD = {
    "fullName": "Notes Patient",
    "dateOfBirth": "2001-03-12",
    "gender": "Male",
    "mobile": "9841234567",
    "email": "notes.patient@example.com",
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


class RecordNoteApiTests(APITestCase):
    def setUp(self):
        province = Province.objects.create(name="Bagmati", code="P3")
        district = District.objects.create(province=province, name="Kathmandu")
        Hospital.objects.create(name="Kathmandu Hemophilia Center", province=province, district=district)
        self.admin = User.objects.create_user(username="super", password="ChangeMe#2026", role=UserRole.SUPER_ADMIN)
        self.other = User.objects.create_user(username="admin2", password="ChangeMe#2026", role=UserRole.ADMIN)
        self.client.force_authenticate(self.admin)
        res = self.client.post("/api/v1/patients/", PATIENT_PAYLOAD, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.patient_id = res.data["patient"]["id"]
        res = self.client.post(
            f"/api/v1/patients/{self.patient_id}/bleeding-episodes/",
            {"episodeDate": "2026-09-01", "site": "knee", "severity": "mild"},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.episode_id = res.data["episode"]["id"]

    def test_patient_note_create_and_list(self):
        res = self.client.post(f"/api/v1/notes/patient/{self.patient_id}/", {"body": "Called family about follow-up."}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["note"]["author"]["name"], "super")
        self.assertTrue(res.data["note"]["canEdit"])

        listed = self.client.get(f"/api/v1/notes/patient/{self.patient_id}/").data
        self.assertEqual(len(listed["notes"]), 1)
        self.assertEqual(listed["notes"][0]["body"], "Called family about follow-up.")

    def test_clinical_note_rolls_up_into_patient_scope_all(self):
        res = self.client.post(f"/api/v1/notes/bleeding/{self.episode_id}/", {"body": "Swelling reduced after 48h."}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertIn("Bleed", res.data["note"]["targetLabel"])

        own = self.client.get(f"/api/v1/notes/patient/{self.patient_id}/").data
        self.assertEqual(len(own["notes"]), 0)
        rolled = self.client.get(f"/api/v1/notes/patient/{self.patient_id}/?scope=all").data
        self.assertEqual(len(rolled["notes"]), 1)
        self.assertEqual(rolled["notes"][0]["targetType"], "bleeding")

        counts = self.client.get(f"/api/v1/notes/patient/{self.patient_id}/counts/").data
        self.assertEqual(counts["counts"]["bleeding"][str(self.episode_id)], 1)

    def test_staff_note(self):
        res = self.client.post(f"/api/v1/notes/staff/{self.other.pk}/", {"body": "Completed onboarding."}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(len(self.client.get(f"/api/v1/notes/staff/{self.other.pk}/").data["notes"]), 1)

    def test_only_author_can_edit_or_delete(self):
        note_id = self.client.post(f"/api/v1/notes/patient/{self.patient_id}/", {"body": "Original"}, format="json").data["note"]["id"]
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.patch(f"/api/v1/notes/{note_id}/", {"body": "Hijack"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/v1/notes/{note_id}/").status_code, 403)

        self.client.force_authenticate(self.admin)
        res = self.client.patch(f"/api/v1/notes/{note_id}/", {"body": "Updated"}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["note"]["body"], "Updated")
        self.assertEqual(self.client.delete(f"/api/v1/notes/{note_id}/").status_code, 204)
        self.assertFalse(RecordNote.objects.filter(pk=note_id).exists())

    def test_empty_note_rejected_and_view_only_blocked(self):
        self.assertEqual(self.client.post(f"/api/v1/notes/patient/{self.patient_id}/", {"body": "  "}, format="json").status_code, 400)
        self.other.view_only = True
        self.other.save(update_fields=["view_only"])
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post(f"/api/v1/notes/patient/{self.patient_id}/", {"body": "x"}, format="json").status_code, 403)

    def test_patient_role_cannot_use_notes(self):
        patient_user = User.objects.get(username=self.patient_id)
        self.client.force_authenticate(patient_user)
        self.assertEqual(self.client.get(f"/api/v1/notes/patient/{self.patient_id}/").status_code, 403)
