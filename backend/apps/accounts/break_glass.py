"""Emergency super-admin reset when Render shell is unavailable."""

import os

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.super_admin_bootstrap import SUPER_ADMIN_USERNAME, ensure_super_admin


class BreakGlassSuperAdminView(APIView):
    """
    Reset SUPERADMIN2 password + 2FA when BREAK_GLASS_SECRET env is set.
    POST /api/v1/auth/break-glass-super-admin/  {"secret": "..."}
    """

    permission_classes = [AllowAny]
    allow_without_totp = True

    def post(self, request):
        expected = (os.getenv("BREAK_GLASS_SECRET") or "").strip()
        if not expected:
            return Response({"error": "Break-glass reset is not enabled."}, status=404)

        provided = str(request.data.get("secret") or request.headers.get("X-Break-Glass-Secret") or "").strip()
        if not provided or provided != expected:
            return Response({"error": "Invalid break-glass secret."}, status=403)

        user, temp_password, _provisioned = ensure_super_admin(reset_password=True, reset_2fa=True)
        return Response(
            {
                "message": "Super admin credentials reset. Sign in and set up 2FA again.",
                "username": user.username,
                "temporaryPassword": temp_password,
            }
        )
