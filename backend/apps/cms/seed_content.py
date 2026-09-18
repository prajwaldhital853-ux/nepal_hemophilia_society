"""Rich CMS article definitions and enriched service copy."""

from datetime import timedelta

from django.utils import timezone

from apps.cms.models import ContentKind
from apps.cms.seed_media import EXTERNAL

NOW = timezone.now()


def _m(slug: str, media: dict, key: str) -> str:
    return media.get(slug, {}).get(key, "")


def build_default_articles(media: dict) -> list[dict]:
    """Return article rows for seed_cms_defaults."""
    return [
        # --- NEWS / Campaigns ---
        {
            "kind": ContentKind.NEWS,
            "slug": "world-hemophilia-day",
            "title": "World Hemophilia Day 2026 — Access for All",
            "summary": "17 April: global awareness for diagnosis, treatment access, and community solidarity.",
            "body": (
                "World Hemophilia Day is observed every 17 April. The World Federation of Hemophilia (WFH) "
                "leads campaigns for earlier diagnosis, safe factor access, and inclusion of people with bleeding disorders.\n\n"
                "In Nepal, NHS chapters organise walks, media programmes, and hospital outreach. Patients can wear red "
                "and share their stories to reduce stigma.\n\n"
                "Official theme and toolkit: wfh.org/hemophilia-day\n"
                "Watch: short awareness video linked below."
            ),
            "image_url": _m("whd-awareness-walk", media, "image_url"),
            "file_url": EXTERNAL["whd_2026_short"],
            "sort_order": 10,
        },
        {
            "kind": ContentKind.NEWS,
            "slug": "hemophilia-recognized-disability-nepal",
            "title": "Hemophilia recognised as a disability in Nepal",
            "summary": "Legal recognition strengthens advocacy for treatment access and social support.",
            "body": (
                "In 2017 hemophilia was recognised under Nepal's disability rights framework. This helps NHS "
                "advocate for factor procurement, rehabilitation services, and inclusion in national health planning.\n\n"
                "Patients should keep disability registration documents updated with their chapter. "
                "NHS continues to work with the National Federation of Disabled Nepal (NFDN) on provincial budgets."
            ),
            "image_url": _m("nhs-community", media, "image_url"),
            "file_url": "https://wfh.org/article/wfh-humanitarian-aid-program-supports-nepalese-nmo-advocacy/",
            "sort_order": 20,
        },
        {
            "kind": ContentKind.NEWS,
            "slug": "wfh-humanitarian-aid-nepal",
            "title": "WFH Humanitarian Aid supports NHS programmes",
            "summary": "International factor donations and training help bridge treatment gaps.",
            "body": (
                "The WFH Humanitarian Aid Program has supplied factor concentrates and supported NHS advocacy "
                "for treatment centres, coagulation testing, and patient education.\n\n"
                "Factor supply still depends on national budgets and donations — always confirm current "
                "availability with NHS and your treatment centre before travel or surgery."
            ),
            "image_url": _m("infusion-training", media, "image_url"),
            "file_url": "https://wfh.org/article/the-wfh-humanitarian-aid-program-supports-nmo-in-nepal/",
            "sort_order": 30,
        },
        {
            "kind": ContentKind.NEWS,
            "slug": "blood-donation-drive-2026",
            "title": "NHS Mothers Committee — blood donation drive",
            "summary": "Twice-yearly drives support Nepal's safe blood supply.",
            "body": (
                "The NHS Mothers Committee coordinates blood donation programmes with Blood Donors Association Nepal (BLODAN) "
                "and transfusion centres. Safe blood is essential when cryoprecipitate or plasma products are needed.\n\n"
                "Contact NHS at 01-4443386 for the next drive date in Kathmandu."
            ),
            "image_url": _m("mothers-blood-drive", media, "image_url"),
            "sort_order": 40,
        },
        {
            "kind": ContentKind.NEWS,
            "slug": "shared-decision-making-launch",
            "title": "New: Shared decision-making resources for families",
            "summary": "WFH workbook helps patients discuss treatment options with their team.",
            "body": (
                "Choosing between prophylaxis schedules, on-demand treatment, or newer therapies requires good information. "
                "The WFH Shared Decision Making Workbook (2025 update) guides conversations with your haematologist.\n\n"
                "Download the official PDF from the link below or ask your centre for a printed copy."
            ),
            "file_url": EXTERNAL["wfh_sdm_workbook"],
            "sort_order": 50,
        },
        # --- EVENTS ---
        {
            "kind": ContentKind.EVENT,
            "slug": "family-education-day",
            "title": "Family Education Day — Kathmandu",
            "summary": "Infusion demo, physiotherapy tips, and Q&A with HTC staff.",
            "body": (
                "A full-day orientation for parents and young patients. Topics include recognising bleeds, "
                "storage of factor, school plans, and using the NHMS patient app.\n\n"
                "Registration: contact NHS or your primary treatment centre. Bring your treatment notebook."
            ),
            "location": "Bir Hospital Hemophilia Clinic, Kathmandu",
            "starts_at": NOW + timedelta(days=21),
            "ends_at": NOW + timedelta(days=21, hours=6),
            "image_url": _m("family-education-day", media, "image_url"),
            "sort_order": 10,
        },
        {
            "kind": ContentKind.EVENT,
            "slug": "home-infusion-workshop",
            "title": "Home Infusion Skills Workshop",
            "summary": "Supervised practice for patients approved for home treatment.",
            "body": (
                "Nurses demonstrate reconstitution, vein care, and documentation. Attendance is by referral only "
                "after your haematologist approves home therapy.\n\n"
                "Download the NHS home infusion checklist (PDF) before attending."
            ),
            "location": "Kathmandu Hemophilia Treatment Centre",
            "starts_at": NOW + timedelta(days=35),
            "ends_at": NOW + timedelta(days=35, hours=4),
            "image_url": _m("infusion-training", media, "image_url"),
            "file_url": _m("home-infusion-guide", media, "file_url"),
            "sort_order": 20,
        },
        {
            "kind": ContentKind.EVENT,
            "slug": "youth-camp-2026",
            "title": "National Youth Camp 2026",
            "summary": "Peer support, career talks, and adaptive sports for teens with hemophilia.",
            "body": (
                "Open to registered NHS youth members aged 14–22. Activities include team building, "
                "physiotherapy sessions, and sessions on treatment adherence.\n\n"
                "Scholarship seats may be available via partner NGOs — enquire with NHS."
            ),
            "location": "Dhulikhel Retreat Centre",
            "starts_at": NOW + timedelta(days=60),
            "ends_at": NOW + timedelta(days=63),
            "image_url": _m("youth-camp-2026", media, "image_url"),
            "sort_order": 30,
        },
        {
            "kind": ContentKind.EVENT,
            "slug": "parents-support-circle",
            "title": "Parents Support Circle — monthly",
            "summary": "Facilitated sharing for caregivers of children with severe hemophilia.",
            "body": (
                "Held on the first Saturday of each month at the NHS office. Topics rotate: school inclusion, "
                "mental health, factor stock updates, and travel planning.\n\n"
                "Tea and Nepali-language materials provided."
            ),
            "location": "NHS Office, Kathmandu",
            "starts_at": NOW + timedelta(days=7),
            "ends_at": NOW + timedelta(days=7, hours=2),
            "image_url": _m("nhs-community", media, "image_url"),
            "sort_order": 40,
        },
        {
            "kind": ContentKind.EVENT,
            "slug": "physiotherapy-clinic-day",
            "title": "Joint Clinic & Physiotherapy Day",
            "summary": "Free joint assessment slots with haemophilia physiotherapists.",
            "body": (
                "Book if you have had recurrent knee, elbow, or ankle bleeds. Physios teach strengthening "
                "exercises and discuss return-to-sport timelines.\n\n"
                "Bring recent bleed logs from the NHMS app."
            ),
            "location": "Bir Hospital",
            "starts_at": NOW + timedelta(days=14),
            "ends_at": NOW + timedelta(days=14, hours=5),
            "sort_order": 50,
        },
        {
            "kind": ContentKind.EVENT,
            "slug": "world-hemophilia-day-walk",
            "title": "World Hemophilia Day Awareness Walk",
            "summary": "Kathmandu walk and red-light monument lighting.",
            "body": (
                "Join patients, families, and staff for a short awareness walk ending at a brief programme "
                "with speeches and media interaction. Wear red or your NHS T-shirt.\n\n"
                "Video: WFH #WHD2026 short on YouTube (link below)."
            ),
            "location": "Maitighar Mandala, Kathmandu",
            "starts_at": timezone.datetime(2026, 4, 17, 7, 0, tzinfo=NOW.tzinfo),
            "ends_at": timezone.datetime(2026, 4, 17, 10, 0, tzinfo=NOW.tzinfo),
            "image_url": _m("whd-awareness-walk", media, "image_url"),
            "file_url": EXTERNAL["whd_april_short"],
            "sort_order": 60,
        },
        {
            "kind": ContentKind.EVENT,
            "slug": "pokhara-chapter-meetup",
            "title": "Pokhara Chapter — quarterly meet-up",
            "summary": "Regional patients share updates on factor access in Gandaki province.",
            "body": (
                "Meet fellow patients from Kaski and surrounding districts. NHS central team often joins "
                "to answer programme questions.\n\n"
                "Contact the Pokhara chapter coordinator via NHS office."
            ),
            "location": "Pokhara Hemophilia Society Chapter",
            "starts_at": NOW + timedelta(days=45),
            "ends_at": NOW + timedelta(days=45, hours=3),
            "image_url": _m("chapter-pokhara", media, "image_url"),
            "sort_order": 70,
        },
        # --- RESOURCES (education PDFs + external links) ---
        {
            "kind": ContentKind.RESOURCE,
            "slug": "what-is-hemophilia",
            "title": "Understanding Hemophilia",
            "summary": "Types, inheritance, and what comprehensive care means in Nepal.",
            "body": (
                "A readable NHS guide with tables and links to WFH and CDC references. "
                "Ideal for newly diagnosed families and school teachers."
            ),
            "image_url": _m("what-is-hemophilia", media, "image_url"),
            "file_url": _m("what-is-hemophilia", media, "file_url"),
            "sort_order": 10,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "types-and-severity",
            "title": "Types & Severity",
            "summary": "Factor levels, bleed risk, and treatment goals explained simply.",
            "body": "Includes a chart comparing typical bleed frequency by severity (illustrative education only).",
            "image_url": _m("types-and-severity", media, "image_url"),
            "file_url": _m("types-and-severity", media, "file_url"),
            "sort_order": 20,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "recognizing-bleeds",
            "title": "Recognizing a Bleed",
            "summary": "Joint, muscle, and emergency warning signs.",
            "body": "When to treat at home versus when to go to hospital immediately.",
            "image_url": _m("recognizing-bleeds", media, "image_url"),
            "file_url": _m("recognizing-bleeds", media, "file_url"),
            "sort_order": 30,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "home-infusion-guide",
            "title": "Home Infusion Guide",
            "summary": "Checklist for patients trained by their HTC.",
            "body": "Step-by-step reminders — always follow your centre protocol and product insert.",
            "image_url": _m("home-infusion-guide", media, "image_url"),
            "file_url": _m("home-infusion-guide", media, "file_url"),
            "sort_order": 40,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "factor-storage-handling",
            "title": "Factor Storage & Handling",
            "summary": "Fridge rules, travel kits, and power-cut planning.",
            "body": "Keep factor effective and safe during Nepal's summer heat and load-shedding.",
            "image_url": _m("factor-storage-handling", media, "image_url"),
            "file_url": _m("factor-storage-handling", media, "file_url"),
            "sort_order": 50,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "prophylaxis-explained",
            "title": "Prophylaxis Explained",
            "summary": "Why regular factor prevents joint damage.",
            "body": "Links to the official WFH 'What is Prophylaxis?' PDF for deeper reading.",
            "image_url": _m("prophylaxis-explained", media, "image_url"),
            "file_url": _m("prophylaxis-explained", media, "file_url"),
            "sort_order": 60,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "emergency-action-plan",
            "title": "Emergency Action Plan",
            "summary": "Wallet card and bleed steps for school, work, and travel.",
            "body": "Use alongside the in-app Emergency ID screen.",
            "image_url": _m("emergency-action-plan", media, "image_url"),
            "file_url": _m("emergency-action-plan", media, "file_url"),
            "sort_order": 70,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "physiotherapy-joints",
            "title": "Joint Care & Physiotherapy",
            "summary": "Recovery after bleeds and safe exercise choices.",
            "body": "Discuss any sport or gym programme with your haemophilia physiotherapist first.",
            "image_url": _m("physiotherapy-joints", media, "image_url"),
            "file_url": _m("physiotherapy-joints", media, "file_url"),
            "sort_order": 80,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "dental-surgery-prep",
            "title": "Dental & Surgery Planning",
            "summary": "How to coordinate factor cover with dentists and surgeons.",
            "body": "Never schedule procedures without your HTC involved in the plan.",
            "image_url": _m("dental-surgery-prep", media, "image_url"),
            "file_url": _m("dental-surgery-prep", media, "file_url"),
            "sort_order": 90,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "travel-with-hemophilia",
            "title": "Travel with Hemophilia",
            "summary": "Documents, cool bags, and finding centres abroad.",
            "body": "Includes link to the WFH Global Treatment Centre directory.",
            "image_url": _m("travel-with-hemophilia", media, "image_url"),
            "file_url": _m("travel-with-hemophilia", media, "file_url"),
            "sort_order": 100,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "parents-caregivers-guide",
            "title": "Guide for Parents & Caregivers",
            "summary": "School plans, emotional support, and shared decision-making.",
            "body": "Pair with the WFH Shared Decision Making Workbook for treatment conversations.",
            "image_url": _m("parents-caregivers-guide", media, "image_url"),
            "file_url": _m("parents-caregivers-guide", media, "file_url"),
            "sort_order": 110,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "wfh-guidelines-overview",
            "title": "WFH Treatment Guidelines (official)",
            "summary": "Global standard of care — free online and PDF download.",
            "body": (
                "The World Federation of Hemophilia 3rd edition guidelines cover diagnosis, prophylaxis, "
                "inhibitors, musculoskeletal care, and comprehensive care models.\n\n"
                "Open the official site for PDFs in English, Nepali community translations may be available via NHS."
            ),
            "file_url": EXTERNAL["wfh_guidelines"],
            "sort_order": 120,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "wfh-elearning-modules",
            "title": "WFH eLearning — illustrated modules",
            "summary": "Free interactive lessons with quizzes and videos.",
            "body": "Modules include prophylaxis, joint health, and treatment basics in plain language.",
            "file_url": EXTERNAL["wfh_elearning"],
            "sort_order": 130,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "nhs-programme-overview",
            "title": "NHS Support Programmes (PDF)",
            "summary": "Chapters, scholarships, and humanitarian support overview.",
            "body": "Editable national overview — update yearly from the admin panel.",
            "image_url": _m("nhs-programme-overview", media, "image_url"),
            "file_url": _m("nhs-programme-overview", media, "file_url"),
            "sort_order": 140,
        },
        {
            "kind": ContentKind.RESOURCE,
            "slug": "emergency-contact-card",
            "title": "Emergency Contact Card (printable)",
            "summary": "Fill-in card for wallet or school bag.",
            "body": "Also available digitally in the NHMS Emergency ID screen.",
            "image_url": _m("emergency-contact-card", media, "image_url"),
            "file_url": _m("emergency-contact-card", media, "file_url"),
            "sort_order": 150,
        },
        # --- GALLERY ---
        {
            "kind": ContentKind.GALLERY,
            "slug": "nhs-community",
            "title": "NHS Community Across Nepal",
            "summary": "Patients, families, and chapter volunteers.",
            "body": (
                "Nepal Hemophilia Society brings together people with hemophilia from Kathmandu, Pokhara, "
                "Chitwan, Biratnagar, and other regions for education and advocacy."
            ),
            "image_url": _m("nhs-community", media, "image_url"),
            "sort_order": 10,
        },
        {
            "kind": ContentKind.GALLERY,
            "slug": "whd-awareness-walk",
            "title": "World Hemophilia Day Walk",
            "summary": "Raising public awareness in Kathmandu.",
            "body": "Annual walk and programme every 17 April. Wear red to show solidarity.",
            "image_url": _m("whd-awareness-walk", media, "image_url"),
            "file_url": EXTERNAL["whd_2026_short"],
            "sort_order": 20,
        },
        {
            "kind": ContentKind.GALLERY,
            "slug": "youth-camp-2026",
            "title": "Youth Camp 2026",
            "summary": "Teens building confidence and treatment skills.",
            "body": "Sports, group discussions, and nurse-led infusion refreshers.",
            "image_url": _m("youth-camp-2026", media, "image_url"),
            "sort_order": 30,
        },
        {
            "kind": ContentKind.GALLERY,
            "slug": "infusion-training",
            "title": "Infusion Training Session",
            "summary": "Learning safe venipuncture with supervision.",
            "body": "Only start home therapy after your centre certifies you.",
            "image_url": _m("infusion-training", media, "image_url"),
            "sort_order": 40,
        },
        {
            "kind": ContentKind.GALLERY,
            "slug": "chapter-pokhara",
            "title": "Pokhara Chapter Meeting",
            "summary": "Gandaki province peer support.",
            "body": "Regional chapters help patients far from Kathmandu access information and factor updates.",
            "image_url": _m("chapter-pokhara", media, "image_url"),
            "sort_order": 50,
        },
        {
            "kind": ContentKind.GALLERY,
            "slug": "mothers-blood-drive",
            "title": "Mothers Committee Blood Drive",
            "summary": "Supporting Nepal's blood supply.",
            "body": "Twice-yearly drives in coordination with BLODAN and transfusion services.",
            "image_url": _m("mothers-blood-drive", media, "image_url"),
            "sort_order": 60,
        },
        {
            "kind": ContentKind.GALLERY,
            "slug": "family-education-day",
            "title": "Family Education Day",
            "summary": "Parents and children learning together.",
            "body": "Hands-on stations for factor storage, bleed recognition, and app use.",
            "image_url": _m("family-education-day", media, "image_url"),
            "sort_order": 70,
        },
        # --- INSIGHT tips (unchanged intent, slightly richer) ---
        {
            "kind": ContentKind.INSIGHT,
            "slug": "reading-your-charts",
            "title": "How to read your charts",
            "summary": "Bars show how often something happened that month. Compare red bleed bars with factor bars.",
            "body": (
                "A quiet bleed month with regular prophylaxis usually means treatment is working. "
                "A spike in bleeds with fewer injections is a signal to call your centre. Charts never replace a clinical visit."
            ),
            "sort_order": 10,
        },
        {
            "kind": ContentKind.INSIGHT,
            "slug": "when-to-call-your-centre",
            "title": "When to call your centre",
            "summary": "Head, neck, or abdominal bleeds, or a joint that will not settle, need urgent care.",
            "body": (
                "Use Emergency Support in the app for NHS numbers. Carry your Emergency ID. "
                "Do not wait if a bleed is worsening after treatment."
            ),
            "sort_order": 20,
        },
        {
            "kind": ContentKind.INSIGHT,
            "slug": "prophylaxis-vs-on-demand",
            "title": "Prophylaxis vs on-demand",
            "summary": "Regular prophylaxis aims to prevent bleeds. On-demand treats a bleed after it starts.",
            "body": (
                "Your prescribed plan is on your profile. If your injection count drops while bleeds rise, "
                "ask your team whether the plan still fits."
            ),
            "sort_order": 30,
        },
    ]


ENRICHED_SERVICE_BODIES = {
    "resources": (
        "Browse NHS patient guides (PDF), WFH official links, and videos. Each item opens with a summary; "
        "tap Open download for the PDF or external resource.\n\n"
        "Topics include: understanding hemophilia, prophylaxis, home infusion, emergency planning, travel, "
        "dental/surgery prep, and parent support. All PDFs use simple language, tables, and charts — edit any "
        "article from the admin panel under Website → Resources."
    ),
    "training": (
        "NHS and partner treatment centres run structured learning:\n\n"
        "• Home infusion workshops (referral only)\n"
        "• Family education days for new diagnoses\n"
        "• Physiotherapy joint clinics\n"
        "• Youth camps for teens\n\n"
        "See Upcoming Events for dates. Video: WFH eLearning offers free illustrated modules at elearning.wfh.org"
    ),
    "campaigns": (
        "Awareness news from NHS and the global bleeding disorders community. World Hemophilia Day (17 April) "
        "is the flagship campaign — local walks, media, and hospital programmes.\n\n"
        "Articles include official WFH video links and Nepal advocacy updates you can edit before publishing."
    ),
    "tools": (
        "Built-in NHMS tools:\n\n"
        "• Injection Logs — review doses and trends\n"
        "• My Health Insights — charts from your records\n"
        "• Factor Stock — supply at your centre\n"
        "• Emergency ID — show diagnosis to staff\n"
        "• Bleeding History — episodes recorded by your team\n\n"
        "Educational PDF calculators and checklists are under Useful Downloads."
    ),
    "community": (
        "You are not alone. Nepal Hemophilia Society chapters connect patients and families:\n\n"
        "• Kathmandu (national office)\n"
        "• Pokhara / Kaski\n"
        "• Chitwan, Parsa, Sunsari, and more\n\n"
        "Monthly parents' circles, youth camps, and WhatsApp groups (ask your coordinator) help share practical "
        "advice. Photo gallery shows recent events."
    ),
    "programs": (
        "NHS programmes (availability varies by year and donor supply):\n\n"
        "• Humanitarian factor support via WFH\n"
        "• Scholarships through MyRight and Save One Life partners\n"
        "• Skill training for young adults\n"
        "• Blood donation drives with mothers' committees\n"
        "• Advocacy for government factor budgets\n\n"
        "Contact info@nsh.org.np or 01-4443386 for current eligibility. Download the programme overview PDF "
        "under Useful Downloads."
    ),
    "help": (
        "Common questions:\n\n"
        "App login — ask the staff who registered your NHMS account.\n"
        "Treatment or dose — call your haemophilia treatment centre, not the app helpdesk.\n"
        "Factor supply — check Factor Stock in the app, then confirm with your centre.\n"
        "NHS programmes — see Support Programs or call the national office.\n\n"
        "Educational resources cannot replace emergency care. For active bleeding, use Emergency Support."
    ),
    "contact": (
        "Nepal Hemophilia Society (National Hemophilia Society)\n\n"
        "Vision: Comprehensive care of hemophilia for living a life with dignity.\n\n"
        "The national office coordinates chapters, patient registration, education materials, and advocacy "
        "with the World Federation of Hemophilia. Update phone, email, and address here when office details change.\n\n"
        "Website: https://www.nepalhemophilia.org.np/"
    ),
    "downloads": (
        "Printable NHS guides (PDF) with professional layout — headings, bullet lists, tables, and charts. "
        "Includes emergency card, home infusion checklist, travel tips, and programme overview.\n\n"
        "External official PDFs (WFH prophylaxis handbook, shared decision-making workbook) are linked "
        "without re-hosting. Tap any item to open."
    ),
    "emergency-support": (
        "If you are bleeding and need urgent care:\n\n"
        "1. Infuse as prescribed OR call your centre for dose advice.\n"
        "2. Go to the nearest hemophilia treatment centre or emergency department.\n"
        "3. Show your Emergency ID — state your factor type and severity.\n"
        "4. Head, neck, throat, or abdominal bleeds need emergency care immediately.\n\n"
        "NHS national office can help locate services. Numbers below are editable by admin staff."
    ),
}
