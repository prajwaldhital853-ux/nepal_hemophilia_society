from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole, IsPatientRole, PatientPasswordUsable
from apps.accounts.rbac import PERM_WEBSITE_DELETE, PERM_WEBSITE_MANAGE, PERM_WEBSITE_VIEW, has_perm
from apps.audit.models import AuditLog
from apps.cms.models import AppService, CmsArticle, ContentKind, ServiceCategory
from apps.cms.serializers import AppServiceListSerializer, AppServiceSerializer, CmsArticleSerializer
from apps.core.pagination import paginate_queryset
from apps.patients.views import client_ip

KIND_ALIASES = {
    "news": ContentKind.NEWS,
    "event": ContentKind.EVENT,
    "events": ContentKind.EVENT,
    "resource": ContentKind.RESOURCE,
    "resources": ContentKind.RESOURCE,
    "gallery": ContentKind.GALLERY,
    "insight": ContentKind.INSIGHT,
    "insights": ContentKind.INSIGHT,
}


def _flatten_errors(detail):
    if isinstance(detail, dict):
        parts = []
        for key, val in detail.items():
            if isinstance(val, (list, tuple)):
                parts.append(f"{key}: {' '.join(str(v) for v in val)}")
            else:
                parts.append(f"{key}: {val}")
        return " ".join(parts)
    if isinstance(detail, (list, tuple)):
        return " ".join(str(v) for v in detail)
    return str(detail)


def _audit(request, action, module, object_id="", detail=""):
    AuditLog.objects.create(
        actor=request.user.get_username(),
        action=action,
        module=module,
        object_id=str(object_id),
        ip=client_ip(request),
        detail=detail,
    )
    from apps.notifications.models import NotificationCategory
    from apps.notifications.services import notify_admins

    notify_admins(
        category=NotificationCategory.SYSTEM,
        title=action,
        message=f"{detail or action}.",
        actor=request.user,
        related_type="website",
        related_id=int(object_id) if str(object_id).isdigit() else None,
    )


def _require_website(user, perm, message):
    if not has_perm(user, perm):
        raise PermissionDenied(message)


def _resolve_kind(raw: str) -> str | None:
    value = (raw or "").strip().lower()
    return KIND_ALIASES.get(value)


class PatientServicesView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        search = (request.query_params.get("search") or "").strip().lower()
        qs = AppService.objects.filter(published=True)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search)).distinct()
        grouped = []
        for code, label in ServiceCategory.choices:
            items = [row for row in qs if row.category == code]
            items.sort(key=lambda row: (row.sort_order, row.title.lower()))
            if items:
                grouped.append(
                    {
                        "id": code,
                        "title": label,
                        "services": AppServiceListSerializer(items, many=True).data,
                    }
                )
        return Response({"categories": grouped, "count": qs.count()})


class PatientServiceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request, slug):
        service = AppService.objects.filter(slug=slug, published=True).first()
        if not service:
            raise NotFound("Service not found.")
        return Response({"service": AppServiceSerializer(service).data})


class PatientArticlesView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request, kind):
        resolved = _resolve_kind(kind)
        if not resolved:
            return Response({"error": "Unknown content type."}, status=400)
        qs = CmsArticle.objects.filter(kind=resolved, published=True)
        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(title__icontains=search)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "kind": resolved,
                "articles": CmsArticleSerializer(rows, many=True, context={"request": request}).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )


class PatientArticleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request, kind, slug):
        resolved = _resolve_kind(kind)
        if not resolved:
            return Response({"error": "Unknown content type."}, status=400)
        article = CmsArticle.objects.filter(kind=resolved, slug=slug, published=True).first()
        if not article:
            raise NotFound("Content not found.")
        return Response({"article": CmsArticleSerializer(article, context={"request": request}).data})


class PatientCentersView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        from apps.hospitals.models import Hospital

        hospitals = Hospital.objects.filter(is_active=True).select_related("province", "district").order_by("name")
        search = (request.query_params.get("search") or "").strip()
        if search:
            hospitals = hospitals.filter(name__icontains=search)
        return Response(
            {
                "centers": [
                    {
                        "id": row.id,
                        "name": row.name,
                        "province": row.province.name,
                        "district": row.district.name if row.district else "",
                    }
                    for row in hospitals
                ]
            }
        )


class AdminServicesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        _require_website(request.user, PERM_WEBSITE_VIEW, "You cannot view app services.")
        qs = AppService.objects.all()
        category = (request.query_params.get("category") or "").strip()
        if category in ServiceCategory.values:
            qs = qs.filter(category=category)
        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(title__icontains=search)
        published = request.query_params.get("published")
        if published in ("true", "false"):
            qs = qs.filter(published=published == "true")
        rows, next_cursor, limit = paginate_queryset(qs.order_by("category", "sort_order", "id"), request, lookup="id")
        return Response(
            {
                "services": AppServiceSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
                "categories": [{"id": code, "label": label} for code, label in ServiceCategory.choices],
            }
        )

    def post(self, request):
        _require_website(request.user, PERM_WEBSITE_MANAGE, "You cannot add app services.")
        serializer = AppServiceSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        service = serializer.save()
        _audit(request, "Created app service", "Website", service.id, service.title)
        return Response({"service": AppServiceSerializer(service).data}, status=201)


class AdminServiceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, pk):
        _require_website(request.user, PERM_WEBSITE_VIEW, "You cannot view app services.")
        service = AppService.objects.filter(pk=pk).first()
        if not service:
            raise NotFound("Service not found.")
        return Response({"service": AppServiceSerializer(service).data})

    def put(self, request, pk):
        _require_website(request.user, PERM_WEBSITE_MANAGE, "You cannot update app services.")
        service = AppService.objects.filter(pk=pk).first()
        if not service:
            raise NotFound("Service not found.")
        serializer = AppServiceSerializer(service, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        service = serializer.save()
        _audit(request, "Updated app service", "Website", service.id, service.title)
        return Response({"service": AppServiceSerializer(service).data})

    def delete(self, request, pk):
        _require_website(request.user, PERM_WEBSITE_DELETE, "You cannot delete app services.")
        service = AppService.objects.filter(pk=pk).first()
        if not service:
            raise NotFound("Service not found.")
        title = service.title
        service.delete()
        _audit(request, "Deleted app service", "Website", pk, title)
        return Response(status=204)


class AdminArticlesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        _require_website(request.user, PERM_WEBSITE_VIEW, "You cannot view website content.")
        qs = CmsArticle.objects.all()
        kind = _resolve_kind(request.query_params.get("kind") or "")
        if kind:
            qs = qs.filter(kind=kind)
        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(title__icontains=search)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "articles": CmsArticleSerializer(rows, many=True, context={"request": request}).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )

    def post(self, request):
        _require_website(request.user, PERM_WEBSITE_MANAGE, "You cannot add website content.")
        serializer = CmsArticleSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        article = serializer.save()
        _audit(request, "Created website content", "Website", article.id, article.title)
        return Response({"article": CmsArticleSerializer(article, context={"request": request}).data}, status=201)


class AdminArticleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, pk):
        _require_website(request.user, PERM_WEBSITE_VIEW, "You cannot view website content.")
        article = CmsArticle.objects.filter(pk=pk).first()
        if not article:
            raise NotFound("Content not found.")
        return Response({"article": CmsArticleSerializer(article, context={"request": request}).data})

    def put(self, request, pk):
        _require_website(request.user, PERM_WEBSITE_MANAGE, "You cannot update website content.")
        article = CmsArticle.objects.filter(pk=pk).first()
        if not article:
            raise NotFound("Content not found.")
        serializer = CmsArticleSerializer(article, data=request.data, partial=True, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        article = serializer.save()
        _audit(request, "Updated website content", "Website", article.id, article.title)
        return Response({"article": CmsArticleSerializer(article, context={"request": request}).data})

    def delete(self, request, pk):
        _require_website(request.user, PERM_WEBSITE_DELETE, "You cannot delete website content.")
        article = CmsArticle.objects.filter(pk=pk).first()
        if not article:
            raise NotFound("Content not found.")
        title = article.title
        article.delete()
        _audit(request, "Deleted website content", "Website", pk, title)
        return Response(status=204)
