from unittest import mock

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from api import voice
from api.tutor import ProviderRateLimited

URL = "/api/voice/transcribe/"


def clip(size=4000, content_type="audio/webm"):
    return SimpleUploadedFile("speech.webm", b"\x1a" * size, content_type=content_type)


class VoiceTranscribeTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def post(self, audio=None):
        return self.client.post(URL, {"audio": audio} if audio is not None else {}, format="multipart")

    def test_groq_transcribes(self):
        with mock.patch.object(voice, "PROVIDERS", [("groq", lambda *a: " Open the library. "), ("gemini", mock.Mock())]):
            res = self.post(clip())
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"text": "Open the library.", "provider": "groq"})

    def test_falls_back_to_gemini(self):
        def groq_fails(*a):
            raise RuntimeError("Groq down")

        with mock.patch.object(voice, "PROVIDERS", [("groq", groq_fails), ("gemini", lambda *a: "filter class 9")]):
            res = self.post(clip())
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["provider"], "gemini")

    def test_all_providers_fail(self):
        def busy(*a):
            raise ProviderRateLimited("429")

        with mock.patch.object(voice, "PROVIDERS", [("groq", busy), ("gemini", busy)]):
            res = self.post(clip())
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.json()["code"], "ai_rate_limited")

    def test_groq_request_shape(self):
        ok = mock.Mock(ok=True)
        ok.json.return_value = {"text": "help"}
        with mock.patch.dict("os.environ", {"GROQ_API_KEY": "k"}), mock.patch.object(voice.requests, "post", return_value=ok) as post:
            res = self.post(clip())
        self.assertEqual(res.json()["text"], "help")
        kwargs = post.call_args.kwargs
        self.assertEqual(kwargs["data"]["model"], "whisper-large-v3-turbo")
        self.assertEqual(kwargs["files"]["file"][0], "speech.webm")

    def test_rejects_bad_uploads(self):
        self.assertEqual(self.post().status_code, 400)
        self.assertEqual(self.post(clip(size=10)).status_code, 400)
        self.assertEqual(self.post(clip(size=voice.MAX_AUDIO_BYTES + 1)).status_code, 400)
        self.assertEqual(self.post(clip(content_type="text/plain")).status_code, 400)
