from datetime import date, datetime, timedelta, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import UserRole
from apps.accounts.rbac import KIND_CENTER, KIND_TREATMENT
from apps.accounts.staffing import create_staff_account, save_admin_photo
from apps.core.demo_media import make_portrait_jpeg, make_simple_pdf
from apps.core.demo_seed_catalog import (
    CENTER_ADMINS,
    DEMO_MARKER,
    DEMO_PASSWORD,
    PATIENTS,
    TREATMENT_ADMINS,
)
from apps.factors.models import FactorMedicine, FactorType
from apps.hospitals.models import Hospital
from apps.injections.models import InjectionIndication, InjectionRecord, InjectionStatus
from apps.patients.models import (
    BleedingEpisode,
    Gender,
    HemophiliaType,
    InhibitorStatus,
    Patient,
    PatientDocument,
    TreatmentPlan,
    VerificationStatus,
)
from apps.provinces.models import District, Province
from apps.treatments.models import TreatmentRecord, TreatmentStatus, TreatmentType


class Command(BaseCommand):
    help = (
        "Seed demo patients (20), center admins (7), and treatment admins (10) "
        "with photos and documents in the real database."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove previously seeded demo records (notes contain NHMS_DEMO_SEED).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Clear existing demo seed data and recreate everything.",
        )

    def handle(self, *args, **options):
        if options["clear"] or options["force"]:
            removed = self._clear_demo_data()
            self.stdout.write(self.style.WARNING(f"Removed {removed} demo record(s)."))
            if options["clear"] and not options["force"]:
                return

        call_command("seed_nhms", verbosity=0)

        User = get_user_model()
        actor = User.objects.filter(username="superadmin").first()
        if not actor:
            self.stderr.write(self.style.ERROR("superadmin not found. Run seed_nhms first."))
            return

        with transaction.atomic():
            center_users = self._seed_center_admins(actor)
            treatment_users = self._seed_treatment_admins(actor)
            patients = self._seed_patients(actor)

        for patient in patients:
            self._seed_clinical_history(patient, actor)
            for patient in patients:
                self._seed_clinical_history(patient, actor)

        self.stdout.write(self.style.SUCCESS("\nDemo seed complete.\n"))
        self.stdout.write(f"Password for all demo accounts: {DEMO_PASSWORD}\n")
        self.stdout.write(f"  Center admins:     {len(center_users)}")
        self.stdout.write(f"  Treatment admins:  {len(treatment_users)}")
        self.stdout.write(f"  Patients:          {len(patients)}\n")

        self._print_table("Center Admins", center_users)
        self._print_table("Treatment Admins", treatment_users, extra=("access",))
        self._print_table(
            "Patients",
            [
                {
                    "id": p.unique_patient_id,
                    "name": p.full_name,
                    "email": p.email,
                    "center": p.primary_hospital.name,
                    "access": f"{p.severity} {p.get_hemophilia_type_display()} ({p.baseline_factor_level}%)",
                }
                for p in patients
            ],
            extra=("center", "access"),
        )

    def _clear_demo_data(self) -> int:
        User = get_user_model()
        removed = 0
        for patient in Patient.objects.filter(notes__contains=DEMO_MARKER):
            if patient.user_id:
                patient.user.delete()
                removed += 1
            patient.delete()
            removed += 1
        for user in User.objects.filter(notes__contains=DEMO_MARKER):
            user.delete()
            removed += 1
        for user in User.objects.filter(email__startswith="demo.patient"):
            if hasattr(user, "patient_profile") and user.patient_profile:
                user.patient_profile.delete()
            user.delete()
            removed += 1
        return removed

    def _photo_file(self, full_name: str) -> ContentFile:
        return ContentFile(make_portrait_jpeg(full_name), name=f"{full_name.replace(' ', '_').lower()}.jpg")

    def _safe_admin_photo(self, user, full_name: str):
        try:
            save_admin_photo(user, self._photo_file(full_name))
        except (ValidationError, OSError, ValueError) as exc:
            self.stdout.write(self.style.WARNING(f"  Photo skipped for {full_name}: {exc}"))

    def _seed_center_admins(self, actor):
        User = get_user_model()
        created = []
        for item in CENTER_ADMINS:
            user = User.objects.filter(email__iexact=item["email"]).first()
            if user:
                self._enhance_staff(user, item)
                created.append(self._staff_row(user, item.get("hospital", "")))
                continue
            payload = {
                "kind": KIND_CENTER,
                "fullName": item["fullName"],
                "email": item["email"],
                "phone": item["phone"],
                "temporaryPassword": DEMO_PASSWORD,
                "treatmentCenter": item["hospital"],
                "dateOfBirth": item.get("dateOfBirth"),
                "gender": item.get("gender", ""),
                "designation": item.get("designation", ""),
                "employeeId": item.get("employeeId", ""),
                "nationalId": item.get("nationalId", ""),
                "officeAddress": item.get("officeAddress", ""),
                "notes": DEMO_MARKER,
                "photo": self._photo_file(item["fullName"]),
            }
            if item.get("permissions"):
                payload["permissions"] = item["permissions"]
            if item.get("viewOnly"):
                payload["viewOnly"] = True
            try:
                payload_no_photo = {**payload, "photo": None}
                user, _ = create_staff_account(actor, payload_no_photo)
                user.must_change_password = False
                user.notes = DEMO_MARKER
                user.save(update_fields=["must_change_password", "notes"])
                self._safe_admin_photo(user, item["fullName"])
                created.append(self._staff_row(user, item["hospital"]))
                self.stdout.write(f"  Center admin: {user.staff_id} — {item['fullName']}")
            except (ValidationError, OSError, ValueError) as exc:
                self.stdout.write(self.style.ERROR(f"  Center admin failed ({item['email']}): {exc}"))
        return created

    def _seed_treatment_admins(self, actor):
        User = get_user_model()
        created = []
        for item in TREATMENT_ADMINS:
            user = User.objects.filter(email__iexact=item["email"]).first()
            if user:
                self._enhance_staff(user, item)
                created.append(
                    self._staff_row(user, item.get("hospital", ""), access=item.get("accessLabel", "Full access"))
                )
                continue
            payload = {
                "kind": KIND_TREATMENT,
                "fullName": item["fullName"],
                "email": item["email"],
                "phone": item["phone"],
                "temporaryPassword": DEMO_PASSWORD,
                "treatmentCenter": item["hospital"],
                "dateOfBirth": item.get("dateOfBirth"),
                "gender": item.get("gender", ""),
                "designation": item.get("designation", ""),
                "employeeId": item.get("employeeId", ""),
                "officeAddress": item.get("officeAddress", ""),
                "notes": DEMO_MARKER,
                "photo": self._photo_file(item["fullName"]),
            }
            if item.get("permissions"):
                payload["permissions"] = item["permissions"]
            if item.get("viewOnly"):
                payload["viewOnly"] = True
            try:
                payload_no_photo = {**payload, "photo": None}
                user, _ = create_staff_account(actor, payload_no_photo)
                user.must_change_password = False
                user.notes = DEMO_MARKER
                user.save(update_fields=["must_change_password", "notes"])
                self._safe_admin_photo(user, item["fullName"])
                created.append(
                    self._staff_row(user, item["hospital"], access=item.get("accessLabel", "Full access"))
                )
                self.stdout.write(f"  Treatment admin: {user.staff_id} — {item['fullName']}")
            except (ValidationError, OSError, ValueError) as exc:
                self.stdout.write(self.style.ERROR(f"  Treatment admin failed ({item['email']}): {exc}"))
        return created

    def _enhance_staff(self, user, item: dict):
        user.designation = item.get("designation", user.designation or "")
        user.employee_id = item.get("employeeId", user.employee_id or "")
        user.national_id = item.get("nationalId", user.national_id or "")
        user.office_address = item.get("officeAddress", user.office_address or "")
        if item.get("dateOfBirth"):
            user.date_of_birth = date.fromisoformat(item["dateOfBirth"])
        if item.get("gender"):
            user.gender = item["gender"]
        user.must_change_password = False
        user.notes = DEMO_MARKER
        user.set_password(DEMO_PASSWORD)
        user.save()
        profile = getattr(user, "hospital_admin", None)
        if profile and item.get("hospital"):
            hospital = Hospital.objects.filter(name=item["hospital"]).first()
            if hospital:
                profile.hospital = hospital
                profile.date_of_birth = user.date_of_birth
                profile.gender = user.gender
                profile.address = user.office_address
                profile.save()
            if profile.display_id and user.staff_id != profile.display_id:
                user.staff_id = profile.display_id
                user.save(update_fields=["staff_id"])
        if not user.photo:
            self._safe_admin_photo(user, item["fullName"])
        self.stdout.write(f"  Updated existing staff: {user.staff_id or user.username} — {item['fullName']}")

    def _staff_row(self, user, hospital: str, access: str = "Full access"):
        return {
            "id": user.staff_id or user.username,
            "name": user.get_full_name() or user.username,
            "email": user.email,
            "username": user.username,
            "center": hospital,
            "access": access,
        }

    def _seed_patients(self, actor):
        patients = []
        for item in PATIENTS:
            if Patient.objects.filter(email__iexact=item["email"]).exists():
                patient = Patient.objects.get(email__iexact=item["email"])
                self.stdout.write(f"  Patient exists: {patient.unique_patient_id} — {patient.full_name}")
                patients.append(patient)
                continue

            province = Province.objects.get(name=item["province"])
            district = District.objects.get(province=province, name=item["district"])
            hospital = Hospital.objects.get(name=item["hospital"])
            factor = FactorMedicine.objects.filter(name=item["factor"]).first()

            patient = Patient(
                full_name=item["fullName"],
                date_of_birth=date.fromisoformat(item["dob"]),
                gender=item["gender"],
                mobile=item["mobile"],
                email=item["email"],
                province=province,
                district=district,
                local_level=item["localLevel"],
                ward_number=item["ward"],
                address=item["address"],
                blood_group=item["bloodGroup"],
                hemophilia_type=HemophiliaType.A if item["hemophiliaType"] == "A" else HemophiliaType.B,
                severity=item["severity"],
                baseline_factor_level=Decimal(item["baseline"]),
                inhibitor_status=item["inhibitor"],
                treatment_plan=item["plan"],
                prescribed_factor_medicine=factor,
                diagnosis_date=date.fromisoformat(item["dob"]),
                primary_hospital=hospital,
                emergency_contact_name=f"{item['fullName'].split()[0]}'s Guardian",
                emergency_contact_phone=str(int(item["mobile"]) + 1),
                emergency_contact_relation="Parent",
                verification_status=VerificationStatus.ACTIVE,
                notes=f"{DEMO_MARKER} — demo patient for admin panel.",
                created_by=actor,
                updated_by=actor,
            )
            patient.save()

            User = get_user_model()
            first = item["fullName"].split()[0]
            last = " ".join(item["fullName"].split()[1:]) or first
            user = User.objects.create_user(
                username=patient.unique_patient_id,
                email=patient.email,
                password=DEMO_PASSWORD,
                role=UserRole.PATIENT,
                mobile=patient.mobile,
                first_name=first,
                last_name=last,
                must_change_password=False,
                is_staff=False,
                is_superuser=False,
            )
            patient.user = user
            patient.save(update_fields=["user"])

            try:
                photo_bytes = make_portrait_jpeg(item["fullName"])
                patient.photo.save(
                    f"{patient.unique_patient_id}/photo.jpg",
                    ContentFile(photo_bytes),
                    save=True,
                )
            except (OSError, ValueError) as exc:
                self.stdout.write(self.style.WARNING(f"  Photo skipped for {patient.unique_patient_id}: {exc}"))

            self._attach_documents(patient, actor, hospital, item)
            patients.append(patient)
            self.stdout.write(
                f"  Patient: {patient.unique_patient_id} — {patient.full_name} "
                f"({patient.severity}, {patient.baseline_factor_level}%)"
            )
        return patients

    def _seed_clinical_history(self, patient: Patient, actor):
        if InjectionRecord.objects.filter(patient=patient).exists():
            return
        hospital = patient.primary_hospital
        factor = patient.prescribed_factor_medicine or FactorMedicine.objects.filter(
            factor_type=FactorType.FVIII if patient.hemophilia_type == HemophiliaType.A else FactorType.FIX
        ).first()
        if not factor or not hospital:
            return
        tz = timezone.get_current_timezone()
        today = timezone.localdate()
        seed = abs(hash(patient.unique_patient_id))
        sites = ["Knee", "Elbow", "Ankle", "Calf muscle", "Hip"]
        indications = [
            InjectionIndication.PROPHYLAXIS,
            InjectionIndication.ON_DEMAND,
            InjectionIndication.PROPHYLAXIS,
            InjectionIndication.TRAUMA,
        ]
        dose = Decimal("1000") if patient.severity == "Mild" else Decimal("1500") if patient.severity == "Moderate" else Decimal("2000")
        created_inj = 0
        year, month = today.year, today.month
        for months_ago in range(7, -1, -1):
            mm = month - months_ago
            yy = year
            while mm <= 0:
                mm += 12
                yy -= 1
            shots = 3 if patient.severity == "Severe" else 2 if patient.severity == "Moderate" else 1
            for shot in range(shots):
                day = min(28, 4 + shot * 8 + (seed % 3))
                when = timezone.make_aware(datetime.combine(date(yy, mm, day), time(10, 30)), tz)
                if when.date() > today:
                    continue
                indication = indications[(seed + months_ago + shot) % len(indications)]
                if patient.treatment_plan and "Prophylaxis" in patient.treatment_plan:
                    indication = InjectionIndication.PROPHYLAXIS if shot < shots - 1 else indication
                InjectionRecord.objects.create(
                    patient=patient,
                    hospital=hospital,
                    administered_by=actor,
                    factor_medicine=factor,
                    factor_type=factor.factor_type,
                    dose=dose,
                    unit=factor.unit or "IU",
                    indication=indication,
                    status=InjectionStatus.COMPLETED,
                    administered_at=when,
                    doctor_name="Dr. Sharma",
                    notes=DEMO_MARKER,
                )
                created_inj += 1
        bleed_count = 4 if patient.severity == "Severe" else 2 if patient.severity == "Moderate" else 1
        for i in range(bleed_count):
            episode_day = today - timedelta(days=12 + i * 28 + (seed % 7))
            BleedingEpisode.objects.create(
                patient=patient,
                hospital=hospital,
                episode_date=episode_day,
                site=sites[(seed + i) % len(sites)],
                severity="Severe" if i == 0 and patient.severity == "Severe" else "Moderate",
                notes="Demo bleed for charts.",
                recorded_by=actor,
            )
        TreatmentRecord.objects.create(
            patient=patient,
            hospital=hospital,
            recorded_by=actor,
            treatment_type=TreatmentType.PHYSIOTHERAPY,
            status=TreatmentStatus.COMPLETED,
            description="Joint physiotherapy session after bleed.",
            treatment_date=today - timedelta(days=21),
            notes=DEMO_MARKER,
        )
        self.stdout.write(f"  Clinical history: {patient.unique_patient_id} ({created_inj} injections)")

    def _attach_documents(self, patient: Patient, actor, hospital: Hospital, item: dict):
        docs = [
            (
                f"factor-assay-{patient.unique_patient_id}.pdf",
                "Baseline Factor Assay Report",
                [
                    f"Patient: {patient.full_name}",
                    f"ID: {patient.unique_patient_id}",
                    f"Baseline factor level: {patient.baseline_factor_level}%",
                    f"Hemophilia type: {patient.get_hemophilia_type_display()}",
                    f"Severity: {patient.severity}",
                    f"Collected: {timezone.localdate().isoformat()}",
                ],
            ),
            (
                f"clinical-summary-{patient.unique_patient_id}.pdf",
                "Clinical Summary",
                [
                    f"Treatment plan: {patient.treatment_plan}",
                    f"Primary center: {hospital.name}",
                    f"Inhibitor status: {patient.inhibitor_status}",
                    f"Prescribed factor: {item['factor']}",
                    "Document generated for NHMS demo.",
                ],
            ),
        ]
        for filename, title, lines in docs:
            if patient.files.filter(original_name=filename).exists():
                continue
            pdf_bytes = make_simple_pdf(title, lines)
            PatientDocument.objects.create(
                patient=patient,
                file=ContentFile(pdf_bytes, name=filename),
                original_name=filename,
                content_type="application/pdf",
                size=len(pdf_bytes),
                uploaded_by=actor,
                hospital=hospital,
            )

    def _print_table(self, title: str, rows: list[dict], extra=()):
        if not rows:
            return
        self.stdout.write(f"\n{title}")
        self.stdout.write("-" * 72)
        for row in rows:
            line = f"  {row.get('id', '')}  {row.get('name', '')}  ({row.get('username', row.get('email', ''))})"
            if "center" in extra and row.get("center"):
                line += f"\n    Center: {row['center']}"
            if "access" in extra and row.get("access"):
                line += f"\n    Access: {row['access']}"
            self.stdout.write(line)
