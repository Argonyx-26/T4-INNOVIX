"""
Root URL Configuration for LearnLens Backend.
Routes incoming traffic to administrative interfaces and the decoupled API application.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """
    Service health check endpoint designed for Render web service monitoring.
    """
    return JsonResponse(
        {
            "status": "healthy",
            "service": "LearnLens Diagnostic Backend",
            "version": "1.0.0",
        },
        status=200,
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="service-health-check"),
    path("api/", include("api.urls")),
]
