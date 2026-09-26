from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from api import teacher_insights

CONTEXT = {"students": [{"name": "Aarav Sharma", "overallMastery": 52, "activeMisconceptions": [{"title": "Adds probabilities", "count": 3}]}]}


class TeacherInsightsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def post(self, **body):
        payload = {"question": "How is Aarav doing?", "scope": "student", "context": CONTEXT, **body}
        return self.client.post("/api/teacher/insights/ask/", payload, format="json")

    def test_answers_from_supplied_data(self):
        with mock.patch.object(teacher_insights, "call_llm", return_value=("Aarav is at 52%.", "groq")) as llm:
            res = self.post(history=[{"role": "user", "content": "earlier"}, {"role": "system", "content": "ignored"}])
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"answer": "Aarav is at 52%.", "provider": "groq"})
        system, messages = llm.call_args[0]
        self.assertIn("ONLY from the JSON data", system)
        self.assertIn("never infer gender", system)
        self.assertEqual(len(messages), 2)  # system-role history turn dropped
        self.assertIn('"overallMastery":52', messages[-1]["content"])
        self.assertIn("TEACHER'S QUESTION: How is Aarav doing?", messages[-1]["content"])

    def test_validates_input(self):
        self.assertEqual(self.post(question="").status_code, 400)
        self.assertEqual(self.post(scope="everyone").status_code, 400)
        self.assertEqual(self.post(context="not a dict").status_code, 400)
        huge = {"students": [{"name": "x" * 50_000}]}
        self.assertEqual(self.post(context=huge).status_code, 400)

    def test_ai_unavailable(self):
        with mock.patch.object(teacher_insights, "call_llm", side_effect=teacher_insights.LLMUnavailable("none", rate_limited=True)):
            res = self.post()
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.json()["code"], "ai_rate_limited")
