"""
Django settings for LearnLens Backend (learnlens_backend / core).

Configured for Render deployment and local development.
Includes CORS headers, Django REST Framework, WhiteNoise static handling,
and Firebase Admin SDK initialization stub.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
# Monorepo package resolution
for candidate in [
    BASE_DIR.parent.parent / "packages" / "ai-engine",
    BASE_DIR / "packages" / "ai-engine",
]:
    if candidate.exists() and str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

# Load unified environment variables (.env)
for env_path in [
    BASE_DIR / ".env",
    BASE_DIR.parent.parent / ".env",
]:
    if env_path.exists():
        load_dotenv(env_path)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    os.getenv(
        "DJANGO_SECRET_KEY",
        "django-insecure-learnlens-diagnostic-engine-dev-secret-key-change-in-prod"
    )
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", os.getenv("DJANGO_DEBUG", "True")).lower() in ("true", "1", "yes")

# Allowed hosts configuration (supporting local dev and Render)
raw_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,[::1],.onrender.com,testserver")
ALLOWED_HOSTS = [host.strip() for host in raw_hosts.split(",") if host.strip()]
RENDER_EXTERNAL_HOSTNAME = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
if "testserver" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("testserver")
if DEBUG and "*" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("*")

# Application definition
INSTALLED_APPS = [
    # Django Built-in Apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-Party Apps
    "corsheaders",
    "rest_framework",

    # LearnLens Modular Apps
    "api.apps.ApiConfig",
]

MIDDLEWARE = [
    # CORS middleware must precede CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
]

try:
    import whitenoise  # noqa: F401
    MIDDLEWARE.append("whitenoise.middleware.WhiteNoiseMiddleware")  # Render optimized static files
except ImportError:
    pass

MIDDLEWARE.extend([
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
])


ROOT_URLCONF = "core.urls"

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

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# Database
# Default to SQLite for local development; supports DATABASE_URL in production (Render)
database_url = os.getenv("DATABASE_URL")
if database_url:
    try:
        import dj_database_url
        DATABASES = {"default": dj_database_url.config(default=database_url, conn_max_age=600)}
    except ImportError:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
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
# Django 5.1+ reads storage backends from STORAGES (STATICFILES_STORAGE was removed).
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
if "whitenoise.middleware.WhiteNoiseMiddleware" in MIDDLEWARE:
    STORAGES["staticfiles"]["BACKEND"] = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Production hardening (Render terminates HTTPS at its proxy)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").lower() in ("true", "1", "yes")
    SECURE_REDIRECT_EXEMPT = [r"^health/$"]  # platform health checks may use plain HTTP
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "3600"))
    SECURE_CONTENT_TYPE_NOSNIFF = True

# CORS Headers Configuration
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "False" if not DEBUG else "True").lower() in ("true", "1", "yes")
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    ).split(",") if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Django REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.authentication.FirebaseAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("DRF_ANON_THROTTLE_RATE", "10/min"),
        "user": os.getenv("DRF_USER_THROTTLE_RATE", "60/min"),
    },
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "UNAUTHENTICATED_USER": None,
}

if "test" in sys.argv or any("test" in arg for arg in sys.argv):
    REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []

# Firebase Web Configuration for Frontend Setup
FIREBASE_WEB_CONFIG = {
    "apiKey": os.getenv("FIREBASE_API_KEY", "AIzaSyBthKMnShNRdfR4r4KaUfpVOWJ3ogQ4RZw"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", "gen-lang-client-0427554587.firebaseapp.com"),
    "projectId": os.getenv("FIREBASE_PROJECT_ID", "gen-lang-client-0427554587"),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "gen-lang-client-0427554587.firebasestorage.app"),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", "229055675286"),
    "appId": os.getenv("FIREBASE_APP_ID", "1:229055675286:web:6ed01f89c92ffb5a087bb7"),
}
