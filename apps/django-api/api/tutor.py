"""
AI tutor endpoints: tutoring chat, topic test generation and answer analysis.

Providers are tried in order (Gemini, then Groq). Keys come from the environment
(GEMINI_API_KEY / GROQ_API_KEY) and never leave the server. Model names can be
overridden with GEMINI_MODEL / GROQ_MODEL.

The answer key for a generated test is returned to the client encrypted, so the
student cannot read the answers; the server decrypts it again when grading.
"""
import base64
import hashlib
import json
import logging
import os
import random
import re
import uuid

import requests
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from core.authentication import FirebaseAuthentication

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DIFFICULTIES = {"easy", "medium", "hard"}
DISCIPLINES = [
    "Mathematics",
    "Computer Science",
    "Medicine & Physiology",
    "Commerce & Finance",
    "Law & Humanities",
    "Natural Sciences",
]
TEST_TTL_SECONDS = 3 * 60 * 60
MAX_CHAT_MESSAGES = 30
MAX_MESSAGE_CHARS = 4000
OPTION_IDS = ["A", "B", "C", "D"]

TUTOR_SYSTEM_PROMPT = (
    "You are Eduvia's AI tutor for school and university students. Teach clearly and patiently: "
    "explain step by step, use short examples, and check understanding with a quick question when useful. "
    "When a student makes a mistake, name the underlying misconception kindly and show the correct reasoning. "
    "Keep answers focused and under about 250 words unless the student asks for more detail. "
    "Use light Markdown only: **bold**, bullet lists, numbered steps and fenced code blocks. "
    "If the student wants to be tested, suggest the 'Topic test' tab. "
    "Stay on educational topics and politely decline requests that are unrelated, unsafe, or ask you to write graded work for them."
)


class LLMUnavailable(Exception):
    """No provider could produce a response."""

    def __init__(self, message: str, rate_limited: bool = False):
        super().__init__(message)
        self.rate_limited = rate_limited


class ProviderRateLimited(RuntimeError):
    """The provider rejected the call because a usage quota was hit."""


class TutorRateThrottle(SimpleRateThrottle):
    """Per-client limit that protects free-tier AI quotas."""

    scope = "ai_tutor"
    rate = "20/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------
def _call_gemini(system: str, messages: list, json_mode: bool) -> str:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise LLMUnavailable("GEMINI_API_KEY is not set")
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=key)
    contents = [
        types.Content(role="model" if m["role"] == "assistant" else "user", parts=[types.Part(text=m["content"])])
        for m in messages
    ]
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.4 if json_mode else 0.7,
        response_mime_type="application/json" if json_mode else None,
    )
    try:
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"), contents=contents, config=config
        )
    except Exception as exc:
        if getattr(exc, "code", None) == 429:
            raise ProviderRateLimited(str(exc)[:200]) from exc
        raise
    if not response.text:
        raise ValueError("Gemini returned an empty response")
    return response.text


def _call_groq(system: str, messages: list, json_mode: bool) -> str:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise LLMUnavailable("GROQ_API_KEY is not set")
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    body = {
        "model": model,
        "messages": [{"role": "system", "content": system}, *messages],
        "temperature": 0.4 if json_mode else 0.7,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    if model.startswith("openai/gpt-oss"):
        # Reasoning tokens count against Groq's tokens-per-minute quota; keep them small.
        body["reasoning_effort"] = "low"
    response = requests.post(GROQ_URL, headers={"Authorization": f"Bearer {key}"}, json=body, timeout=60)
    if not response.ok:
        try:
            error = response.json().get("error", {})
        except ValueError:
            error = {}
        detail = f"Groq HTTP {response.status_code} {error.get('code', '')}: {str(error.get('message', ''))[:200]}"
        raise (ProviderRateLimited if response.status_code == 429 else RuntimeError)(detail)
    return response.json()["choices"][0]["message"]["content"]


PROVIDERS = [("gemini", _call_gemini), ("groq", _call_groq)]


def call_llm(system: str, messages: list, json_mode: bool = False):
    """Returns (text, provider_name), trying each configured provider in turn."""
    problems, rate_limited = [], False
    for name, fn in PROVIDERS:
        try:
            return fn(system, messages, json_mode), name
        except LLMUnavailable as exc:
            problems.append(f"{name}: {exc}")
        except ProviderRateLimited as exc:
            logger.warning("[AI Tutor] %s rate limited: %s", name, exc)
            problems.append(f"{name}: usage limit reached")
            rate_limited = True
        except Exception as exc:  # network, invalid key, bad model name...
            logger.warning("[AI Tutor] %s failed: %s", name, exc)
            problems.append(f"{name}: request failed ({type(exc).__name__})")
    raise LLMUnavailable("; ".join(problems), rate_limited=rate_limited)


def _parse_json(text: str):
    text = text.strip()
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    return json.loads(text)


def _unavailable_response(exc: LLMUnavailable):
    busy = getattr(exc, "rate_limited", False)
    return Response(
        {
            "error": (
                "The AI tutor is busy right now (free usage limit reached). Please try again in a minute."
                if busy
                else "The AI tutor is not available right now."
            ),
            "detail": str(exc),
            "code": "ai_rate_limited" if busy else "ai_unavailable",
        },
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


# ---------------------------------------------------------------------------
# Answer-key encryption
# ---------------------------------------------------------------------------
def _fernet() -> Fernet:
    digest = hashlib.sha256(f"{settings.SECRET_KEY}:eduvia-ai-test".encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def _seal(payload: dict) -> str:
    return _fernet().encrypt(json.dumps(payload).encode()).decode()


def _unseal(token: str) -> dict:
    return json.loads(_fernet().decrypt(token.encode(), ttl=TEST_TTL_SECONDS))


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
def _clean_text(value, limit: int) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")[:60] or "unspecified"


def _normalise_questions(raw) -> list:
    """Keeps only well-formed questions: 4 options, exactly one correct, every distractor tagged."""
    questions = []
    for item in (raw or {}).get("questions", []) if isinstance(raw, dict) else []:
        if not isinstance(item, dict):
            continue
        question = _clean_text(item.get("question"), 600)
        options = item.get("options") if isinstance(item.get("options"), list) else []
        if not question or len(options) != 4:
            continue
        cleaned, valid = [], True
        for opt in options:
            if not isinstance(opt, dict) or not _clean_text(opt.get("text"), 300):
                valid = False
                break
            correct = opt.get("correct") is True
            misconception = None
            if not correct:
                m = opt.get("misconception") if isinstance(opt.get("misconception"), dict) else {}
                title = _clean_text(m.get("title"), 100)
                if not title:
                    valid = False
                    break
                misconception = {
                    "key": _slug(m.get("key") or title),
                    "title": title,
                    "explanation": _clean_text(m.get("explanation"), 400),
                }
            cleaned.append({"text": _clean_text(opt.get("text"), 300), "correct": correct, "misconception": misconception})
        if not valid or sum(o["correct"] for o in cleaned) != 1:
            continue
        if len({o["text"].lower() for o in cleaned}) != 4:
            continue
        random.shuffle(cleaned)  # models tend to put the correct answer first
        questions.append(
            {
                "question": question,
                "options": [dict(o, id=OPTION_IDS[i]) for i, o in enumerate(cleaned)],
                "explanation": _clean_text(item.get("explanation"), 600),
            }
        )
    return questions


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------
class TutorChatView(APIView):
    """POST /api/tutor/chat/  {messages: [{role, content}], topic?} -> {reply, provider}"""

    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [TutorRateThrottle]

    def post(self, request, *args, **kwargs):
        messages = request.data.get("messages")
        if not isinstance(messages, list) or not 1 <= len(messages) <= MAX_CHAT_MESSAGES:
            return Response({"error": f"Send between 1 and {MAX_CHAT_MESSAGES} messages."}, status=400)
        cleaned = []
        for m in messages:
            if not isinstance(m, dict) or m.get("role") not in ("user", "assistant"):
                return Response({"error": "Each message needs a role of 'user' or 'assistant'."}, status=400)
            content = str(m.get("content") or "").strip()
            if not content or len(content) > MAX_MESSAGE_CHARS:
                return Response({"error": f"Messages must be 1–{MAX_MESSAGE_CHARS} characters."}, status=400)
            cleaned.append({"role": m["role"], "content": content})
        if cleaned[-1]["role"] != "user":
            return Response({"error": "The last message must be from the student."}, status=400)

        system = TUTOR_SYSTEM_PROMPT
        topic = _clean_text(request.data.get("topic"), 120)
        if topic:
            system += f"\nThe student is currently studying: {topic}."
        try:
            reply, provider = call_llm(system, cleaned[-20:])
        except LLMUnavailable as exc:
            return _unavailable_response(exc)
        return Response({"reply": reply.strip(), "provider": provider})


class TutorTestGenerateView(APIView):
    """POST /api/tutor/test/generate/  {topic, difficulty, count, known_misconceptions?}"""

    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [TutorRateThrottle]

    def post(self, request, *args, **kwargs):
        topic = _clean_text(request.data.get("topic"), 120)
        difficulty = str(request.data.get("difficulty", "")).lower()
        try:
            count = int(request.data.get("count", 5))
        except (TypeError, ValueError):
            count = 0
        if not topic:
            return Response({"error": "Choose a topic for the test."}, status=400)
        if difficulty not in DIFFICULTIES:
            return Response({"error": "Difficulty must be easy, medium or hard."}, status=400)
        if not 3 <= count <= 15:
            return Response({"error": "A test can have 3 to 15 questions."}, status=400)

        known = request.data.get("known_misconceptions") or []
        known_lines = [
            f'- key "{_slug(k.get("key"))}": {_clean_text(k.get("title"), 100)}'
            for k in known[:30]
            if isinstance(k, dict) and k.get("key")
        ]

        system = (
            "You write multiple-choice diagnostic tests for students. Every wrong option must be a plausible answer "
            "that a student holding one specific misconception would pick. Respond with JSON only."
        )
        prompt = (
            f"Write {count} {difficulty} multiple-choice questions on the topic given below.\n"
            f"Topic: {json.dumps(topic)}\n\n"
            "Rules:\n"
            "- Exactly 4 options per question and exactly one correct option.\n"
            "- Each incorrect option carries a misconception with a short kebab-case 'key', a student-friendly 'title' "
            "(max 8 words) and a one-sentence 'explanation' of the faulty reasoning.\n"
            "- Reuse the same key whenever two options reflect the same misconception.\n"
            "- Cover different sub-skills of the topic; avoid 'all of the above' style options.\n"
            "- Set 'discipline' to the best match from: " + ", ".join(DISCIPLINES) + ".\n"
            "- If the topic is not an educational subject, return {\"questions\": []}.\n"
        )
        if known_lines:
            prompt += (
                "\nThis student has shown these misconceptions before. When a distractor reflects one of them, "
                "use exactly the same key:\n" + "\n".join(known_lines) + "\n"
            )
        prompt += (
            '\nJSON shape: {"discipline": string, "questions": [{"question": string, "explanation": string, '
            '"options": [{"text": string, "correct": boolean, '
            '"misconception": {"key": string, "title": string, "explanation": string} | null}]}]}'
        )

        # One retry if too few usable questions come back; the best attempt wins, so a failed
        # retry (e.g. rate limit) never throws away a usable first batch.
        questions, discipline, provider = [], "Natural Sciences", None
        for _attempt in range(2):
            try:
                text, used = call_llm(system, [{"role": "user", "content": prompt}], json_mode=True)
            except LLMUnavailable as exc:
                if questions:
                    break
                return _unavailable_response(exc)
            try:
                raw = _parse_json(text)
            except (json.JSONDecodeError, TypeError):
                continue
            candidate = _normalise_questions(raw)[:count]
            if len(candidate) > len(questions):
                questions, provider = candidate, used
                if raw.get("discipline") in DISCIPLINES:
                    discipline = raw["discipline"]
            if len(questions) >= max(3, int(count * 0.6)):
                break

        if not questions:
            return Response(
                {"error": "The AI couldn't write a test for that topic. Try a more specific school or university topic."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        for i, q in enumerate(questions, start=1):
            q["id"] = f"q{i}"
        test_id = uuid.uuid4().hex
        token = _seal(
            {
                "test_id": test_id,
                "topic": topic,
                "difficulty": difficulty,
                "discipline": discipline,
                "provider": provider,
                "questions": questions,
            }
        )
        return Response(
            {
                "test_id": test_id,
                "topic": topic,
                "difficulty": difficulty,
                "discipline": discipline,
                "provider": provider,
                "token": token,
                "questions": [
                    {"id": q["id"], "question": q["question"], "options": [{"id": o["id"], "text": o["text"]} for o in q["options"]]}
                    for q in questions
                ],
            }
        )


class TutorTestAnalyzeView(APIView):
    """POST /api/tutor/test/analyze/  {token, answers: {questionId: optionId | null}}"""

    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [TutorRateThrottle]

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        answers = request.data.get("answers")
        if not isinstance(token, str) or not isinstance(answers, dict):
            return Response({"error": "Send the test token and your answers."}, status=400)
        try:
            test = _unseal(token)
        except InvalidToken:
            return Response({"error": "This test has expired or is invalid. Please start a new one."}, status=400)

        results, misconceptions = [], {}
        for q in test["questions"]:
            chosen_id = answers.get(q["id"])
            options = {o["id"]: o for o in q["options"]}
            correct = next(o for o in q["options"] if o["correct"])
            chosen = options.get(chosen_id)
            entry = {
                "id": q["id"],
                "question": q["question"],
                "chosen_id": chosen["id"] if chosen else None,
                "chosen_text": chosen["text"] if chosen else None,
                "correct_id": correct["id"],
                "correct_text": correct["text"],
                "is_correct": bool(chosen and chosen["correct"]),
                "explanation": q["explanation"],
                "misconception": chosen["misconception"] if chosen and not chosen["correct"] else None,
            }
            results.append(entry)
            m = entry["misconception"]
            if m:
                agg = misconceptions.setdefault(m["key"], {**m, "count": 0, "question_ids": []})
                agg["count"] += 1
                agg["question_ids"].append(q["id"])

        score = sum(r["is_correct"] for r in results)
        answered = sum(r["chosen_id"] is not None for r in results)
        found = sorted(misconceptions.values(), key=lambda m: -m["count"])
        analysis, provider = self._analyse(test, results, found, score)

        return Response(
            {
                "test_id": test["test_id"],
                "topic": test["topic"],
                "difficulty": test["difficulty"],
                "discipline": test.get("discipline", "Natural Sciences"),
                "score": score,
                "total": len(results),
                "answered": answered,
                "results": results,
                "misconceptions": found,
                "analysis": analysis,
                "provider": provider,  # provider that wrote the feedback; None means the built-in summary
            }
        )

    @staticmethod
    def _analyse(test, results, found, score):
        """AI-written feedback, with a deterministic fallback so grading never depends on the AI."""
        wrong = [r for r in results if not r["is_correct"]]
        fallback = {
            "summary": (
                f"You scored {score} out of {len(results)} on {test['topic']}."
                + (f" The main pattern to work on is: {found[0]['title']}." if found else " No misconception patterns were detected.")
            ),
            "strengths": [r["question"][:120] for r in results if r["is_correct"]][:3],
            "focus_areas": [f"{m['title']} ({m['count']}×)" for m in found][:4],
            "next_steps": ["Review the explanations below, then ask the AI tutor about any step that still feels unclear."],
        }
        if not wrong:
            return fallback, None
        prompt = (
            f"A student took a {test['difficulty']} test on {json.dumps(test['topic'])} and scored {score}/{len(results)}.\n"
            "Wrong or skipped answers:\n"
            + "\n".join(
                f"- Q: {r['question']} | chose: {r['chosen_text'] or '(skipped)'} | correct: {r['correct_text']}"
                + (f" | misconception: {r['misconception']['title']}" if r["misconception"] else "")
                for r in wrong
            )
            + '\n\nWrite encouraging, specific feedback addressed to the student as JSON: '
            '{"summary": string (2-3 sentences), "strengths": [string], "focus_areas": [string], "next_steps": [string]} '
            "with at most 4 items per list."
        )
        try:
            text, provider = call_llm("You are a supportive teacher giving test feedback. Respond with JSON only.", [{"role": "user", "content": prompt}], json_mode=True)
            data = _parse_json(text)
            analysis = {
                "summary": _clean_text(data.get("summary"), 800) or fallback["summary"],
                "strengths": [_clean_text(s, 200) for s in data.get("strengths", []) if s][:4],
                "focus_areas": [_clean_text(s, 200) for s in data.get("focus_areas", []) if s][:4],
                "next_steps": [_clean_text(s, 200) for s in data.get("next_steps", []) if s][:4],
            }
            return analysis, provider
        except (LLMUnavailable, json.JSONDecodeError, TypeError, AttributeError) as exc:
            logger.info("[AI Tutor] Using fallback analysis: %s", exc)
            return fallback, None
