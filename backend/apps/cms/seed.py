"""Default patient-app services and sample CMS articles."""

from django.utils import timezone

from apps.cms.models import AppService, CmsArticle, ContentKind, ServiceAction, ServiceCategory

DEFAULT_SERVICES = [
    {
        "slug": "treatment-history",
        "title": "Treatment History",
        "description": "View your past treatments",
        "body": "Your treatment history lists physiotherapy, dental, surgery, and other care recorded by your treatment centre.",
        "category": ServiceCategory.TREATMENT,
        "icon_set": "mci",
        "icon_name": "water-plus",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Treatments",
        "sort_order": 10,
    },
    {
        "slug": "injection-logs",
        "title": "Injection Logs",
        "description": "Track your injections",
        "body": "Review every factor injection logged for your account, including dose, hospital, and date.",
        "category": ServiceCategory.TREATMENT,
        "icon_set": "mci",
        "icon_name": "needle",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Injections",
        "sort_order": 20,
    },
    {
        "slug": "upcoming-events",
        "title": "Upcoming Events",
        "description": "See appointments and events",
        "body": "Camps, workshops, and NHS events published by the national office appear here.",
        "category": ServiceCategory.TREATMENT,
        "icon_set": "ion",
        "icon_name": "calendar-outline",
        "action_type": ServiceAction.EVENTS,
        "action_value": "",
        "sort_order": 30,
    },
    {
        "slug": "health-records",
        "title": "Health Records",
        "description": "Manage your medical information",
        "body": "Open documents uploaded by your treatment centre — lab reports, prescriptions, and other files.",
        "category": ServiceCategory.TREATMENT,
        "icon_set": "mci",
        "icon_name": "clipboard-pulse-outline",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Documents",
        "sort_order": 40,
    },
    {
        "slug": "bleeding-history",
        "title": "Bleeding History",
        "description": "Record and analyze bleeds",
        "body": "Bleeding episodes recorded by your care team, with site and severity when available.",
        "category": ServiceCategory.TREATMENT,
        "icon_set": "mci",
        "icon_name": "water",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Bleeding",
        "sort_order": 50,
    },
    {
        "slug": "factor-stock",
        "title": "Factor Stock",
        "description": "Check factor availability",
        "body": "See factor stock reported for your primary treatment centre.",
        "category": ServiceCategory.TREATMENT,
        "icon_set": "mci",
        "icon_name": "pill",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Factor",
        "sort_order": 60,
    },
    {
        "slug": "analytics",
        "title": "Analytics",
        "description": "View your health trends and reports",
        "body": "Charts and stock trends for your factor use. Open Factor & Stock for the full view.",
        "category": ServiceCategory.TREATMENT,
        "icon_set": "mci",
        "icon_name": "chart-line",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Factor",
        "sort_order": 70,
    },
    {
        "slug": "emergency-support",
        "title": "Emergency Support",
        "description": "Get help in emergencies",
        "body": (
            "If you are bleeding and need urgent care, go to the nearest hemophilia treatment centre "
            "or emergency department. Carry your Emergency ID card and tell staff you have hemophilia.\n\n"
            "National Hemophilia Society (Nepal) can help you locate a centre. Update the phone numbers "
            "below from the admin panel so patients always see current contacts."
        ),
        "category": ServiceCategory.TREATMENT,
        "icon_set": "mci",
        "icon_name": "shield-plus-outline",
        "action_type": ServiceAction.CONTENT,
        "action_value": "",
        "phone": "01-4443386",
        "email": "info@nsh.org.np",
        "sort_order": 80,
    },
    {
        "slug": "resources",
        "title": "Educational Resources",
        "description": "Learn about hemophilia care",
        "body": "Guides and articles published by NHS for patients and families.",
        "category": ServiceCategory.EDUCATION,
        "icon_set": "ion",
        "icon_name": "book-outline",
        "action_type": ServiceAction.RESOURCES,
        "action_value": "",
        "sort_order": 10,
    },
    {
        "slug": "training",
        "title": "Training & Workshops",
        "description": "Join learning sessions",
        "body": (
            "NHS and partner centres run infusion training, physiotherapy workshops, and family education days. "
            "Watch Events for dates. Contact your centre to register."
        ),
        "category": ServiceCategory.EDUCATION,
        "icon_set": "ion",
        "icon_name": "school-outline",
        "action_type": ServiceAction.CONTENT,
        "action_value": "",
        "sort_order": 20,
    },
    {
        "slug": "campaigns",
        "title": "Campaigns",
        "description": "Awareness drives & events",
        "body": "World Hemophilia Day and other NHS campaigns. Read the latest notices below.",
        "category": ServiceCategory.EDUCATION,
        "icon_set": "ion",
        "icon_name": "megaphone-outline",
        "action_type": ServiceAction.NEWS,
        "action_value": "",
        "sort_order": 30,
    },
    {
        "slug": "tools",
        "title": "Hemophilia Tools",
        "description": "Helpful calculators & guides",
        "body": (
            "Use Injection Logs to review doses, Factor Stock to check supply at your centre, and Emergency ID "
            "to show your diagnosis in an emergency. More calculators can be added here by the website team."
        ),
        "category": ServiceCategory.EDUCATION,
        "icon_set": "ion",
        "icon_name": "bulb-outline",
        "action_type": ServiceAction.CONTENT,
        "action_value": "",
        "sort_order": 40,
    },
    {
        "slug": "community",
        "title": "Community Support",
        "description": "Connect with other patients",
        "body": (
            "Nepal Hemophilia Society chapters bring patients and families together. Ask your province admin "
            "or treatment centre about local peer groups and youth programmes."
        ),
        "category": ServiceCategory.SUPPORT,
        "icon_set": "ion",
        "icon_name": "people-outline",
        "action_type": ServiceAction.CONTENT,
        "action_value": "",
        "sort_order": 10,
    },
    {
        "slug": "programs",
        "title": "Support Programs",
        "description": "NHS assistance programs",
        "body": (
            "NHS may support factor access, education, and humanitarian aid depending on donor supply. "
            "Eligibility is decided by NHS — contact the national office for the current programme list."
        ),
        "category": ServiceCategory.SUPPORT,
        "icon_set": "ion",
        "icon_name": "heart-outline",
        "action_type": ServiceAction.CONTENT,
        "action_value": "",
        "sort_order": 20,
    },
    {
        "slug": "help",
        "title": "Help & Support",
        "description": "Get answers to your questions",
        "body": (
            "For app login issues, ask the staff who created your account. For treatment questions, contact "
            "your primary hospital. For NHS programmes, use the contacts on this page."
        ),
        "category": ServiceCategory.SUPPORT,
        "icon_set": "ion",
        "icon_name": "chatbubbles-outline",
        "action_type": ServiceAction.CONTENT,
        "action_value": "",
        "phone": "01-4443386",
        "email": "info@nsh.org.np",
        "sort_order": 30,
    },
    {
        "slug": "contact",
        "title": "Contact Us",
        "description": "Reach the NHS team",
        "body": "Nepal Hemophilia Society — national office. Update this page from the admin panel when contacts change.",
        "category": ServiceCategory.SUPPORT,
        "icon_set": "ion",
        "icon_name": "call-outline",
        "action_type": ServiceAction.CONTENT,
        "action_value": "",
        "phone": "01-4443386",
        "email": "info@nsh.org.np",
        "address": "Kathmandu, Nepal",
        "website_url": "https://nsh.org.np",
        "sort_order": 40,
    },
    {
        "slug": "downloads",
        "title": "Useful Downloads",
        "description": "Forms, guides & resources",
        "body": "Downloadable forms and guides published by NHS.",
        "category": ServiceCategory.MORE,
        "icon_set": "ion",
        "icon_name": "download-outline",
        "action_type": ServiceAction.RESOURCES,
        "action_value": "",
        "sort_order": 10,
    },
    {
        "slug": "centers",
        "title": "Find Treatment Center",
        "description": "Locate nearby hospitals",
        "body": "Hemophilia treatment centres registered in NHMS.",
        "category": ServiceCategory.MORE,
        "icon_set": "ion",
        "icon_name": "business-outline",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Centers",
        "sort_order": 20,
    },
    {
        "slug": "emergency-id",
        "title": "Emergency ID",
        "description": "Your digital emergency card",
        "body": "Show this card to emergency staff. It uses your verified NHMS profile — no extra data is stored here.",
        "category": ServiceCategory.MORE,
        "icon_set": "ion",
        "icon_name": "id-card-outline",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "EmergencyId",
        "sort_order": 30,
    },
    {
        "slug": "settings",
        "title": "Settings & Preferences",
        "description": "Manage your app settings",
        "body": "Change your password and review how this app uses your account.",
        "category": ServiceCategory.MORE,
        "icon_set": "ion",
        "icon_name": "settings-outline",
        "action_type": ServiceAction.APP_SCREEN,
        "action_value": "Settings",
        "sort_order": 40,
    },
]


DEFAULT_ARTICLES = [
    {
        "kind": ContentKind.NEWS,
        "slug": "world-hemophilia-day",
        "title": "World Hemophilia Day",
        "summary": "Join NHS for awareness activities every 17 April.",
        "body": "World Hemophilia Day highlights access to care. Watch this space for the current year’s programme.",
        "sort_order": 10,
    },
    {
        "kind": ContentKind.EVENT,
        "slug": "family-education-day",
        "title": "Family Education Day",
        "summary": "Infusion and physiotherapy orientation for families.",
        "body": "Dates and venues are announced by NHS. Ask your treatment centre if a session is planned in your province.",
        "location": "Kathmandu",
        "sort_order": 10,
    },
    {
        "kind": ContentKind.RESOURCE,
        "slug": "home-infusion-guide",
        "title": "Home infusion guide",
        "summary": "Basic steps for safe factor infusion at home (education only).",
        "body": "This is not a substitute for training by your haematology team. Always follow the protocol taught at your centre.",
        "sort_order": 10,
    },
    {
        "kind": ContentKind.GALLERY,
        "slug": "nhs-community",
        "title": "NHS community",
        "summary": "Patients, families, and volunteers across Nepal.",
        "body": "Photo captions and albums can be added by the website manager.",
        "sort_order": 10,
    },
]


def seed_cms_defaults(*, update_existing: bool = False):
    now = timezone.now()
    for row in DEFAULT_SERVICES:
        defaults = {k: v for k, v in row.items() if k != "slug"}
        if update_existing:
            AppService.objects.update_or_create(slug=row["slug"], defaults=defaults)
        else:
            AppService.objects.get_or_create(slug=row["slug"], defaults=defaults)

    for row in DEFAULT_ARTICLES:
        defaults = {k: v for k, v in row.items() if k not in ("slug", "kind")}
        if row["kind"] == ContentKind.EVENT and not defaults.get("starts_at"):
            defaults["starts_at"] = now
        if update_existing:
            CmsArticle.objects.update_or_create(kind=row["kind"], slug=row["slug"], defaults=defaults)
        else:
            CmsArticle.objects.get_or_create(kind=row["kind"], slug=row["slug"], defaults=defaults)


def ensure_unique_slug(title: str, *, model, kind: str | None = None) -> str:
    base = slugify(title)[:70] or "item"
    slug = base
    n = 2
    qs = model.objects.all()
    while True:
        exists = qs.filter(slug=slug, kind=kind).exists() if kind else qs.filter(slug=slug).exists()
        if not exists:
            return slug
        slug = f"{base}-{n}"
        n += 1
