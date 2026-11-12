"""Settings for Group Cookbook in local development and on Vercel."""

import os
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool = False) -> bool:
    """Read a conventional true/false environment variable."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


DEBUG = env_bool("DJANGO_DEBUG", default=not bool(os.getenv("VERCEL")))
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dishbook-local-development-only")

if not DEBUG and SECRET_KEY == "dishbook-local-development-only":
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is false.")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "localhost,127.0.0.1,.vercel.app",
    ).split(",")
    if host.strip()
]

# The portfolio site proxies /recipes/* here, so requests and form posts can arrive from its domain.
PORTFOLIO_HOSTS = ["www.roscoemoedl.com", "roscoemoedl.com"]
for host in PORTFOLIO_HOSTS:
    if host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(host)

vercel_url = os.getenv("VERCEL_URL")
if vercel_url and vercel_url not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(vercel_url)

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]
if vercel_url:
    CSRF_TRUSTED_ORIGINS.append(f"https://{vercel_url}")
CSRF_TRUSTED_ORIGINS += [f"https://{host}" for host in PORTFOLIO_HOSTS]


INSTALLED_APPS = [
    "dishbook",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
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
]

ROOT_URLCONF = "project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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

WSGI_APPLICATION = "project.wsgi.application"
ASGI_APPLICATION = "project.asgi.application"


database_url = os.getenv("DATABASE_URL")
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=0,
        conn_health_checks=True,
        ssl_require=bool(database_url),
    )
}


# Sign-in is Google only (see dishbook/google_oauth.py); accounts have no usable passwords.
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
# Verified Google addresses that get the admin (staff + superuser) on sign-in.
COOKBOOK_ADMIN_EMAILS = {
    email.strip().lower() for email in os.getenv("COOKBOOK_ADMIN_EMAILS", "").split(",") if email.strip()
}
# Where visitors reach the cookbook. Google sign-in always starts and ends here so the session
# cookie lands on this domain even for someone who opened the vercel.app address directly.
# Empty means "the address of the current request", which is what local development wants.
COOKBOOK_PUBLIC_ORIGIN = os.getenv(
    "COOKBOOK_PUBLIC_ORIGIN", "" if DEBUG else "https://www.roscoemoedl.com"
).rstrip("/")

LOGIN_URL = "signin"

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "America/Denver")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/recipes/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}

MEDIA_URL = "/recipes/media/"
MEDIA_ROOT = BASE_DIR / "media"
# Existing migrations intentionally use 32-bit AutoField primary keys.
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 0 if DEBUG else 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
