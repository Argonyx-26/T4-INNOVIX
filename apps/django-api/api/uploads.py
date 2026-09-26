"""
Cloudinary upload signing.

Signed uploads need the Cloudinary API secret, which must never reach the browser bundle.
The page asks this endpoint for a short-lived signature, then uploads the file straight to
Cloudinary with it (the file itself never passes through our server).
"""
import hashlib
import os
import time

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from core.authentication import FirebaseAuthentication


class UploadSignThrottle(SimpleRateThrottle):
    scope = "upload_sign"
    rate = "20/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


def sign_params(params: dict, secret: str) -> str:
    """Cloudinary signature: SHA-1 of the sorted key=value pairs joined by '&', followed by the secret."""
    to_sign = "&".join(f"{k}={params[k]}" for k in sorted(params))
    return hashlib.sha1(f"{to_sign}{secret}".encode()).hexdigest()


class CloudinarySignatureView(APIView):
    """POST /api/uploads/cloudinary-signature/ -> {cloud_name, api_key, timestamp, upload_preset, signature}"""

    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [UploadSignThrottle]

    def post(self, request, *args, **kwargs):
        cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
        api_key = os.environ.get("CLOUDINARY_API_KEY", "")
        secret = os.environ.get("CLOUDINARY_API_SECRET", "")
        preset = os.environ.get("CLOUDINARY_UPLOAD_PRESET", "notes-portal")
        if not (cloud_name and api_key and secret):
            return Response({"error": "File uploads aren't configured on the server."}, status=503)

        timestamp = str(int(time.time()))
        return Response(
            {
                "cloud_name": cloud_name,
                "api_key": api_key,
                "timestamp": timestamp,
                "upload_preset": preset,
                "signature": sign_params({"timestamp": timestamp, "upload_preset": preset}, secret),
            }
        )
