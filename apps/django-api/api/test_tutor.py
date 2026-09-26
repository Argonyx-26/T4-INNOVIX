import json
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from api import tutor


def _option(text, correct=False, key=None, title=None):
    return {
        "text": text,
        "correct": correct,
        "misconception": None if correct else {"key": key, "title": title, "explanation": f"{title} explanation"},
    }


def _question(n, bad=False):
    options = [
        _option(f"right {n}", correct=True),
        _option(f"wrong-a {n}", key="Adds Probabilities", title="Adds instead of multiplies"),
        _option(f"wrong-b {n}", key="adds-probabilities", title="Adds instead of multiplies"),
        _option(f"wrong-c {n}", key="ignores-independence", title="Ignores independence"),
    ]
    if bad:
        options[1]["correct"] = True  # two correct answers: must be rejected
    return {"question": f"Question {n}?", "explanation": f"Because {n}.", "options": options}


GENERATED = json.dumps(
    {"discipline": "Mathematics", "questions": [_question(1), _question(2), _question(3), _question(4, bad=True), _question(5)]}
)


class TutorApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def _generate(self, count=4):
        with mock.patch.object(tutor, "call_llm", return_value=(GENERATED, "gemini")):
            return self.client.post(
                "/api/tutor/test/generate/", {"topic": "Probability", "difficulty": "medium", "count": count}, format="json"
            )

    # --- providers -----------------------------------------------------------
    def test_falls_back_to_groq_when_gemini_fails(self):
        def gemini(*_):
            raise RuntimeError("quota exceeded")

        with mock.patch.object(tutor, "PROVIDERS", [("gemini", gemini), ("groq", lambda *_: "hello")]):
            self.assertEqual(tutor.call_llm("sys", [{"role": "user", "content": "hi"}]), ("hello", "groq"))

    def test_reports_unavailable_without_keys(self):
        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "", "GOOGLE_API_KEY": "", "GROQ_API_KEY": ""}):
            res = self.client.post("/api/tutor/chat/", {"messages": [{"role": "user", "content": "hi"}]}, format="json")
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.json()["code"], "ai_unavailable")
        self.assertIn("GEMINI_API_KEY is not set", res.json()["detail"])

    # --- chat ----------------------------------------------------------------
    def test_chat_validates_and_replies(self):
        bad = self.client.post("/api/tutor/chat/", {"messages": [{"role": "system", "content": "x"}]}, format="json")
        self.assertEqual(bad.status_code, 400)
        with mock.patch.object(tutor, "call_llm", return_value=("  Here is how it works.  ", "groq")) as llm:
            res = self.client.post(
                "/api/tutor/chat/",
                {"messages": [{"role": "user", "content": "Explain fractions"}], "topic": "Fractions"},
                format="json",
            )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"reply": "Here is how it works.", "provider": "groq"})
        self.assertIn("Fractions", llm.call_args[0][0])

    # --- generation -------------------------------------------------------------
    def test_generate_hides_answers_and_drops_malformed_questions(self):
        res = self._generate(count=5)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(len(body["questions"]), 4)  # question 4 had two correct options
        self.assertEqual(body["discipline"], "Mathematics")
        public = json.dumps(body["questions"])
        self.assertNotIn("correct", public)
        self.assertNotIn("misconception", public)
        self.assertNotIn("right 1", body["token"])  # encrypted, not just signed

    def test_generate_rejects_bad_input(self):
        for payload in ({"topic": "", "difficulty": "easy"}, {"topic": "x", "difficulty": "extreme"}, {"topic": "x", "difficulty": "easy", "count": 50}):
            self.assertEqual(self.client.post("/api/tutor/test/generate/", payload, format="json").status_code, 400)

    # --- analysis ---------------------------------------------------------------
    def test_analyze_grades_and_groups_repeated_misconceptions(self):
        gen = self._generate(count=4).json()
        token = tutor._unseal(gen["token"])
        answers = {}
        for i, q in enumerate(token["questions"]):
            correct = next(o for o in q["options"] if o["correct"])
            add_mistake = next(o for o in q["options"] if o["misconception"] and o["misconception"]["key"] == "adds-probabilities")
            answers[q["id"]] = correct["id"] if i == 0 else add_mistake["id"]
        answers[token["questions"][3]["id"]] = None  # skipped

        with mock.patch.object(tutor, "call_llm", side_effect=tutor.LLMUnavailable("none")):
            res = self.client.post("/api/tutor/test/analyze/", {"token": gen["token"], "answers": answers}, format="json")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual((body["score"], body["total"], body["answered"]), (1, 4, 3))
        # Two different option keys ("Adds Probabilities" / "adds-probabilities") normalise to one pattern.
        self.assertEqual(len(body["misconceptions"]), 1)
        self.assertEqual(body["misconceptions"][0]["key"], "adds-probabilities")
        self.assertEqual(body["misconceptions"][0]["count"], 2)
        self.assertIsNone(body["results"][3]["misconception"])  # skipped questions carry no misconception
        self.assertIn("1 out of 4", body["analysis"]["summary"])  # deterministic fallback when AI is down

    def test_analyze_rejects_tampered_token(self):
        gen = self._generate().json()
        res = self.client.post("/api/tutor/test/analyze/", {"token": gen["token"][:-4] + "abcd", "answers": {}}, format="json")
        self.assertEqual(res.status_code, 400)


class TutorResilienceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_failed_retry_keeps_first_batch(self):
        two_good = json.dumps({"questions": [_question(1), _question(2)]})
        calls = iter([(two_good, "groq"), tutor.LLMUnavailable("groq: usage limit reached", rate_limited=True)])

        def fake(*_args, **_kwargs):
            item = next(calls)
            if isinstance(item, Exception):
                raise item
            return item

        with mock.patch.object(tutor, "call_llm", side_effect=fake):
            res = self.client.post("/api/tutor/test/generate/", {"topic": "Probability", "difficulty": "easy", "count": 5}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["questions"]), 2)

    def test_rate_limit_gives_busy_message(self):
        def limited(*_):
            raise tutor.ProviderRateLimited("429")

        with mock.patch.object(tutor, "PROVIDERS", [("gemini", limited), ("groq", limited)]):
            res = self.client.post("/api/tutor/chat/", {"messages": [{"role": "user", "content": "hi"}]}, format="json")
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.json()["code"], "ai_rate_limited")
        self.assertIn("try again in a minute", res.json()["error"])


class NoEmojiTests(TestCase):
    def test_llm_output_is_stripped_and_prompt_forbids_emoji(self):
        seen = {}

        def provider(system, messages, json_mode):
            seen["system"] = system
            return "Great job \U0001F389\u2728 keep going \u2705 x \u2192 y"

        with mock.patch.object(tutor, "PROVIDERS", [("groq", provider)]):
            text, _ = tutor.call_llm("sys", [{"role": "user", "content": "hi"}])
        self.assertEqual(text, "Great job keep going x \u2192 y")
        self.assertIn("Never use emojis", seen["system"])
