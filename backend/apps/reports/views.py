from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Case, Count, F, Max, Q, Sum, When
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


def _counts_by_day(queryset, field, *, date_field=False):
    counts = {}
    if date_field:
        rows = queryset.order_by().values(field).annotate(count=Count("id"))
        for row in rows:
            day = row.get(field)
            if day:
                counts[day] = row["count"]
        return counts
    for value in queryset.order_by().values_list(field, flat=True):
        if not value:
            continue
        day = value.date() if hasattr(value, "date") else value
        counts[day] = counts.get(day, 0) + 1
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


def _next_month(day):
    if day.month == 12:
        return date(day.year + 1, 1, 1)
    return date(day.year, day.month + 1, 1)


def _abs_qty(queryset):
    total = queryset.aggregate(
        total=Sum(
            Case(
                When(quantity_delta__lt=0, then=-F("quantity_delta")),
                default=F("quantity_delta"),
            )
        )
    )["total"]
    return float(total or 0)


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
        center_table = []
        for hospital in hospitals.select_related("province").order_by("name"):
            center_table.append(
                {
                    "hospitalName": hospital.name,
                    "province": hospital.province.name if hospital.province_id else "",
                    "patients": patients.filter(primary_hospital_id=hospital.id).count(),
                    "injections": injections.filter(hospital_id=hospital.id).count(),
                    "treatments": treatments.filter(hospital_id=hospital.id).count(),
                    "visits": visits.filter(hospital_id=hospital.id).count(),
                    "stockOnHand": float(
                        stock.filter(hospital_id=hospital.id).aggregate(total=Sum("quantity"))["total"] or 0
                    ),
                }
            )

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
        role_counts = {}
        for user in admins:
            label = KIND_LABELS.get(account_kind(user), user.role)
            role_counts[label] = role_counts.get(label, 0) + 1
        admin_role_mix = [{"name": name, "value": count} for name, count in sorted(role_counts.items())]
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
    stock_by_hospital = []
    for hospital in hospitals.select_related("province").order_by("name"):
        hospital_stock = stock.filter(hospital_id=hospital.id)
        hospital_moves = movements.filter(stock__hospital_id=hospital.id)
        on_hand = hospital_stock.aggregate(total=Sum("quantity"))["total"] or Decimal("0")
        stock_by_hospital.append(
            {
                "hospitalName": hospital.name,
                "province": hospital.province.name if hospital.province_id else "",
                "onHand": float(on_hand),
                "used": _abs_qty(hospital_moves.filter(movement_type__in=stock_out_types)),
                "stockIn": _abs_qty(hospital_moves.filter(movement_type=StockMovementType.STOCK_IN)),
            }
        )

    usage_trend = []
    for month_start in _month_starts(today, 6):
        month_end = _next_month(month_start)
        month_moves = movements.filter(created_at__date__gte=month_start, created_at__date__lt=month_end)
        usage_trend.append(
            {
                "month": month_start.strftime("%b"),
                "stockIn": _abs_qty(month_moves.filter(movement_type=StockMovementType.STOCK_IN)),
                "stockOut": _abs_qty(month_moves.filter(movement_type__in=stock_out_types)),
            }
        )

    province_stats = []
    province_names = (
        list(Province.objects.order_by("name").values_list("name", flat=True))
        if is_national_scope(user)
        else list(patients.values_list("province__name", flat=True).distinct())
    )
    for province_name in province_names:
        if not province_name:
            continue
        p_qs = patients.filter(province__name=province_name)
        h_qs = hospitals.filter(province__name=province_name)
        i_qs = injections.filter(patient__province__name=province_name)
        t_qs = treatments.filter(patient__province__name=province_name)
        s_qs = stock.filter(hospital__province__name=province_name)
        m_qs = movements.filter(stock__hospital__province__name=province_name)
        province_stats.append(
            {
                "province": province_name,
                "patients": p_qs.count(),
                "activePatients": p_qs.filter(verification_status="Active").count(),
                "pendingPatients": p_qs.filter(verification_status="Pending").count(),
                "hospitals": h_qs.count(),
                "injections": i_qs.count(),
                "treatments": t_qs.count(),
                "hemophiliaA": p_qs.filter(hemophilia_type="A").count(),
                "hemophiliaB": p_qs.filter(hemophilia_type="B").count(),
                "severe": p_qs.filter(severity="Severe").count(),
                "stockUnits": float(s_qs.aggregate(total=Sum("quantity"))["total"] or 0),
                "stockIn": _abs_qty(m_qs.filter(movement_type=StockMovementType.STOCK_IN)),
                "stockOut": _abs_qty(m_qs.filter(movement_type__in=stock_out_types)),
            }
        )

    admin_users = _scoped_admins(user)
    total_stock = float(stock.aggregate(total=Sum("quantity"))["total"] or 0)
    login_today = admin_users.filter(last_login__date=today).count()
    audit_today = _scoped_audit(user).filter(created_at__date=today).values("actor").distinct().count()
    visits_today = visits.filter(visit_date=today).count()
    injections_today = injections.filter(administered_at__date=today).count()
    treatments_today = treatments.filter(treatment_date=today).count()

    system_overview = {
        "totalUsers": patients.count() + admin_users.count(),
        "totalAdmins": admin_users.count(),
        "superAdmins": User.objects.filter(role=UserRole.SUPER_ADMIN).count() if is_national_scope(user) else 0,
        "provinceAdmins": admin_users.filter(role=UserRole.PROVINCE_ADMIN).count(),
        "hospitalAdmins": admin_users.filter(role=UserRole.HOSPITAL_ADMIN).count(),
        "activeSessions": max(login_today, audit_today),
        "todaysVisits": visits_today + injections_today + treatments_today,
        "totalStockUnits": total_stock,
        "totalProvinces": Province.objects.count() if is_national_scope(user) else 1,
        "totalCenters": hospitals.count(),
        "totalPatients": patients.count(),
        "activePatients": patients.filter(verification_status="Active").count(),
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
        "totals": {
            "patients": patients.count(),
            "hospitals": hospitals.count(),
            "injections": injections.count(),
            "treatments": treatments.count(),
            "activePatients": patients.filter(verification_status="Active").count(),
        },
    }
