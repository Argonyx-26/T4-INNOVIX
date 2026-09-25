"""
Django settings for LearnLens Backend (learnlens_backend / core).

Configured for Render deployment and local development.
Includes CORS headers, Django REST Framework, WhiteNoise static handling,
and Firebase Admin SDK initialization stub.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load unified environment variables (.env)
load_dotenv(BASE_DIR / ".env")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-learnlens-diagnostic-engine-dev-secret-key-change-in-prod"
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

# Allowed hosts configuration (supporting local dev and Render)
raw_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,[::1],.onrender.com,testserver")
ALLOWED_HOSTS = [host.strip() for host in raw_hosts.split(",") if host.strip()]
if "testserver" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("testserver")

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
    # CORS middleware must be placed as high as possible, especially before CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Render optimized static files
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

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
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --------------------------------------------------------------------------
# Django REST Framework (DRF) Configuration
# --------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
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
        "anon": "10/min",
        "user": "60/min",
    },
}


# --------------------------------------------------------------------------
# CORS (Cross-Origin Resource Sharing) Configuration
# --------------------------------------------------------------------------
# Lock down CORS for production security
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
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


# --------------------------------------------------------------------------
# Firebase Configuration (Admin SDK & Public Client Config)
# --------------------------------------------------------------------------
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "gen-lang-client-0427554587")

FIREBASE_WEB_CONFIG = {
    "apiKey": os.getenv("FIREBASE_API_KEY", "AIzaSyBthKMnShNRdfR4r4KaUfpVOWJ3ogQ4RZw"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", "gen-lang-client-0427554587.firebaseapp.com"),
    "projectId": FIREBASE_PROJECT_ID,
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "gen-lang-client-0427554587.firebasestorage.app"),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", "229055675286"),
    "appId": os.getenv("FIREBASE_APP_ID", "1:229055675286:web:6ed01f89c92ffb5a087bb7"),
}

# Initialize Firebase Admin SDK or stub mode upon settings loading
try:
    from core.firebase import initialize_firebase_app
    FIREBASE_APP = initialize_firebase_app()
except Exception as _fb_err:
    import logging
    logging.getLogger("learnlens.core").warning(f"Could not initialize Firebase in settings: {_fb_err}")
    FIREBASE_APP = None
