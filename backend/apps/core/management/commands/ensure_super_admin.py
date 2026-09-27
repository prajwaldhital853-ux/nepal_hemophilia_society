from django.core.management.base import BaseCommand

from apps.accounts.super_admin_bootstrap import SUPER_ADMIN_USERNAME, ensure_super_admin


class Command(BaseCommand):
    help = "Ensure SUPERADMIN2 exists with full access, temp password, and cleared 2FA (break-glass)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-password",
            action="store_true",
            help="Do not reset the password (only rename/flags/2FA if --reset-2fa).",
        )
        parser.add_argument(
            "--keep-2fa",
            action="store_true",
            help="Do not clear two-factor authentication.",
        )

    def handle(self, *args, **options):
        user, temp_password, _provisioned = ensure_super_admin(
            reset_password=not options["keep_password"],
            reset_2fa=not options["keep_2fa"],
        )
        self.stdout.write(self.style.SUCCESS(f"Super admin ready: {user.username} ({user.email})"))
        if not options["keep_password"]:
            self.stdout.write(self.style.WARNING(f"Temporary password: {temp_password}"))
        if not options["keep_2fa"]:
            self.stdout.write("2FA cleared — sign in and scan a new QR code, then save backup codes.")
        self.stdout.write(f"Role: {user.role} | staff_id: {user.staff_id or '—'}")
