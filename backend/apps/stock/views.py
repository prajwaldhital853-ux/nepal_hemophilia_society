from django.db.models import Sum
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import CanManageStock, CanViewStock, IsAdminRole, IsPatientRole, PatientPasswordUsable
from apps.accounts.rbac import has_perm, hospital_id_for, is_national_scope, province_id_for
from apps.audit.models import AuditLog
from apps.patients.models import Patient
from apps.patients.views import _flatten_errors, client_ip
from apps.stock.models import FactorStock, StockMovement, StockMovementType
from apps.stock.serializers import (
    FactorStockSerializer,
    StockAdjustSerializer,
    StockCreateSerializer,
    StockMovementSerializer,
    StockMoveSerializer,
)
from apps.core.pagination import paginate_queryset
from apps.stock.services import _record_movement


def _stock_queryset():
    return FactorStock.objects.select_related(
        "hospital",
        "hospital__province",
        "factor_medicine",
        "created_by",
        "updated_by",
    )


def _movement_queryset():
    return StockMovement.objects.select_related(
        "stock",
        "stock__hospital",
        "stock__hospital__province",
        "stock__factor_medicine",
        "recorded_by",
        "patient",
        "injection",
    )


def _scope_movements(user, qs):
    if is_national_scope(user):
        return qs
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        return qs.filter(stock__hospital__province_id=pid) if pid else qs.none()
    if user.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(user)
        return qs.filter(stock__hospital_id=hid) if hid else qs.none()
    return qs.none()


def _scope_stock(user, qs):
    if is_national_scope(user):
        return qs
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        return qs.filter(hospital__province_id=pid) if pid else qs.none()
    if user.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(user)
        return qs.filter(hospital_id=hid) if hid else qs.none()
    if user.role == UserRole.PATIENT:
        profile = getattr(user, "patient_profile", None)
        if profile and profile.primary_hospital_id:
            return qs.filter(hospital_id=profile.primary_hospital_id)
        return qs.none()
    return qs.none()


def _assert_can_manage_lot(user, stock):
    if not has_perm(user, "stock.manage"):
        raise PermissionDenied("You cannot add or adjust stock.")
    if is_national_scope(user):
        return
    if user.role == UserRole.HOSPITAL_ADMIN:
        hid = hospital_id_for(user)
        if hid != stock.hospital_id:
            raise PermissionDenied("You can only manage stock at your own treatment center.")
        return
    if user.role == UserRole.PROVINCE_ADMIN:
        pid = province_id_for(user)
        if not pid or stock.hospital.province_id != pid:
            raise PermissionDenied("You can only manage stock at treatment centers in your province.")
        return
    raise PermissionDenied("You cannot add or adjust stock.")


class StockListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdminRole(), CanManageStock()]
        return [IsAuthenticated(), IsAdminRole(), CanViewStock()]

    def get(self, request):
        qs = _scope_stock(request.user, _stock_queryset())
        hospital = request.query_params.get("hospitalName", "").strip()
        factor_id = request.query_params.get("factorMedicineId", "").strip()
        search = request.query_params.get("search", "").strip()
        if hospital:
            qs = qs.filter(hospital__name__iexact=hospital)
        if factor_id:
            qs = qs.filter(factor_medicine_id=factor_id)
        if search:
            qs = qs.filter(factor_medicine__name__icontains=search)
        total_qty = qs.aggregate(s=Sum("quantity"))["s"] or 0
        low = qs.filter(quantity__lte=0).count()
        total = qs.count()
        rows, next_cursor, limit = paginate_queryset(qs, request)
        lots = FactorStockSerializer(rows, many=True).data
        return Response(
            {
                "stock": lots,
                "total": total,
                "totalQuantity": total_qty,
                "emptyLots": low,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )

    def post(self, request):
        serializer = StockCreateSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        stock = serializer.save()
        allocated = serializer.context.get("allocated_stocks")
        if allocated:
            AuditLog.objects.create(
                actor=request.user.get_username(),
                action="Global stock allocation",
                module="Stock",
                object_id=str(serializer.context.get("global_shipment").id),
                ip=client_ip(request),
                detail=f"{stock.factor_medicine.name} allocated to {len(allocated)} centers",
            )
            return Response(
                {
                    "stock": FactorStockSerializer(allocated, many=True).data,
                    "globalShipmentId": serializer.context.get("global_shipment").id,
                },
                status=201,
            )
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Stock in",
            module="Stock",
            object_id=str(stock.id),
            ip=client_ip(request),
            detail=f"{stock.factor_medicine.name} +{request.data.get('quantity')} at {stock.hospital.name}",
        )
        return Response({"stock": FactorStockSerializer(stock).data}, status=201)


class StockDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ("PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminRole(), CanManageStock()]
        return [IsAuthenticated(), IsAdminRole(), CanViewStock()]

    def get_object(self, request, pk):
        stock = _scope_stock(request.user, _stock_queryset()).filter(pk=pk).first()
        if not stock:
            raise NotFound("Stock lot not found.")
        return stock

    def get(self, request, pk):
        stock = self.get_object(request, pk)
        movements = _movement_queryset().filter(stock=stock).order_by("-created_at")[:200]
        return Response(
            {
                "stock": FactorStockSerializer(stock).data,
                "movements": StockMovementSerializer(movements, many=True).data,
            }
        )

    def patch(self, request, pk):
        stock = self.get_object(request, pk)
        _assert_can_manage_lot(request.user, stock)
        serializer = StockAdjustSerializer(stock, data=request.data, partial=True, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        stock = serializer.save()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Updated stock lot",
            module="Stock",
            object_id=str(stock.id),
            ip=client_ip(request),
            detail=request.data.get("reason", ""),
        )
        return Response({"stock": FactorStockSerializer(stock).data})

    def delete(self, request, pk):
        stock = self.get_object(request, pk)
        _assert_can_manage_lot(request.user, stock)
        if stock.quantity > 0 and request.user.role != UserRole.SUPER_ADMIN:
            raise PermissionDenied("Only Super Admin can delete a lot that still has quantity. Stock out first.")
        if stock.movements.filter(movement_type=StockMovementType.INJECTION).exists() and request.user.role != UserRole.SUPER_ADMIN:
            raise PermissionDenied("This lot was given to patients. Super Admin must delete it if needed.")
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Deleted stock lot",
            module="Stock",
            object_id=str(stock.id),
            ip=client_ip(request),
            detail=f"{stock.factor_medicine.name} batch {stock.batch_number}",
        )
        from apps.notifications.models import NotificationCategory
        from apps.notifications.services import notify_admins

        notify_admins(
            hospital=stock.hospital,
            category=NotificationCategory.STOCK,
            title="Stock lot deleted",
            message=(
                f"{request.user.get_full_name() or request.user.get_username()} deleted "
                f"{stock.factor_medicine.name} batch {stock.batch_number or 'n/a'} at {stock.hospital.name}."
            ),
            actor=request.user,
            related_type="stock",
            related_id=stock.id,
        )
        stock.delete()
        return Response({"ok": True})


class StockInView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanManageStock]

    def post(self, request, pk):
        stock = _scope_stock(request.user, _stock_queryset()).filter(pk=pk).first()
        if not stock:
            raise NotFound("Stock lot not found.")
        _assert_can_manage_lot(request.user, stock)
        serializer = StockMoveSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        _record_movement(
            stock=stock,
            movement_type=StockMovementType.STOCK_IN,
            delta=serializer.validated_data["quantity"],
            user=request.user,
            reason=serializer.validated_data["reason"],
            notes=serializer.validated_data.get("notes", ""),
        )
        stock.refresh_from_db()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Stock in",
            module="Stock",
            object_id=str(stock.id),
            ip=client_ip(request),
            detail=f"+{serializer.validated_data['quantity']} {stock.unit}",
        )
        return Response({"stock": FactorStockSerializer(stock).data})


class StockOutView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanManageStock]

    def post(self, request, pk):
        stock = _scope_stock(request.user, _stock_queryset()).filter(pk=pk).first()
        if not stock:
            raise NotFound("Stock lot not found.")
        _assert_can_manage_lot(request.user, stock)
        serializer = StockMoveSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        try:
            _record_movement(
                stock=stock,
                movement_type=StockMovementType.STOCK_OUT,
                delta=-serializer.validated_data["quantity"],
                user=request.user,
                reason=serializer.validated_data["reason"],
                notes=serializer.validated_data.get("notes", ""),
            )
        except ValidationError as exc:
            return Response({"error": str(exc.detail[0] if isinstance(exc.detail, list) else exc.detail)}, status=400)
        stock.refresh_from_db()
        AuditLog.objects.create(
            actor=request.user.get_username(),
            action="Stock out",
            module="Stock",
            object_id=str(stock.id),
            ip=client_ip(request),
            detail=f"-{serializer.validated_data['quantity']} {stock.unit}: {serializer.validated_data['reason']}",
        )
        return Response({"stock": FactorStockSerializer(stock).data})


class StockMovementListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanViewStock]

    def get(self, request):
        qs = _scope_movements(request.user, _movement_queryset())
        movement_type = request.query_params.get("type", "").strip()
        patient_id = request.query_params.get("patientId", "").strip()
        hospital = request.query_params.get("hospitalName", "").strip()
        date_from = request.query_params.get("from", "").strip()
        date_to = request.query_params.get("to", "").strip()
        search = request.query_params.get("search", "").strip()
        if movement_type:
            qs = qs.filter(movement_type=movement_type)
        if patient_id:
            qs = qs.filter(patient__unique_patient_id__iexact=patient_id)
        if hospital:
            qs = qs.filter(stock__hospital__name__iexact=hospital)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if search:
            qs = qs.filter(patient__full_name__icontains=search) | qs.filter(reason__icontains=search)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        data = StockMovementSerializer(rows, many=True).data
        return Response(
            {
                "movements": data,
                "total": qs.count(),
                "nextCursor": next_cursor,
                "limit": limit,
                "page": 1,
                "pageSize": limit,
            }
        )


class PatientMeStockView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            raise NotFound("No patient record is linked to this account.")
        patient = (
            Patient.objects.select_related("primary_hospital", "province", "prescribed_factor_medicine")
            .filter(pk=patient.pk)
            .first()
        )
        stock_factor_type = patient.deficient_factor
        if patient.prescribed_factor_medicine_id:
            stock_factor_type = patient.prescribed_factor_medicine.factor_type
        qs = _stock_queryset().filter(
            hospital_id=patient.primary_hospital_id,
            factor_medicine__factor_type=stock_factor_type,
        )
        lots = FactorStockSerializer(qs, many=True).data
        total = qs.aggregate(s=Sum("quantity"))["s"] or 0
        out_of_stock = total <= 0
        return Response(
            {
                "hospitalName": patient.primary_hospital.name if patient.primary_hospital_id else "",
                "province": patient.province.name if patient.province_id else "",
                "factorType": stock_factor_type,
                "prescribedFactorMedicineName": (
                    patient.prescribed_factor_medicine.name if patient.prescribed_factor_medicine_id else ""
                ),
                "totalQuantity": total,
                "unit": lots[0]["unit"] if lots else "IU",
                "outOfStock": out_of_stock,
                "stock": lots,
            }
        )
