"""
Django settings for splattopblog project.
"""

import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me-in-production")
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
CSRF_TRUSTED_ORIGINS = os.environ.get("CSRF_TRUSTED_ORIGINS", "http://localhost:8000").split(",")

# Application definition
INSTALLED_APPS = [
    # Django apps (must come before Wagtail)
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Wagtail apps
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail",
    "wagtailmarkdown",
    # Wagtail dependencies
    "modelcluster",
    "taggit",
    # Health checks
    "health_check",
    "health_check.db",
    # Project apps
    "home",
    "blog",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

ROOT_URLCONF = "splattopblog.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "splattopblog.wsgi.application"

# Database
# Use PostgreSQL in production, SQLite for local development
def get_env(primary_key: str, *fallback_keys: str, default: str | None = None) -> str | None:
    for key in (primary_key, *fallback_keys):
        value = os.environ.get(key)
        if value:
            return value
    return default


def parse_database_url(database_url: str) -> dict:
    parsed = urlparse(database_url)
    scheme = parsed.scheme.split("+", 1)[0]
    if scheme not in {"postgres", "postgresql"}:
        raise ValueError(f"Unsupported DATABASE_URL scheme: {parsed.scheme}")

    config: dict[str, object] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": (parsed.path or "").lstrip("/") or "splattopblog",
        "USER": parsed.username or "",
        "PASSWORD": parsed.password or "",
        "HOST": parsed.hostname or "",
    }
    if parsed.port:
        config["PORT"] = str(parsed.port)

    query = parse_qs(parsed.query)
    options: dict[str, str] = {}
    if "sslmode" in query:
        options["sslmode"] = query["sslmode"][0]
    if "options" in query:
        options["options"] = query["options"][0]
    if options:
        config["OPTIONS"] = options
    return config


database_url = os.environ.get("DATABASE_URL")
sql_host = get_env("SQL_HOST", "DB_HOST")
if database_url:
    DATABASES = {
        "default": parse_database_url(database_url),
    }
elif sql_host:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": get_env("SQL_DATABASE", "DB_NAME", default="splattopblog"),
            "USER": get_env("SQL_USER", "DB_USER", default="postgres"),
            "PASSWORD": get_env("SQL_PASSWORD", "DB_PASSWORD", default=""),
            "HOST": sql_host or "localhost",
            "PORT": get_env("SQL_PORT", "DB_PORT", default="5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

# Use whitenoise manifest storage only in production
if DEBUG:
    STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
else:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Wagtail settings
WAGTAIL_SITE_NAME = "SplatTop Blog"
WAGTAILADMIN_BASE_URL = os.environ.get("WAGTAILADMIN_BASE_URL", "http://localhost:8000")

# Search backend
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}

# Wagtail Markdown settings
WAGTAILMARKDOWN = {
    "autodownload_fontawesome": False,
    "allowed_tags": [],  # Empty = allow all
    "allowed_attributes": {},  # Empty = allow all
    "allowed_styles": [],
    "extensions": [
        "extra",
        "codehilite",
        "tables",
        "toc",
        "nl2br",
        "smarty",
    ],
    "extension_configs": {
        "codehilite": {
            "linenums": True,
        }
    },
}
