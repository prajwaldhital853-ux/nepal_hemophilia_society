from django.core.management.base import BaseCommand

from apps.cms.seed import seed_cms_defaults


class Command(BaseCommand):
    help = "Seed default patient-app services and sample website content."

    def add_arguments(self, parser):
        parser.add_argument("--update", action="store_true", help="Overwrite existing seeded rows.")
        parser.add_argument("--no-media", action="store_true", help="Skip generating CMS PDFs and gallery images.")

    def handle(self, *args, **options):
        seed_cms_defaults(
            update_existing=options["update"],
            with_media=not options["no_media"],
        )
        self.stdout.write(self.style.SUCCESS("CMS defaults are in place."))
