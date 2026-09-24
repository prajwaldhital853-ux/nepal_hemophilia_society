from datetime import date, datetime, timedelta

from django.db.models import Case, Count, F, Max, Q, Sum, When
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import LoginDeviceLock, User, UserRole
from apps.accounts.permissions import IsAdminRole
from apps.accounts.rbac import KIND_LABELS, account_kind, hospital_id_for, is_national_scope, province_id_for
from apps.audit.models import AuditLog
from apps.hospitals.models import Hospital
from apps.injections.models import InjectionRecord
from apps.patients.models import BleedingEpisode, Patient
from apps.provinces.models import Province
from apps.stock.models import FactorStock, StockMovement, StockMovementType
from apps.treatments.models import HospitalVisit, TreatmentRecord


def _scoped_querysets(user):
    patients = Patient.objects.all()
    injections = InjectionRecord.objects.filter(is_void=False)
    treatments = TreatmentRecord.objects.all()
    hospitals = Hospital.objects.filter(is_active=True)
    stock = FactorStock.objects.all()
    movements = StockMovement.objects.all()
    visits = HospitalVisit.objects.all()

    if user.role == UserRole.WEBSITE_MANAGER:
        empty_p = patients.none()
        return empty_p, injections.none(), treatments.none(), hospitals.none(), stock.none(), movements.none(), visits.none()
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        patients = patients.filter(province_id=pid)
        injections = injections.filter(patient__province_id=pid)
        treatments = treatments.filter(patient__province_id=pid)
        hospitals = hospitals.filter(province_id=pid)
        stock = stock.filter(hospital__province_id=pid)
        movements = movements.filter(stock__hospital__province_id=pid)
        visits = visits.filter(hospital__province_id=pid)
    elif user.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(user)
        patients = patients.filter(primary_hospital_id=hid)
        injections = injections.filter(hospital_id=hid)
        treatments = treatments.filter(hospital_id=hid)
        hospitals = hospitals.filter(pk=hid)
        stock = stock.filter(hospital_id=hid)
        movements = movements.filter(stock__hospital_id=hid)
        visits = visits.filter(hospital_id=hid)

    return patients, injections, treatments, hospitals, stock, movements, visits


def _as_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if hasattr(value, "date"):
        return value.date()
    return value


def _counts_by_day(queryset, field, *, date_field=False):
    """Count rows per calendar day in the database."""
    counts = {}
    if date_field:
        rows = queryset.order_by().values(field).annotate(count=Count("id"))
        key = field
    else:
        rows = queryset.order_by().annotate(_day=TruncDate(field)).values("_day").annotate(count=Count("id"))
        key = "_day"
    for row in rows:
        day = _as_date(row.get(key))
        if day:
            counts[day] = row["count"]
    return counts


def _month_starts(today, count=6):
    months = []
    year, month = today.year, today.month
    for _ in range(count):
        months.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()
    return months


def _abs_expr():
    return Sum(
        Case(
            When(quantity_delta__lt=0, then=-F("quantity_delta")),
            default=F("quantity_delta"),
        )
    )


def _abs_qty(queryset):
    return float(queryset.aggregate(total=_abs_expr())["total"] or 0)


def _count_map(queryset, field):
    return {
        row[field]: row["count"]
        for row in queryset.order_by().values(field).annotate(count=Count("id"))
        if row[field] is not None
    }


def _sum_map(queryset, field, expr):
    return {
        row[field]: float(row["total"] or 0)
        for row in queryset.order_by().values(field).annotate(total=expr)
        if row[field] is not None
    }


def _abs_map(queryset, field):
    return _sum_map(queryset, field, _abs_expr())


def _admin_role_mix(admins):
    from apps.hospitals.models import HospitalStaffType

    counts = {}
    rows = admins.order_by().values("role", "hospital_admin__staff_type").annotate(count=Count("id"))
    for row in rows:
        role = row["role"]
        if role == UserRole.HOSPITAL_ADMIN:
            kind = (
                "center_admin"
                if row["hospital_admin__staff_type"] == HospitalStaffType.CENTER_ADMIN
                else "treatment_admin"
            )
        else:
            kind = role
        label = KIND_LABELS.get(kind, role)
        counts[label] = counts.get(label, 0) + row["count"]
    return [{"name": name, "value": count} for name, count in sorted(counts.items())]


def _scope_label(user):
    if is_national_scope(user):
        return "National"
    if user.role == UserRole.PROVINCE_ADMIN:
        profile = getattr(user, "province_admin", None)
        return f"{profile.province.name} province" if profile else "Province"
    if user.role == UserRole.HOSPITAL_ADMIN:
        profile = getattr(user, "hospital_admin", None)
        return profile.hospital.name if profile else "Treatment center"
    return user.role


def _scoped_admins(user):
    qs = User.objects.exclude(role=UserRole.PATIENT)
    if is_national_scope(user):
        if account_kind(user) != "super_admin":
            qs = qs.exclude(role=UserRole.SUPER_ADMIN)
        return qs
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        return qs.filter(
            Q(pk=user.pk)
            | Q(province_admin__province_id=pid)
            | Q(hospital_admin__hospital__province_id=pid)
        )
    if user.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(user)
        return qs.filter(Q(pk=user.pk) | Q(hospital_admin__hospital_id=hid))
    return qs.filter(pk=user.pk)


def _scoped_audit(user):
    qs = AuditLog.objects.all()
    if is_national_scope(user):
        return qs
    names = list(_scoped_admins(user).values_list("username", flat=True))
    return qs.filter(actor__in=names)


class ReportSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        patients, injections, treatments, hospitals, _, _, _ = _scoped_querysets(request.user)
        return Response(
            {
                "scope": request.user.role,
                "scopeLabel": _scope_label(request.user),
                "totals": {
                    "patients": patients.count(),
                    "hospitals": hospitals.count(),
                    "injections": injections.count(),
                    "treatments": treatments.count(),
                    "activePatients": patients.filter(verification_status="Active").count(),
                },
            }
        )


class ReportDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response(_dashboard_payload(request.user))


class ReportFullView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        date_from = (request.query_params.get("from") or "").strip()
        date_to = (request.query_params.get("to") or "").strip()
        payload = _dashboard_payload(request.user)
        patients, injections, treatments, hospitals, stock, movements, visits = _scoped_querysets(request.user)
        if date_from:
            injections = injections.filter(administered_at__date__gte=date_from)
            treatments = treatments.filter(treatment_date__gte=date_from)
            movements = movements.filter(created_at__date__gte=date_from)
            visits = visits.filter(visit_date__gte=date_from)
        if date_to:
            injections = injections.filter(administered_at__date__lte=date_to)
            treatments = treatments.filter(treatment_date__lte=date_to)
            movements = movements.filter(created_at__date__lte=date_to)
            visits = visits.filter(visit_date__lte=date_to)

        indication_mix = [
            {"name": row["indication"] or "Other", "value": row["count"]}
            for row in injections.order_by().values("indication").annotate(count=Count("id"))
        ]
        severity_mix = [
            {"name": row["severity"] or "Unknown", "value": row["count"]}
            for row in patients.order_by().values("severity").annotate(count=Count("id"))
        ]
        type_mix = [
            {"name": f"Hemophilia {row['hemophilia_type']}", "value": row["count"]}
            for row in patients.order_by().values("hemophilia_type").annotate(count=Count("id"))
            if row["hemophilia_type"]
        ]
        patients_by_center = _count_map(patients, "primary_hospital_id")
        injections_by_center = _count_map(injections, "hospital_id")
        treatments_by_center = _count_map(treatments, "hospital_id")
        visits_by_center = _count_map(visits, "hospital_id")
        stock_by_center = _sum_map(stock, "hospital_id", Sum("quantity"))
        center_table = [
            {
                "hospitalName": hospital.name,
                "province": hospital.province.name if hospital.province_id else "",
                "patients": patients_by_center.get(hospital.id, 0),
                "injections": injections_by_center.get(hospital.id, 0),
                "treatments": treatments_by_center.get(hospital.id, 0),
                "visits": visits_by_center.get(hospital.id, 0),
                "stockOnHand": stock_by_center.get(hospital.id, 0),
            }
            for hospital in hospitals.select_related("province").order_by("name")
        ]

        admins = _scoped_admins(request.user)
        login_tracking = [
            {
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "role": KIND_LABELS.get(account_kind(user), user.role),
                "lastLogin": user.last_login.isoformat() if user.last_login else "",
                "active": bool(user.is_active_account),
            }
            for user in admins.order_by("-last_login")[:50]
        ]
        device_qs = LoginDeviceLock.objects.select_related("user")
        if not is_national_scope(request.user):
            device_qs = device_qs.filter(user_id__in=list(admins.values_list("id", flat=True)))
        devices = [
            {
                "identifier": row.identifier,
                "user": row.user.get_username() if row.user_id else "",
                "failedAttempts": row.failed_attempts,
                "locked": bool(row.locked_until and row.locked_until > timezone.now()),
            }
            for row in device_qs.order_by("-updated_at")[:30]
        ]
        audit_qs = _scoped_audit(request.user)
        if date_from:
            audit_qs = audit_qs.filter(created_at__date__gte=date_from)
        if date_to:
            audit_qs = audit_qs.filter(created_at__date__lte=date_to)
        activity = [
            {
                "id": row.id,
                "actor": row.actor,
                "action": row.action,
                "module": row.module,
                "detail": row.detail or row.object_id,
                "ip": row.ip,
                "createdAt": row.created_at.isoformat() if row.created_at else "",
            }
            for row in audit_qs.order_by("-created_at")[:80]
        ]
        stock_out_types = [StockMovementType.STOCK_OUT, StockMovementType.INJECTION]
        movement_summary = {
            "stockIn": _abs_qty(movements.filter(movement_type=StockMovementType.STOCK_IN)),
            "stockOut": _abs_qty(movements.filter(movement_type__in=stock_out_types)),
            "adjustments": movements.filter(movement_type=StockMovementType.ADJUSTMENT).count(),
            "injections": movements.filter(movement_type=StockMovementType.INJECTION).count(),
        }
        movement_by_type = [
            {"name": (row["movement_type"] or "other").replace("_", " "), "value": row["count"]}
            for row in movements.order_by().values("movement_type").annotate(count=Count("id"))
        ]
        bleeding = BleedingEpisode.objects.all()
        if request.user.role == UserRole.WEBSITE_MANAGER:
            bleeding = bleeding.none()
        elif request.user.role == UserRole.PROVINCE_ADMIN:
            pid = province_id_for(request.user)
            bleeding = bleeding.filter(patient__province_id=pid)
        elif request.user.role == UserRole.HOSPITAL_ADMIN:
            hid = hospital_id_for(request.user)
            bleeding = bleeding.filter(hospital_id=hid)
        if date_from:
            bleeding = bleeding.filter(episode_date__gte=date_from)
        if date_to:
            bleeding = bleeding.filter(episode_date__lte=date_to)
        bleeding_mix = [
            {"name": row["severity"] or "Unspecified", "value": row["count"]}
            for row in bleeding.order_by().values("severity").annotate(count=Count("id"))
        ]
        admin_role_mix = _admin_role_mix(admins)
        payload.update(
            {
                "scopeLabel": _scope_label(request.user),
                "from": date_from,
                "to": date_to,
                "indicationMix": indication_mix,
                "severityMix": severity_mix,
                "typeMix": type_mix,
                "bleedingMix": bleeding_mix,
                "centerTable": center_table,
                "loginTracking": login_tracking,
                "devices": devices,
                "activityLogs": activity,
                "movementSummary": movement_summary,
                "movementByType": movement_by_type,
                "adminRoleMix": admin_role_mix,
                "rangeTotals": {
                    "injections": injections.count(),
                    "treatments": treatments.count(),
                    "visits": visits.count(),
                    "stockMoves": movements.count(),
                    "bleeding": bleeding.count(),
                    "loginsTracked": len(login_tracking),
                },
            }
        )
        return Response(payload)


def _dashboard_payload(user):
    patients, injections, treatments, hospitals, stock, movements, visits = _scoped_querysets(user)
    today = timezone.localdate()
    start = today - timedelta(days=15)

    inj_in_window = injections.filter(administered_at__date__gte=start)
    trt_in_window = treatments.filter(treatment_date__gte=start)
    if not inj_in_window.exists() and not trt_in_window.exists():
        latest_inj = injections.aggregate(latest=Max("administered_at"))["latest"]
        latest_trt = treatments.aggregate(latest=Max("treatment_date"))["latest"]
        latest_dates = []
        if latest_inj:
            inj_dt = latest_inj
            if timezone.is_aware(inj_dt):
                inj_dt = timezone.localtime(inj_dt)
            latest_dates.append(inj_dt.date())
        if latest_trt:
            latest_dates.append(latest_trt)
        if latest_dates:
            end = min(max(latest_dates), today)
            start = end - timedelta(days=15)

    inj_by_day = _counts_by_day(injections.filter(administered_at__date__gte=start), "administered_at")
    trt_by_day = _counts_by_day(
        treatments.filter(treatment_date__gte=start),
        "treatment_date",
        date_field=True,
    )

    treatment_trend = []
    for offset in range(16):
        day = start + timedelta(days=offset)
        treatment_trend.append(
            {
                "day": day.isoformat(),
                "label": day.strftime("%b %d"),
                "injections": inj_by_day.get(day, 0),
                "treatments": trt_by_day.get(day, 0),
            }
        )

    stock_out_types = [StockMovementType.STOCK_OUT, StockMovementType.INJECTION]
    on_hand_by_hospital = _sum_map(stock, "hospital_id", Sum("quantity"))
    used_by_hospital = _abs_map(movements.filter(movement_type__in=stock_out_types), "stock__hospital_id")
    stock_in_by_hospital = _abs_map(movements.filter(movement_type=StockMovementType.STOCK_IN), "stock__hospital_id")
    stock_by_hospital = [
        {
            "hospitalName": hospital.name,
            "province": hospital.province.name if hospital.province_id else "",
            "onHand": on_hand_by_hospital.get(hospital.id, 0),
            "used": used_by_hospital.get(hospital.id, 0),
            "stockIn": stock_in_by_hospital.get(hospital.id, 0),
        }
        for hospital in hospitals.select_related("province").order_by("name")
    ]

    month_starts = _month_starts(today, 6)
    usage_buckets = {}
    if month_starts:
        month_rows = (
            movements.filter(created_at__date__gte=month_starts[0])
            .annotate(month=TruncMonth("created_at"))
            .order_by()
            .values("month", "movement_type")
            .annotate(total=_abs_expr())
        )
        for row in month_rows:
            month = _as_date(row["month"])
            if month is None:
                continue
            month = month.replace(day=1)
            bucket = usage_buckets.setdefault(month, {"stockIn": 0.0, "stockOut": 0.0})
            amount = float(row["total"] or 0)
            if row["movement_type"] == StockMovementType.STOCK_IN:
                bucket["stockIn"] += amount
            elif row["movement_type"] in stock_out_types:
                bucket["stockOut"] += amount
    usage_trend = [
        {
            "month": month_start.strftime("%b"),
            "stockIn": usage_buckets.get(month_start, {}).get("stockIn", 0),
            "stockOut": usage_buckets.get(month_start, {}).get("stockOut", 0),
        }
        for month_start in month_starts
    ]

    province_names = (
        list(Province.objects.order_by("name").values_list("name", flat=True))
        if is_national_scope(user)
        else list(patients.order_by().values_list("province__name", flat=True).distinct())
    )
    patient_by_province = {
        row["province__name"]: row
        for row in patients.order_by()
        .values("province__name")
        .annotate(
            patients=Count("id"),
            activePatients=Count("id", filter=Q(verification_status="Active")),
            pendingPatients=Count("id", filter=Q(verification_status="Pending")),
            hemophiliaA=Count("id", filter=Q(hemophilia_type="A")),
            hemophiliaB=Count("id", filter=Q(hemophilia_type="B")),
            severe=Count("id", filter=Q(severity="Severe")),
        )
        if row["province__name"]
    }
    hospitals_by_province = _count_map(hospitals, "province__name")
    injections_by_province = _count_map(injections, "patient__province__name")
    treatments_by_province = _count_map(treatments, "patient__province__name")
    stock_by_province = _sum_map(stock, "hospital__province__name", Sum("quantity"))
    stock_in_by_province = _abs_map(
        movements.filter(movement_type=StockMovementType.STOCK_IN),
        "stock__hospital__province__name",
    )
    stock_out_by_province = _abs_map(
        movements.filter(movement_type__in=stock_out_types),
        "stock__hospital__province__name",
    )
    province_stats = []
    for province_name in province_names:
        if not province_name:
            continue
        prow = patient_by_province.get(province_name, {})
        province_stats.append(
            {
                "province": province_name,
                "patients": prow.get("patients", 0),
                "activePatients": prow.get("activePatients", 0),
                "pendingPatients": prow.get("pendingPatients", 0),
                "hospitals": hospitals_by_province.get(province_name, 0),
                "injections": injections_by_province.get(province_name, 0),
                "treatments": treatments_by_province.get(province_name, 0),
                "hemophiliaA": prow.get("hemophiliaA", 0),
                "hemophiliaB": prow.get("hemophiliaB", 0),
                "severe": prow.get("severe", 0),
                "stockUnits": stock_by_province.get(province_name, 0),
                "stockIn": stock_in_by_province.get(province_name, 0),
                "stockOut": stock_out_by_province.get(province_name, 0),
            }
        )

    admin_users = _scoped_admins(user)
    patient_totals = patients.aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(verification_status="Active")),
    )
    admin_totals = admin_users.aggregate(
        total=Count("id"),
        province=Count("id", filter=Q(role=UserRole.PROVINCE_ADMIN)),
        hospital=Count("id", filter=Q(role=UserRole.HOSPITAL_ADMIN)),
        login_today=Count("id", filter=Q(last_login__date=today)),
    )
    total_stock = float(stock.aggregate(total=Sum("quantity"))["total"] or 0)
    audit_today = _scoped_audit(user).filter(created_at__date=today).values("actor").distinct().count()
    activity_today = visits.filter(visit_date=today).aggregate(
        visits=Count("id"),
    )
    injections_today = injections.filter(administered_at__date=today).count()
    treatments_today = treatments.filter(treatment_date=today).count()
    hospital_count = hospitals.count()
    injection_count = injections.count()
    treatment_count = treatments.count()
    patient_count = patient_totals["total"] or 0
    active_patients = patient_totals["active"] or 0

    recent_patients = [
        {
            "id": row.unique_patient_id,
            "fullName": row.full_name,
            "province": row.province.name if row.province_id else "",
            "status": row.verification_status,
            "updatedAt": row.updated_at.isoformat() if row.updated_at else "",
        }
        for row in patients.select_related("province").order_by("-id")[:20]
    ]

    system_overview = {
        "totalUsers": patient_count + (admin_totals["total"] or 0),
        "totalAdmins": admin_totals["total"] or 0,
        "superAdmins": User.objects.filter(role=UserRole.SUPER_ADMIN).count() if is_national_scope(user) else 0,
        "provinceAdmins": admin_totals["province"] or 0,
        "hospitalAdmins": admin_totals["hospital"] or 0,
        "activeSessions": max(admin_totals["login_today"] or 0, audit_today),
        "todaysVisits": (activity_today["visits"] or 0) + injections_today + treatments_today,
        "totalStockUnits": total_stock,
        "totalProvinces": Province.objects.count() if is_national_scope(user) else 1,
        "totalCenters": hospital_count,
        "totalPatients": patient_count,
        "activePatients": active_patients,
        "uptime": "99.8%",
    }

    recent_activity = [
        {
            "id": row.id,
            "actor": row.actor,
            "action": row.action,
            "module": row.module,
            "detail": row.detail or row.object_id,
            "createdAt": row.created_at.isoformat() if row.created_at else "",
        }
        for row in _scoped_audit(user)[:12]
    ]

    return {
        "treatmentTrend": treatment_trend,
        "stockByHospital": stock_by_hospital,
        "stockUsageTrend": usage_trend,
        "provinceStats": province_stats,
        "systemOverview": system_overview,
        "recentActivity": recent_activity,
        "recentPatients": recent_patients,
        "totals": {
            "patients": patient_count,
            "hospitals": hospital_count,
            "injections": injection_count,
            "treatments": treatment_count,
            "activePatients": active_patients,
        },
    }
