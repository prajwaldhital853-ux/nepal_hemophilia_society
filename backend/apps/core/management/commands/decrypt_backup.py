from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.core.backups import _fernet, backup_file_path, backup_root


class Command(BaseCommand):
    help = "Decrypt an encrypted NHMS backup (.zip.enc) to a zip on this workstation."

    def add_arguments(self, parser):
        parser.add_argument("filename")
        parser.add_argument("--out", default="")

    def handle(self, *args, **options):
        path = backup_file_path(options["filename"])
        if not path:
            raise CommandError("Backup file not found.")
        out = Path(options["out"]) if options["out"] else backup_root() / path.name.replace(".zip.enc", ".zip")
        out.write_bytes(_fernet().decrypt(path.read_bytes()))
        self.stdout.write(self.style.SUCCESS(f"Wrote {out}"))
