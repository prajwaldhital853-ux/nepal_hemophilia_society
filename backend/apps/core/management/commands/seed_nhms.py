from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.accounts.models import UserRole
from apps.hospitals.models import Hospital, HospitalAdmin, HospitalStaffType
from apps.provinces.models import District, Province, ProvinceAdmin

PROVINCES = [
    ("Koshi", "P1"),
    ("Madhesh", "P2"),
    ("Bagmati", "P3"),
    ("Gandaki", "P4"),
    ("Lumbini", "P5"),
    ("Karnali", "P6"),
    ("Sudurpashchim", "P7"),
]

DISTRICTS = {
    "Koshi": [
        "Taplejung",
        "Sankhuwasabha",
        "Solukhumbu",
        "Okhaldhunga",
        "Khotang",
        "Bhojpur",
        "Dhankuta",
        "Terhathum",
        "Panchthar",
        "Ilam",
        "Jhapa",
        "Morang",
        "Sunsari",
        "Udayapur",
    ],
    "Madhesh": ["Saptari", "Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa"],
    "Bagmati": [
        "Dolakha",
        "Ramechhap",
        "Sindhuli",
        "Kavrepalanchok",
        "Sindhupalchok",
        "Rasuwa",
        "Nuwakot",
        "Dhading",
        "Kathmandu",
        "Bhaktapur",
        "Lalitpur",
        "Makwanpur",
        "Chitwan",
    ],
    "Gandaki": [
        "Gorkha",
        "Manang",
        "Mustang",
        "Myagdi",
        "Kaski",
        "Lamjung",
        "Tanahu",
        "Nawalpur",
        "Syangja",
        "Parbat",
        "Baglung",
    ],
    "Lumbini": [
        "Kapilvastu",
        "Rupandehi",
        "Palpa",
        "Arghakhanchi",
        "Gulmi",
        "Parasi",
        "Dang",
        "Pyuthan",
        "Rolpa",
        "Eastern Rukum",
        "Banke",
        "Bardiya",
    ],
    "Karnali": ["Dolpa", "Mugu", "Humla", "Jumla", "Kalikot", "Dailekh", "Jajarkot", "Western Rukum", "Salyan", "Surkhet"],
    "Sudurpashchim": [
        "Bajura",
        "Bajhang",
        "Darchula",
        "Baitadi",
        "Dadeldhura",
        "Doti",
        "Achham",
        "Kailali",
        "Kanchanpur",
    ],
}

HOSPITALS = [
    ("Kathmandu Hemophilia Center", "Bagmati", "Kathmandu"),
    ("TU Teaching Hospital", "Bagmati", "Kathmandu"),
    ("Bhaktapur Treatment Center", "Bagmati", "Bhaktapur"),
    ("Lalitpur Hemophilia Clinic", "Bagmati", "Lalitpur"),
    ("Hetauda Hemophilia Center", "Bagmati", "Makwanpur"),
    ("Pokhara Hemophilia Center", "Gandaki", "Kaski"),
    ("Biratnagar Hemophilia Center", "Koshi", "Morang"),
    ("Janakpur Hemophilia Clinic", "Madhesh", "Dhanusha"),
    ("Butwal Treatment Center", "Lumbini", "Rupandehi"),
    ("Nepalgunj Hemophilia Center", "Lumbini", "Banke"),
    ("Surkhet Hemophilia Center", "Karnali", "Surkhet"),
    ("Dhangadhi Hemophilia Center", "Sudurpashchim", "Kailali"),
]


class Command(BaseCommand):
    help = "Seed provinces, districts, hospitals, and a super admin (no patient self-registration)."

    def handle(self, *args, **options):
        User = get_user_model()
        for name, code in PROVINCES:
            Province.objects.get_or_create(name=name, defaults={"code": code})

        for province_name, districts in DISTRICTS.items():
            province = Province.objects.get(name=province_name)
            for district_name in districts:
                District.objects.get_or_create(province=province, name=district_name)

        for name, province_name, district_name in HOSPITALS:
            province = Province.objects.get(name=province_name)
            district = District.objects.get(province=province, name=district_name)
            Hospital.objects.get_or_create(
                name=name,
                defaults={"province": province, "district": district, "is_active": True},
            )

        user, created = User.objects.get_or_create(
            username="superadmin",
            defaults={
                "email": "superadmin@hemophilia.org.np",
                "role": UserRole.SUPER_ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Super",
                "last_name": "Admin",
            },
        )
        if created:
            user.set_password("ChangeMe#2026")
            user.save()
            self.stdout.write(self.style.WARNING("Created superadmin / ChangeMe#2026 — change this password."))
        else:
            if user.role != UserRole.SUPER_ADMIN:
                user.role = UserRole.SUPER_ADMIN
                user.is_staff = True
                user.save(update_fields=["role", "is_staff"])
            self.stdout.write("Super admin already exists.")

        self._seed_hospital_staff(User)
        self._seed_province_admins(User)
        self._seed_factors()

        self.stdout.write(self.style.SUCCESS("Seed complete."))

    def _seed_province_admins(self, User):
        """One Province Admin per province (plan.md §4 / §5.2)."""
        samples = [
            ("Koshi", "koshi.admin", "Koshi", "Admin", "9841000001", "PADM-00002"),
            ("Madhesh", "madhesh.admin", "Madhesh", "Admin", "9841000002", "PADM-00003"),
            ("Bagmati", "bagmati.admin", "Bagmati", "Admin", "9841111111", "PADM-00001"),
            ("Gandaki", "gandaki.admin", "Gandaki", "Admin", "9841000004", "PADM-00004"),
            ("Lumbini", "lumbini.admin", "Lumbini", "Admin", "9841000005", "PADM-00005"),
            ("Karnali", "karnali.admin", "Karnali", "Admin", "9841000006", "PADM-00006"),
            ("Sudurpashchim", "sudur.admin", "Sudur", "Admin", "9841000007", "PADM-00007"),
        ]
        for province_name, username, first, last, mobile, display_id in samples:
            province = Province.objects.filter(name=province_name).first()
            if not province:
                continue
            if ProvinceAdmin.objects.filter(province=province).exists():
                continue
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@hemophilia.org.np",
                    "role": UserRole.PROVINCE_ADMIN,
                    "is_staff": True,
                    "first_name": first,
                    "last_name": last,
                    "mobile": mobile,
                    "is_active_account": True,
                },
            )
            if created:
                user.set_password("ChangeMe#2026")
                user.save()
            elif user.role != UserRole.PROVINCE_ADMIN:
                user.role = UserRole.PROVINCE_ADMIN
                user.is_staff = True
                user.save(update_fields=["role", "is_staff"])
            ProvinceAdmin.objects.get_or_create(
                user=user,
                defaults={"province": province, "display_id": display_id},
            )
            self.stdout.write(f"Province Admin ready: {username} ({province_name})")

    def _seed_hospital_staff(self, User):
        samples = [
            {
                "username": "ravi.center",
                "email": "ravi.shrestha@hemophilia.org.np",
                "first_name": "Ravi",
                "last_name": "Shrestha",
                "mobile": "9841234567",
                "hospital": "Kathmandu Hemophilia Center",
                "staff_type": HospitalStaffType.CENTER_ADMIN,
                "display_id": "CADM-00001",
            },
            {
                "username": "sita.treatment",
                "email": "sita.magar@hemophilia.org.np",
                "first_name": "Sita",
                "last_name": "Magar",
                "mobile": "9842345678",
                "hospital": "TU Teaching Hospital",
                "staff_type": HospitalStaffType.TREATMENT_ADMIN,
                "display_id": "TADM-00001",
            },
        ]
        for item in samples:
            hospital = Hospital.objects.filter(name=item["hospital"]).first()
            if not hospital:
                continue
            user, created = User.objects.get_or_create(
                username=item["username"],
                defaults={
                    "email": item["email"],
                    "role": UserRole.HOSPITAL_ADMIN,
                    "first_name": item["first_name"],
                    "last_name": item["last_name"],
                    "mobile": item["mobile"],
                    "must_change_password": False,
                    "is_active_account": True,
                },
            )
            if created:
                user.set_password("ChangeMe#2026")
                user.save()
            HospitalAdmin.objects.get_or_create(
                user=user,
                defaults={
                    "hospital": hospital,
                    "staff_type": item["staff_type"],
                    "display_id": item["display_id"],
                },
            )

    def _seed_factors(self):
        from apps.factors.models import ApplicableType, DoseUnit, FactorMedicine, FactorType

        catalog = [
            ("Factor VIII Concentrate (Plasma-derived)", "", FactorType.FVIII, ApplicableType.A, DoseUnit.IU),
            ("Factor VIII Concentrate (Recombinant)", "Octocog alfa", FactorType.FVIII, ApplicableType.A, DoseUnit.IU),
            ("Factor IX Concentrate (Plasma-derived)", "", FactorType.FIX, ApplicableType.B, DoseUnit.IU),
            ("Factor IX Concentrate (Recombinant)", "Nonacog alfa", FactorType.FIX, ApplicableType.B, DoseUnit.IU),
            ("Emicizumab", "Hemlibra", FactorType.BYPASSING, ApplicableType.A, DoseUnit.MG),
            ("FEIBA", "", FactorType.BYPASSING, ApplicableType.BOTH, DoseUnit.IU),
            ("rFVIIa (NovoSeven)", "", FactorType.BYPASSING, ApplicableType.BOTH, DoseUnit.IU),
        ]
        for name, brand, ftype, applicable, unit in catalog:
            FactorMedicine.objects.get_or_create(
                name=name,
                defaults={
                    "brand_name": brand,
                    "factor_type": ftype,
                    "applicable_type": applicable,
                    "unit": unit,
                    "is_active": True,
                },
            )
