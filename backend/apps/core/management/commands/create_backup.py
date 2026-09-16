from django.core.management.base import BaseCommand

from apps.core.backups import prune_backups, write_encrypted_backup


class Command(BaseCommand):
    help = "Create an encrypted NHMS backup (users, admins, patients, clinical data)."

    def add_arguments(self, parser):
        parser.add_argument("--kind", default="auto", choices=["auto", "manual"])

    def handle(self, *args, **options):
        meta = write_encrypted_backup(options["kind"])
        removed = prune_backups()
        self.stdout.write(self.style.SUCCESS(f"Wrote {meta['filename']} ({meta['sizeBytes']} bytes)"))
        if removed:
            self.stdout.write(f"Pruned {removed} old backup(s).")
