from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Case, Count, F, Max, Sum, When
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, UserRole
from apps.accounts.permissions import IsAdminRole
from apps.accounts.rbac import hospital_id_for, is_national_scope, province_id_for
from apps.audit.models import AuditLog
from apps.hospitals.models import Hospital
from apps.injections.models import InjectionRecord
from apps.patients.models import Patient
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


class ReportSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        patients, injections, treatments, hospitals, _, _, _ = _scoped_querysets(request.user)
        return Response(
            {
                "scope": request.user.role,
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
        patients, injections, treatments, hospitals, stock, movements, visits = _scoped_querysets(request.user)
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
            if is_national_scope(request.user)
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

        admin_users = User.objects.exclude(role=UserRole.PATIENT)
        if not is_national_scope(request.user):
            admin_users = admin_users.filter(pk=request.user.pk)

        total_stock = float(stock.aggregate(total=Sum("quantity"))["total"] or 0)
        login_today = User.objects.filter(last_login__date=today).count()
        audit_today = AuditLog.objects.filter(created_at__date=today).values("actor").distinct().count()
        visits_today = visits.filter(visit_date=today).count()
        injections_today = injections.filter(administered_at__date=today).count()
        treatments_today = treatments.filter(treatment_date=today).count()

        system_overview = {
            "totalUsers": User.objects.count(),
            "totalAdmins": User.objects.exclude(role=UserRole.PATIENT).count()
            if is_national_scope(request.user)
            else admin_users.count(),
            "superAdmins": User.objects.filter(role=UserRole.SUPER_ADMIN).count(),
            "provinceAdmins": User.objects.filter(role=UserRole.PROVINCE_ADMIN).count(),
            "hospitalAdmins": User.objects.filter(role=UserRole.HOSPITAL_ADMIN).count(),
            "activeSessions": max(login_today, audit_today),
            "todaysVisits": visits_today + injections_today + treatments_today,
            "totalStockUnits": total_stock,
            "totalProvinces": Province.objects.count() if is_national_scope(request.user) else 1,
            "totalCenters": hospitals.count(),
            "totalPatients": patients.count(),
            "activePatients": patients.filter(verification_status="Active").count(),
            "uptime": "99.8%",
        }

        audit_qs = AuditLog.objects.all()
        if not is_national_scope(request.user):
            audit_qs = audit_qs.filter(actor=request.user.get_username())
        recent_activity = [
            {
                "id": row.id,
                "actor": row.actor,
                "action": row.action,
                "module": row.module,
                "detail": row.detail or row.object_id,
                "createdAt": row.created_at.isoformat() if row.created_at else "",
            }
            for row in audit_qs[:12]
        ]

        return Response(
            {
                "treatmentTrend": treatment_trend,
                "stockByHospital": stock_by_hospital,
                "stockUsageTrend": usage_trend,
                "provinceStats": province_stats,
                "systemOverview": system_overview,
                "recentActivity": recent_activity,
            }
        )
