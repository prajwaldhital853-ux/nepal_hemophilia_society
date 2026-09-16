"""Use Django's collectstatic — cloudinary_storage's override breaks on Django 6."""

from django.contrib.staticfiles.management.commands.collectstatic import (
    Command as CollectStaticCommand,
)


class Command(CollectStaticCommand):
    """Same as Django's collectstatic; registered here so it overrides cloudinary_storage."""
