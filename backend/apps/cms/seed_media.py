"""Generate CMS images and patient-education PDFs for seed_cms."""

from __future__ import annotations

import os

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from apps.core.demo_media import make_banner_jpeg, make_education_pdf

# Authoritative external references (linked in articles; not re-hosted due to copyright).
EXTERNAL = {
    "wfh_guidelines": "https://guidelines.wfh.org/guidelines/",
    "wfh_prophylaxis_pdf": "https://www1.wfh.org/publications/files/pdf-2093.pdf",
    "wfh_sdm_workbook": "https://www1.wfh.org/publications/files/pdf-2455.pdf",
    "wfh_elearning": "https://elearning.wfh.org/",
    "wfh_hemophilia_day": "https://wfh.org/hemophilia-day/",
    "wfh_youtube": "https://www.youtube.com/@WorldFederationofHemophilia",
    "nhs_nepal": "https://www.nepalhemophilia.org.np/",
    "cdc_hemophilia": "https://www.cdc.gov/hemophilia/about/",
    "who_disabilities": "https://www.who.int/teams/noncommunicable-diseases/disability",
    "whd_2026_short": "https://www.youtube.com/shorts/p4SyGxq-daY",
    "whd_april_short": "https://www.youtube.com/shorts/_OaBPlQ8B_A",
}

PDF_SPECS: dict[str, dict] = {
    "what-is-hemophilia": {
        "title": "Understanding Hemophilia",
        "subtitle": "A plain-language guide for patients and families in Nepal",
        "banner_tag": "Education",
        "sections": [
            {"type": "paragraph", "text": "Hemophilia is an inherited bleeding disorder. The blood does not clot normally because it is missing or low in clotting factor VIII (hemophilia A) or factor IX (hemophilia B)."},
            {"type": "heading", "text": "Key facts"},
            {"type": "bullets", "items": [
                "Hemophilia is usually inherited and affects males more often, though females can carry the gene and sometimes have symptoms.",
                "Severity is based on factor level: severe (<1%), moderate (1–5%), mild (>5%).",
                "Bleeding into joints and muscles is common in severe hemophilia and can cause long-term damage if untreated.",
                "With factor replacement, physiotherapy, and comprehensive care, most people with hemophilia can study, work, and stay active.",
            ]},
            {"type": "table", "headers": ["Type", "Missing factor", "Approx. share"], "rows": [
                ["Hemophilia A", "Factor VIII", "~80–85% of cases"],
                ["Hemophilia B", "Factor IX", "~15–20% of cases"],
            ]},
            {"type": "callout", "text": "This guide is for learning only. Your haematology team decides your diagnosis, dose, and emergency plan."},
            {"type": "links", "items": [
                {"label": "WFH Treatment Guidelines (3rd edition)", "url": EXTERNAL["wfh_guidelines"]},
                {"label": "CDC — About hemophilia", "url": EXTERNAL["cdc_hemophilia"]},
                {"label": "Nepal Hemophilia Society", "url": EXTERNAL["nhs_nepal"]},
            ]},
        ],
    },
    "types-and-severity": {
        "title": "Types & Severity",
        "subtitle": "How factor level guides treatment goals",
        "banner_tag": "Education",
        "sections": [
            {"type": "paragraph", "text": "Doctors classify hemophilia by which clotting factor is low and by baseline factor activity measured in a lab."},
            {"type": "chart", "title": "Typical annual joint bleeds without prophylaxis (illustrative)", "labels": ["Severe", "Moderate", "Mild"], "values": [30, 8, 2]},
            {"type": "table", "headers": ["Severity", "Factor level", "What families often notice"], "rows": [
                ["Severe", "<1%", "Spontaneous joint/muscle bleeds; early prophylaxis usually discussed"],
                ["Moderate", "1–5%", "Bleeds after injury or surgery; may need planned factor"],
                ["Mild", ">5%", "Bleeds mainly with trauma, dental work, or surgery"],
            ]},
            {"type": "bullets", "items": [
                "Keep your severity and deficient factor on your Emergency ID card.",
                "Joint bleeds in knees, elbows, and ankles need prompt treatment — do not wait for swelling to peak.",
            ]},
            {"type": "links", "items": [{"label": "WFH Guidelines — Diagnosis", "url": EXTERNAL["wfh_guidelines"]}]},
        ],
    },
    "recognizing-bleeds": {
        "title": "Recognizing a Bleed",
        "subtitle": "Early signs and when to seek urgent care",
        "banner_tag": "Safety",
        "sections": [
            {"type": "heading", "text": "Joint bleed warning signs"},
            {"type": "bullets", "items": [
                "Warmth, swelling, stiffness, or pain in a joint",
                "Reluctance to use an arm or leg; limping in children",
                "Bleed feels like a 'bubble' inside the joint",
            ]},
            {"type": "heading", "text": "Muscle and soft-tissue bleeds"},
            {"type": "bullets", "items": [
                "Deep ache, tight swelling, bruising, or reduced movement",
                "Large muscle bleeds (thigh, calf, forearm) need medical review",
            ]},
            {"type": "callout", "text": "URGENT: Head, neck, throat, abdominal, or eye bleeds need emergency care immediately. Call your centre and go to hospital."},
            {"type": "table", "headers": ["Situation", "Action"], "rows": [
                ["Minor cut with mild hemophilia", "Pressure + follow centre advice"],
                ["Suspected joint bleed", "Treat per plan; rest, ice, compression, elevation (RICE) as advised"],
                ["Head injury or severe pain", "Emergency department + factor as directed"],
            ]},
        ],
    },
    "home-infusion-guide": {
        "title": "Home Infusion Basics",
        "subtitle": "Checklist after training at your treatment centre",
        "banner_tag": "Skills",
        "sections": [
            {"type": "paragraph", "text": "Home infusion can reduce time lost to hospital visits. You must complete hands-on training with your haemophilia nurse before infusing alone."},
            {"type": "heading", "text": "Before you infuse"},
            {"type": "bullets", "items": [
                "Wash hands; gather factor, diluent, syringes, butterfly/needle, alcohol swabs, sharps box.",
                "Check product name, dose, expiry, and that vials are not cracked or warm if they should be cold.",
                "Use the dose prescribed — never guess from a previous bleed.",
            ]},
            {"type": "heading", "text": "After infusion"},
            {"type": "bullets", "items": [
                "Log the dose in NHMS Injection Logs immediately.",
                "Dispose of needles safely; store leftover supplies correctly.",
                "If bleeding continues or you feel unwell, contact your centre.",
            ]},
            {"type": "callout", "text": "This PDF does not replace centre training. Protocols differ by product and hospital."},
        ],
    },
    "factor-storage-handling": {
        "title": "Factor Storage & Handling",
        "subtitle": "Keep clotting factor safe and effective",
        "banner_tag": "Treatment",
        "sections": [
            {"type": "table", "headers": ["Product type", "Typical storage", "Travel tip"], "rows": [
                ["Most factor VIII/IX concentrate", "Refrigerate 2–8°C; do not freeze", "Use validated cool bag + gel packs"],
                ["Some products", "Room temp allowed for limited days (check label)", "Keep original carton"],
                ["Reconstituted factor", "Use within hours per package insert", "Never save mixed dose for later unless instructed"],
            ]},
            {"type": "bullets", "items": [
                "Label home fridge shelves; keep factor away from freezer vents.",
                "During power cuts, use a cool box and notify your centre if storage was interrupted.",
                "Never use cloudy, expired, or dropped vials.",
            ]},
            {"type": "links", "items": [{"label": "WFH — Hemostatic agents chapter", "url": EXTERNAL["wfh_guidelines"]}]},
        ],
    },
    "prophylaxis-explained": {
        "title": "Prophylaxis Explained",
        "subtitle": "Regular factor to prevent bleeds",
        "banner_tag": "Treatment",
        "sections": [
            {"type": "paragraph", "text": "Prophylaxis means giving clotting factor on a schedule to prevent bleeds before they start. It is the standard goal for many people with severe hemophilia when supply allows."},
            {"type": "chart", "title": "Goal: fewer bleeds over time (example)", "labels": ["On-demand only", "Prophylaxis"], "values": [24, 6]},
            {"type": "bullets", "items": [
                "Starting early helps protect joints in children.",
                "Missed doses raise bleed risk — use app reminders and stock checks.",
                "Your team adjusts dose based on bleed pattern, activity, and factor level targets.",
            ]},
            {"type": "links", "items": [
                {"label": "WFH — What is Prophylaxis? (PDF)", "url": EXTERNAL["wfh_prophylaxis_pdf"]},
                {"label": "WFH eLearning modules", "url": EXTERNAL["wfh_elearning"]},
            ]},
        ],
    },
    "emergency-action-plan": {
        "title": "Emergency Action Plan",
        "subtitle": "Steps for bleeds, injuries, and hospital visits",
        "banner_tag": "Emergency",
        "sections": [
            {"type": "callout", "text": "Carry your Emergency ID. Tell staff: 'I have hemophilia' and show your factor type and severity."},
            {"type": "heading", "text": "At the first sign of a bleed"},
            {"type": "bullets", "items": [
                "Infuse as prescribed or call your centre for dose advice.",
                "Rest the limb; apply ice and compression if your team recommends RICE.",
                "Log the bleed in NHMS when you are safe to do so.",
            ]},
            {"type": "table", "headers": ["Contact", "When to use"], "rows": [
                ["NHS national office", "Programme questions, chapter referrals"],
                ["Your HTC", "Treatment plans, factor orders, bleed advice"],
                ["Local emergency", "Head/neck bleeds, major trauma, airway concerns"],
            ]},
            {"type": "paragraph", "text": "NHS office: 01-4443386 | info@nsh.org.np (update in admin if numbers change)."},
        ],
    },
    "physiotherapy-joints": {
        "title": "Joint Care & Physiotherapy",
        "subtitle": "Protect mobility after joint bleeds",
        "banner_tag": "Rehab",
        "sections": [
            {"type": "paragraph", "text": "Repeated joint bleeds can lead to chronic pain and limited movement. Physiotherapy helps recovery and long-term function."},
            {"type": "bullets", "items": [
                "After a bleed: follow staged return to movement — your physio sets timelines.",
                "Strengthen muscles around vulnerable joints (knees, elbows, ankles).",
                "Low-impact sports (e.g. swimming, cycling) are often encouraged; contact sports need centre approval.",
                "Never 'walk off' a hot swollen joint — treat first.",
            ]},
            {"type": "links", "items": [{"label": "WFH Guidelines — Musculoskeletal care", "url": EXTERNAL["wfh_guidelines"]}]},
        ],
    },
    "dental-surgery-prep": {
        "title": "Dental & Surgery Planning",
        "subtitle": "Coordinate factor cover with your team",
        "banner_tag": "Planning",
        "sections": [
            {"type": "paragraph", "text": "Dentists and surgeons must plan with your haemophilia centre. Never hide your diagnosis."},
            {"type": "table", "headers": ["Procedure", "Typical planning"], "rows": [
                ["Dental cleaning", "May need factor boost — book via HTC"],
                ["Tooth extraction", "Factor plan + antifibrinolytic as prescribed"],
                ["Major surgery", "Inpatient plan, factor levels, inhibitor check"],
            ]},
            {"type": "callout", "text": "Give providers your Emergency ID and centre phone number before any procedure."},
        ],
    },
    "travel-with-hemophilia": {
        "title": "Travel with Hemophilia",
        "subtitle": "Factor supply, documents, and insurance",
        "banner_tag": "Lifestyle",
        "sections": [
            {"type": "bullets", "items": [
                "Carry double factor supply plus prescription letters in English and Nepali if possible.",
                "Store factor in a medical cool bag; keep some in hand luggage.",
                "List nearest HTCs along your route; NHS can advise for South Asia travel.",
                "Wear medical ID and share your plan with travel companions.",
            ]},
            {"type": "links", "items": [{"label": "WFH Global Treatment Centre search", "url": "https://wfh.org/gthc/"}]},
        ],
    },
    "parents-caregivers-guide": {
        "title": "Guide for Parents & Caregivers",
        "subtitle": "School, play, and emotional support",
        "banner_tag": "Family",
        "sections": [
            {"type": "bullets", "items": [
                "Share a written school plan: who to call, when to treat, and activity limits.",
                "Teach age-appropriate self-awareness — pain is a signal, not weakness.",
                "Youth camps and parent circles run by NHS chapters reduce isolation.",
                "Track injections and bleeds in NHMS so clinic visits are data-driven.",
            ]},
            {"type": "links", "items": [
                {"label": "WFH Shared Decision Making Workbook", "url": EXTERNAL["wfh_sdm_workbook"]},
                {"label": "Nepal Hemophilia Society programmes", "url": EXTERNAL["nhs_nepal"]},
            ]},
        ],
    },
    "nhs-programme-overview": {
        "title": "NHS Support Programmes",
        "subtitle": "How national programmes help registered patients",
        "banner_tag": "Support",
        "sections": [
            {"type": "paragraph", "text": "Nepal Hemophilia Society (NHS) coordinates advocacy, education, humanitarian factor support, and chapter activities across Nepal."},
            {"type": "bullets", "items": [
                "Chapter networks in Kathmandu, Pokhara, Chitwan, Biratnagar, and other regions.",
                "Scholarship and livelihood support via international partners (availability varies yearly).",
                "Blood donation drives coordinated with mothers' committees.",
                "Youth camps, parents' circles, and medical professional outreach.",
            ]},
            {"type": "links", "items": [
                {"label": "NHS official website", "url": EXTERNAL["nhs_nepal"]},
                {"label": "WFH Humanitarian Aid — Nepal story", "url": "https://wfh.org/article/the-wfh-humanitarian-aid-program-supports-nmo-in-nepal/"},
            ]},
        ],
    },
    "emergency-contact-card": {
        "title": "Emergency Contact Card",
        "subtitle": "Printable summary for wallet or school bag",
        "banner_tag": "Download",
        "sections": [
            {"type": "table", "headers": ["Field", "Your details (fill in)"], "rows": [
                ["Name / Patient ID", ""],
                ["Diagnosis (A/B) & severity", ""],
                ["Primary HTC phone", ""],
                ["NHS hotline", "01-4443386"],
            ]},
            {"type": "callout", "text": "Also use the in-app Emergency ID screen — it pulls live data from your NHMS profile."},
        ],
    },
}

GALLERY_BANNERS = {
    "nhs-community": ("NHS Community", "Patients, families, and volunteers united across Nepal"),
    "whd-awareness-walk": ("World Hemophilia Day Walk", "Raising awareness every 17 April"),
    "youth-camp-2026": ("Youth Camp 2026", "Skills, friendship, and confidence building"),
    "infusion-training": ("Home Infusion Training", "Hands-on learning with haemophilia nurses"),
    "chapter-pokhara": ("Pokhara Chapter Meet-up", "Regional peer support in Gandaki"),
    "mothers-blood-drive": ("Mothers Committee Blood Drive", "Supporting safe blood supply for Nepal"),
    "family-education-day": ("Family Education Day", "Parents and children learning together"),
}


def public_media_url(storage_path: str) -> str:
    """Build an absolute URL patients can open from the mobile app."""
    relative = default_storage.url(storage_path).lstrip("/")
    base = os.getenv("PUBLIC_API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
    media_prefix = settings.MEDIA_URL.lstrip("/")
    if relative.startswith("http://") or relative.startswith("https://"):
        return relative
    if relative.startswith(media_prefix):
        return f"{base}/{relative}"
    return f"{base}/{media_prefix}{relative}"


def _save_bytes(path: str, data: bytes) -> str:
    if default_storage.exists(path):
        default_storage.delete(path)
    saved = default_storage.save(path, ContentFile(data))
    return public_media_url(saved)


def seed_cms_media_files() -> dict[str, dict[str, str]]:
    """Write CMS media files and return {slug: {image_url, file_url}}."""
    urls: dict[str, dict[str, str]] = {}

    for slug, spec in PDF_SPECS.items():
        pdf_bytes = make_education_pdf(spec["title"], spec["subtitle"], spec["sections"])
        banner_bytes = make_banner_jpeg(spec["title"], spec["subtitle"], spec.get("banner_tag", "NHS Guide"))
        urls[slug] = {
            "file_url": _save_bytes(f"cms/resources/{slug}.pdf", pdf_bytes),
            "image_url": _save_bytes(f"cms/gallery/{slug}-cover.jpg", banner_bytes),
        }

    for slug, (title, subtitle) in GALLERY_BANNERS.items():
        banner_bytes = make_banner_jpeg(title, subtitle, "NHS Gallery")
        urls[slug] = {
            "image_url": _save_bytes(f"cms/gallery/{slug}.jpg", banner_bytes),
        }

    return urls
