"""
Speech-to-text for the LearnLens voice assistant.

Browsers' built-in speech recognition (Web Speech API) sends audio to the browser vendor's
cloud and fails with a "network" error on many networks and in Chromium builds without
Google's speech key. So the page records the audio itself and this endpoint transcribes it:
Groq Whisper first, Gemini as the fallback. Keys stay on the server.
"""
import logging
import os

import requests
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from core.authentication import FirebaseAuthentication
from api.tutor import LLMUnavailable, ProviderRateLimited, strip_emoji

logger = logging.getLogger(__name__)

GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
MIN_AUDIO_BYTES = 1_000
MAX_AUDIO_BYTES = 5 * 1024 * 1024
AUDIO_TYPES = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "mp4",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
    "audio/aac": "m4a",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/wave": "wav",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "video/webm": "webm",  # some browsers label audio-only webm recordings as video/webm
}
# Nudges Whisper towards the assistant's command vocabulary and spelling.
COMMAND_PROMPT = (
    "Voice commands for a learning app: nav diagnostic, nav library, nav pacing, give me a hint, "
    "filter class 9, toggle teacher, toggle student, help, open courses, AI tutor, misconceptions, study plan."
)


class VoiceRateThrottle(SimpleRateThrottle):
    scope = "voice_transcribe"
    rate = "30/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


def _transcribe_groq(audio: bytes, mime: str, ext: str) -> str:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise LLMUnavailable("GROQ_API_KEY is not set")
    response = requests.post(
        GROQ_STT_URL,
        headers={"Authorization": f"Bearer {key}"},
        files={"file": (f"speech.{ext}", audio, mime)},
        data={
            "model": os.environ.get("GROQ_STT_MODEL", "whisper-large-v3-turbo"),
            "language": "en",
            "response_format": "json",
            "temperature": "0",
            "prompt": COMMAND_PROMPT,
        },
        timeout=30,
    )
    if not response.ok:
        detail = f"Groq STT HTTP {response.status_code}: {response.text[:200]}"
        raise (ProviderRateLimited if response.status_code == 429 else RuntimeError)(detail)
    return str(response.json().get("text", ""))


def _transcribe_gemini(audio: bytes, mime: str, ext: str) -> str:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise LLMUnavailable("GEMINI_API_KEY is not set")
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=key)
    try:
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=[
                types.Part.from_bytes(data=audio, mime_type=mime.split(";")[0].replace("video/", "audio/")),
                "Transcribe this short English voice command exactly. Reply with only the spoken words, "
                "or nothing if there is no speech.",
            ],
        )
    except Exception as exc:
        if getattr(exc, "code", None) == 429:
            raise ProviderRateLimited(str(exc)[:200]) from exc
        raise
    return response.text or ""


PROVIDERS = [("groq", _transcribe_groq), ("gemini", _transcribe_gemini)]


def transcribe(audio: bytes, mime: str, ext: str):
    """Returns (text, provider_name), trying each provider in turn."""
    problems, rate_limited = [], False
    for name, fn in PROVIDERS:
        try:
            return strip_emoji(fn(audio, mime, ext)).strip(), name
        except LLMUnavailable as exc:
            problems.append(f"{name}: {exc}")
        except ProviderRateLimited as exc:
            logger.warning("[Voice] %s rate limited: %s", name, exc)
            problems.append(f"{name}: usage limit reached")
            rate_limited = True
        except Exception as exc:  # network, invalid key, unsupported audio...
            logger.warning("[Voice] %s failed: %s", name, exc)
            problems.append(f"{name}: request failed ({type(exc).__name__})")
    raise LLMUnavailable("; ".join(problems), rate_limited=rate_limited)


class VoiceTranscribeView(APIView):
    """POST /api/voice/transcribe/  multipart {audio} -> {text, provider}"""

    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [VoiceRateThrottle]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        upload = request.FILES.get("audio")
        if upload is None:
            return Response({"error": "No audio was sent."}, status=400)
        mime = (upload.content_type or "").split(";")[0].strip().lower()
        ext = AUDIO_TYPES.get(mime)
        if not ext:
            return Response({"error": "Unsupported audio format."}, status=400)
        if upload.size < MIN_AUDIO_BYTES:
            return Response({"error": "The recording was too short. Try again."}, status=400)
        if upload.size > MAX_AUDIO_BYTES:
            return Response({"error": "The recording is too long. Keep voice commands short."}, status=400)

        try:
            text, provider = transcribe(upload.read(), mime, ext)
        except LLMUnavailable as exc:
            busy = exc.rate_limited
            return Response(
                {
                    "error": "Voice recognition is busy right now. Try again in a minute, or type your command."
                    if busy
                    else "Voice recognition isn't available right now. Type your command instead.",
                    "detail": str(exc),
                    "code": "ai_rate_limited" if busy else "ai_unavailable",
                },
                status=503,
            )
        return Response({"text": text, "provider": provider})
