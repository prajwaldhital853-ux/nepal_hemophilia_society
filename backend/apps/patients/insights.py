"""Aggregated health insights for the patient app Services / Analytics screens."""

from __future__ import annotations

from collections import Counter
from datetime import date, timedelta

from django.utils import timezone

from apps.cms.models import AppService, CmsArticle, ContentKind
from apps.injections.models import InjectionRecord, InjectionStatus
from apps.patients.models import BleedingEpisode, InhibitorStatus
from apps.treatments.models import TreatmentRecord, TreatmentStatus

MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _month_key(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


def _last_n_months(today: date, n: int = 12) -> list[tuple[int, int]]:
    months = []
    year, month = today.year, today.month
    for _ in range(n):
        months.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()
    return months


def _pct_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return 100.0 if current else 0.0
    return round((current - previous) / previous * 100, 1)


def _dose(value) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def build_patient_insights(patient) -> dict:
    today = timezone.localdate()
    now = timezone.now()
    months = _last_n_months(today, 12)
    start = date(months[0][0], months[0][1], 1)
    this_month_start = date(today.year, today.month, 1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = date(last_month_end.year, last_month_end.month, 1)
    prev_year_start = date(today.year - 1, 1, 1)
    prev_year_end = date(today.year - 1, 12, 31)
    year_start = date(today.year, 1, 1)
    day_30 = today - timedelta(days=30)

    injections = list(
        InjectionRecord.objects.filter(patient=patient, is_void=False, administered_at__date__gte=start).select_related(
            "hospital", "factor_medicine"
        )
    )
    bleeds = list(BleedingEpisode.objects.filter(patient=patient, episode_date__gte=start))
    treatments = list(TreatmentRecord.objects.filter(patient=patient, treatment_date__gte=start))

    completed = [row for row in injections if row.status == InjectionStatus.COMPLETED]
    scheduled = [row for row in injections if row.status in (InjectionStatus.SCHEDULED, InjectionStatus.PENDING)]

    inj_by_month: Counter[str] = Counter()
    iu_by_month: Counter[str] = Counter()
    bleed_by_month: Counter[str] = Counter()
    treat_by_month: Counter[str] = Counter()
    sites: Counter[str] = Counter()
    indications: Counter[str] = Counter()

    for row in completed:
        key = _month_key(row.administered_at.year, row.administered_at.month)
        inj_by_month[key] += 1
        iu_by_month[key] += _dose(row.dose)
        indications[row.indication or "Other"] += 1

    for row in bleeds:
        key = _month_key(row.episode_date.year, row.episode_date.month)
        bleed_by_month[key] += 1
        sites[(row.site or "Unspecified").strip() or "Unspecified"] += 1

    for row in treatments:
        if row.status == TreatmentStatus.CANCELLED:
            continue
        key = _month_key(row.treatment_date.year, row.treatment_date.month)
        treat_by_month[key] += 1

    monthly_injections = [inj_by_month[_month_key(y, m)] for y, m in months]
    monthly_iu = [round(iu_by_month[_month_key(y, m)], 1) for y, m in months]
    monthly_bleeds = [bleed_by_month[_month_key(y, m)] for y, m in months]
    monthly_treatments = [treat_by_month[_month_key(y, m)] for y, m in months]
    month_labels = [MONTH_LABELS[m - 1] for _, m in months]

    def in_range(d: date, start_d: date, end_d: date) -> bool:
        return start_d <= d <= end_d

    this_m_inj = inj_by_month[_month_key(today.year, today.month)]
    this_m_bleed = bleed_by_month[_month_key(today.year, today.month)]
    this_m_iu = iu_by_month[_month_key(today.year, today.month)]
    last_m_inj = inj_by_month[_month_key(last_month_start.year, last_month_start.month)]
    last_m_bleed = bleed_by_month[_month_key(last_month_start.year, last_month_start.month)]
    last_m_iu = iu_by_month[_month_key(last_month_start.year, last_month_start.month)]

    this_year_inj = sum(
        1 for row in completed if in_range(row.administered_at.date(), year_start, today)
    )
    last_year_inj = sum(
        1 for row in completed if in_range(row.administered_at.date(), prev_year_start, prev_year_end)
    )
    this_year_bleed = sum(1 for row in bleeds if in_range(row.episode_date, year_start, today))
    last_year_bleed = sum(1 for row in bleeds if in_range(row.episode_date, prev_year_start, prev_year_end))

    last_bleed = max((row.episode_date for row in bleeds), default=None)
    last_injection = max((row.administered_at for row in completed), default=None)
    next_scheduled = min((row.administered_at for row in scheduled if row.administered_at >= now), default=None)

    bleeds_30 = sum(1 for row in bleeds if row.episode_date >= day_30)
    injections_30 = sum(1 for row in completed if row.administered_at.date() >= day_30)
    days_since_bleed = (today - last_bleed).days if last_bleed else None
    days_since_injection = (now - last_injection).days if last_injection else None

    score = 74
    if patient.severity == "Severe":
        score -= 8
    elif patient.severity == "Moderate":
        score -= 3
    if getattr(patient, "inhibitor_status", "") == InhibitorStatus.CURRENT:
        score -= 18
    elif getattr(patient, "inhibitor_status", "") == InhibitorStatus.PAST:
        score -= 6
    score -= min(28, bleeds_30 * 8)
    plan = getattr(patient, "treatment_plan", "") or ""
    if "Prophylaxis" in plan and injections_30 >= 2:
        score += 10
    if days_since_injection is not None and days_since_injection > 40 and patient.severity == "Severe":
        score -= 10
    if bleeds_30 == 0 and this_year_inj > 0:
        score += 6
    score = max(12, min(96, score))
    if score >= 75:
        status_label = "Stable"
        tone = "good"
        summary = "Your recent records look steady. Keep prophylaxis or on-demand treatment as advised by your centre."
    elif score >= 52:
        status_label = "Watch closely"
        tone = "watch"
        summary = "Bleeds or missed injections may be rising. Compare this month with last month and talk to your treatment centre."
    else:
        status_label = "Needs extra care"
        tone = "alert"
        summary = "Recent bleeds or gaps in factor use stand out. Contact your centre if pain, swelling, or a new bleed continues."

    guidance = []
    service = AppService.objects.filter(slug="analytics", published=True).first()
    if service and (service.body or service.description):
        guidance.append(
            {
                "title": service.title,
                "summary": service.description,
                "body": service.body,
                "source": "service",
            }
        )
    for article in CmsArticle.objects.filter(kind=ContentKind.INSIGHT, published=True).order_by("sort_order", "title")[:6]:
        guidance.append(
            {
                "title": article.title,
                "summary": article.summary,
                "body": article.body,
                "slug": article.slug,
                "source": "insight",
            }
        )

    total_iu = round(sum(monthly_iu), 1)
    return {
        "generatedAt": now.isoformat(),
        "profile": {
            "hemophiliaType": patient.hemophilia_type,
            "severity": patient.severity,
            "baselineFactorLevel": str(patient.baseline_factor_level),
            "treatmentPlan": plan,
            "inhibitorStatus": getattr(patient, "inhibitor_status", "") or "None",
            "deficientFactor": patient.deficient_factor,
            "hospital": patient.primary_hospital.name if patient.primary_hospital_id else "",
            "prescribedFactor": getattr(patient.prescribed_factor_medicine, "name", "") or "",
        },
        "status": {
            "score": score,
            "label": status_label,
            "tone": tone,
            "summary": summary,
        },
        "totals": {
            "injections12m": sum(monthly_injections),
            "bleeds12m": sum(monthly_bleeds),
            "treatments12m": sum(monthly_treatments),
            "iu12m": total_iu,
            "iuUnit": "IU",
            "bleeds30d": bleeds_30,
            "injections30d": injections_30,
            "daysSinceBleed": days_since_bleed,
            "daysSinceInjection": days_since_injection,
            "lastBleedOn": last_bleed.isoformat() if last_bleed else None,
            "lastInjectionAt": last_injection.isoformat() if last_injection else None,
            "nextScheduledAt": next_scheduled.isoformat() if next_scheduled else None,
        },
        "comparison": {
            "thisMonth": {"injections": this_m_inj, "bleeds": this_m_bleed, "iu": round(this_m_iu, 1)},
            "lastMonth": {"injections": last_m_inj, "bleeds": last_m_bleed, "iu": round(last_m_iu, 1)},
            "thisYear": {"injections": this_year_inj, "bleeds": this_year_bleed},
            "lastYear": {"injections": last_year_inj, "bleeds": last_year_bleed},
            "injectionChangePct": _pct_change(this_m_inj, last_m_inj),
            "bleedChangePct": _pct_change(this_m_bleed, last_m_bleed),
            "iuChangePct": _pct_change(this_m_iu, last_m_iu),
            "yearInjectionChangePct": _pct_change(this_year_inj, last_year_inj),
            "yearBleedChangePct": _pct_change(this_year_bleed, last_year_bleed),
        },
        "monthly": {
            "labels": month_labels,
            "keys": [_month_key(y, m) for y, m in months],
            "injections": monthly_injections,
            "bleeds": monthly_bleeds,
            "treatments": monthly_treatments,
            "iu": monthly_iu,
        },
        "bleedSites": [{"label": label, "count": count} for label, count in sites.most_common(6)],
        "indications": [{"label": label, "count": count} for label, count in indications.most_common(6)],
        "guidance": guidance,
    }
