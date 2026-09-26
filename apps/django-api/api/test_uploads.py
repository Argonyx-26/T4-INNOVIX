import hashlib
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

ENV = {"CLOUDINARY_CLOUD_NAME": "demo", "CLOUDINARY_API_KEY": "123", "CLOUDINARY_API_SECRET": "shh", "CLOUDINARY_UPLOAD_PRESET": "notes"}


class CloudinarySignatureTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_signs_without_exposing_secret(self):
        with mock.patch.dict("os.environ", ENV):
            res = APIClient().post("/api/uploads/cloudinary-signature/")
        body = res.json()
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("shh", str(body))
        expected = hashlib.sha1(f"timestamp={body['timestamp']}&upload_preset=notesshh".encode()).hexdigest()
        self.assertEqual(body["signature"], expected)
        self.assertEqual((body["cloud_name"], body["api_key"], body["upload_preset"]), ("demo", "123", "notes"))

    def test_unconfigured_returns_503(self):
        with mock.patch.dict("os.environ", {"CLOUDINARY_API_SECRET": ""}):
            self.assertEqual(APIClient().post("/api/uploads/cloudinary-signature/").status_code, 503)
