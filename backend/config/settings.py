"""
Django settings for Nepal Hemophilia Digital Management System.
Loads configuration from environment variables (.env at project root).
"""

import os
import sys
from datetime import timedelta
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# backend/ -> project root
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

load_dotenv(PROJECT_ROOT / ".env")


def _normalize_cloudinary_url(raw: str) -> str:
    """Accept pasted values like 'CLOUDINARY_URL=cloudinary://...' from dashboards."""
    value = (raw or "").strip().strip('"').strip("'")
    if value.upper().startswith("CLOUDINARY_URL="):
        value = value.split("=", 1)[1].strip()
    return value


CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "").strip()
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "").strip()
CLOUDINARY_URL = _normalize_cloudinary_url(os.getenv("CLOUDINARY_URL", ""))

if not CLOUDINARY_URL.startswith("cloudinary://") and CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    from urllib.parse import quote

    CLOUDINARY_URL = (
        f"cloudinary://{quote(CLOUDINARY_API_KEY, safe='')}:"
        f"{quote(CLOUDINARY_API_SECRET, safe='')}@{CLOUDINARY_CLOUD_NAME}"
    )

USE_CLOUDINARY = CLOUDINARY_URL.startswith("cloudinary://")
if USE_CLOUDINARY:
    os.environ["CLOUDINARY_URL"] = CLOUDINARY_URL

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-dev-key-change-in-production")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")
if not DEBUG and (not SECRET_KEY or SECRET_KEY.startswith("django-insecure")):
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY to a strong secret when DEBUG is False.")
ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]
# Dev on a physical phone: accept requests to your PC LAN IP (e.g. 192.168.x.x).
if DEBUG and os.getenv("DJANGO_ALLOW_LAN", "true").lower() in ("true", "1", "yes"):
    ALLOWED_HOSTS = ["*"]

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
]

if USE_CLOUDINARY:
    DJANGO_APPS += ["cloudinary_storage", "cloudinary"]

DJANGO_APPS += ["django.contrib.staticfiles"]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "django_extensions",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.provinces",
    "apps.hospitals",
    "apps.patients",
    "apps.factors",
    "apps.injections",
    "apps.treatments",
    "apps.stock",
    "apps.notifications",
    "apps.audit",
    "apps.reports",
    "apps.core",  # last: collectstatic command overrides cloudinary_storage on Django 6
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
AUTH_USER_MODEL = "accounts.User"

# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database — PostgreSQL in production; SQLite optional for local bootstrap
# ---------------------------------------------------------------------------


def _database_from_url(url: str) -> dict:
    """Parse DATABASE_URL (Render/Heroku style) for Django + psycopg."""
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    options = {"connect_timeout": 5}
    sslmode = (query.get("sslmode") or [None])[0]
    if sslmode:
        options["sslmode"] = sslmode
    elif parsed.hostname and "render.com" in parsed.hostname:
        options["sslmode"] = "require"
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote((parsed.path or "/").lstrip("/")),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or 5432),
        "CONN_MAX_AGE": 60,
        "OPTIONS": options,
    }


use_sqlite = os.getenv("USE_SQLITE", "False").lower() in ("true", "1", "yes") or "test" in sys.argv
database_url = os.getenv("DATABASE_URL", "").strip()
if use_sqlite:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
elif database_url:
    DATABASES = {"default": _database_from_url(database_url)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "nepal_hemophilia"),
            "USER": os.getenv("POSTGRES_USER", "hemophilia_user"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "hemophilia_pass"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,
            "OPTIONS": {"connect_timeout": 5},
        }
    }

# ---------------------------------------------------------------------------
# Auth & DRF
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "config.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "300/minute" if DEBUG else "180/minute",
        "patient_login": "20/minute",
    },
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", "60"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_LIFETIME_DAYS", "7"))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Nepal Hemophilia Digital Management System API",
    "DESCRIPTION": "REST API for NHMS — patient care, treatment tracking, and reporting.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    ).split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Static & Media
# ---------------------------------------------------------------------------

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = os.getenv("MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / "media"

_default_file_storage = "django.core.files.storage.FileSystemStorage"
if USE_CLOUDINARY:
    _default_file_storage = "cloudinary_storage.storage.MediaCloudinaryStorage"

# Plain static storage — WhiteNoise middleware serves files from STATIC_ROOT (no compress/manifest step that breaks on Render)
_staticfiles_backend = "django.contrib.staticfiles.storage.StaticFilesStorage"
STORAGES = {
    "default": {"BACKEND": _default_file_storage},
    "staticfiles": {"BACKEND": _staticfiles_backend},
}
# django-cloudinary-storage collectstatic still reads these on Django 6+
STATICFILES_STORAGE = _staticfiles_backend
DEFAULT_FILE_STORAGE = _default_file_storage

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kathmandu"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Email (console backend in dev)
# ---------------------------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "True").lower() in ("true", "1", "yes")
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
    EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
