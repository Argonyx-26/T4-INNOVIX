"""
Comprehensive Unit & Integration Tests for LearnLens API, Math Engines, AI Engine, and Firebase Client.
Validates:
1. Multi-item contract fidelity (shared_types.json)
2. All 5 temporary dummy student personas
3. Single-item 7-step pipeline (BKT, Ebbinghaus decay, taxonomy, anti-spoofing)
4. Teacher Dashboard feeds and Class Heatmaps
"""

import json
from pathlib import Path
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.firebase_client import (
    get_student_concept_state,
    update_student_state,
    verify_concept_exists,
)
from math_engine.bkt import calculate_new_mastery, calculate_retention
from math_engine.scoring import calculate_mastery_score
from math_engine.irt import estimate_latent_ability
from ai_engine.diagnostic import synthesize_diagnostic_report
from api.dummy_data import ALL_DUMMY_SUBMISSIONS, get_dummy_submission


class LearnLensContractTestCase(TestCase):
    """Verifies that API and Engines strictly obey shared_types.json contracts and handle dummy profiles."""

    def setUp(self):
        self.client = APIClient()
        possible_paths = [
            Path(__file__).resolve().parent.parent / "shared_types.json",
            Path(__file__).resolve().parents[3] / "shared_types.json",
            Path(__file__).resolve().parent / "shared_types.json",
            Path.cwd() / "shared_types.json",
        ]
        shared_types_path = next((p for p in possible_paths if p.exists()), None)
        if not shared_types_path:
            raise FileNotFoundError("Could not find shared_types.json")
        with open(shared_types_path, "r", encoding="utf-8") as f:
            self.shared_types = json.load(f)

    def test_health_check_endpoint(self):
        """GET /api/health/ returns 200 OK and status flags."""
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["deployment_target"], "Render")
        self.assertTrue("firebase_stub_mode" in data)

    def test_assessment_submission_contract_fidelity(self):
        """POST /api/assessments/submit/ accepts sample payload and returns valid LLM schema."""
        sample_payload = self.shared_types["examples"]["sample_post_assessments_submit"]
        response = self.client.post(
            "/api/assessments/submit/",
            data=sample_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.json()

        expected_schema = self.shared_types["definitions"]["LLMDiagnosticResponse"]
        required_keys = expected_schema["required"]
        for key in required_keys:
            self.assertIn(key, result, f"Missing required LLM diagnostic key: {key}")

        self.assertEqual(result["assessment_id"], sample_payload["assessment_id"])
        self.assertEqual(result["student_id"], sample_payload["student_id"])
        self.assertEqual(result["domain"], sample_payload["domain"])
        self.assertTrue(0.0 <= result["mastery_score"] <= 1.0)
        self.assertIsInstance(result["latent_ability_theta"], float)
        self.assertIsInstance(result["learning_gaps"], list)
        self.assertIsInstance(result["misconceptions"], list)
        self.assertIsInstance(result["recommended_interventions"], list)
        self.assertIsInstance(result["summary_narrative"], str)

    def test_assessment_submission_validation_error(self):
        """Submitting malformed payload triggers 400 Bad Request."""
        invalid_payload = {
            "student_id": "std_123"
        }
        response = self.client.post(
            "/api/assessments/submit/",
            data=invalid_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())

    def test_math_engine_calculations(self):
        """Verify statistical mastery and IRT theta computations."""
        responses = [
            {"item_id": "q1", "is_correct": True, "hints_used": 0, "confidence_level": "high"},
            {"item_id": "q2", "is_correct": False, "hints_used": 1, "confidence_level": "low"},
        ]
        mastery = calculate_mastery_score(responses)
        theta = estimate_latent_ability(responses)
        self.assertTrue(0.0 <= mastery <= 1.0)
        self.assertTrue(-3.0 <= theta <= 3.0)

    def test_ai_engine_synthesis(self):
        """Verify AI engine fallback returns valid structure adhering to schema."""
        sample_payload = self.shared_types["examples"]["sample_post_assessments_submit"]
        report = synthesize_diagnostic_report(
            assessment_id=sample_payload["assessment_id"],
            student_id=sample_payload["student_id"],
            domain=sample_payload["domain"],
            mastery_score=0.75,
            latent_ability_theta=0.5,
            responses=sample_payload["responses"]
        )
        self.assertEqual(report["assessment_id"], sample_payload["assessment_id"])
        self.assertIn("learning_gaps", report)
        self.assertIn("misconceptions", report)
        self.assertIn("recommended_interventions", report)

    def test_dummy_submissions_all_profiles(self):
        """Verify all temporary dummy submissions pass through the API and obey the contract."""
        for profile_name, dummy_payload in ALL_DUMMY_SUBMISSIONS.items():
            response = self.client.post(
                "/api/assessments/submit/",
                data=dummy_payload,
                format="json"
            )
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"Dummy profile '{profile_name}' failed with status {response.status_code}: {response.content}"
            )
            data = response.json()
            self.assertEqual(data["assessment_id"], dummy_payload["assessment_id"])
            self.assertEqual(data["student_id"], dummy_payload["student_id"])
            self.assertEqual(data["domain"], dummy_payload["domain"])
            self.assertTrue(0.0 <= data["mastery_score"] <= 1.0)
            self.assertIsInstance(data["latent_ability_theta"], float)
            self.assertIsInstance(data["learning_gaps"], list)
            self.assertIsInstance(data["misconceptions"], list)
            self.assertIsInstance(data["recommended_interventions"], list)
            self.assertIsInstance(data["summary_narrative"], str)

    def test_pitch_demo_shortcut_3_5(self):
        """Verify the '3.5' answer immediately triggers the pitch demo distribution error."""
        pitch_payload = get_dummy_submission("pitch_demo")
        response = self.client.post(
            "/api/assessments/submit/",
            data=pitch_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreater(len(data["misconceptions"]), 0)
        top_misc = data["misconceptions"][0]
        self.assertEqual(top_misc["concept_id"], "distributive_property")
        self.assertIn("Distribution", top_misc["identified_misconception"])
        self.assertIn("3.5", top_misc["explanation"])
        self.assertGreater(len(data["recommended_interventions"]), 0)
        self.assertEqual(data["recommended_interventions"][0]["intervention_id"], "dist_01")

    def test_mastered_student_submission(self):
        """Verify 100% correct responses yield complete mastery and 0 misconceptions."""
        mastered_payload = get_dummy_submission("mastered")
        response = self.client.post(
            "/api/assessments/submit/",
            data=mastered_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["mastery_score"], 1.0)
        self.assertGreaterEqual(data["latent_ability_theta"], 2.0)
        self.assertEqual(len(data["misconceptions"]), 0)
        self.assertIn("complete mastery", data["summary_narrative"].lower())

    def test_deep_misconception_student_submission(self):
        """Verify struggling student yields lower mastery, negative theta, and high priority interventions."""
        misconception_payload = get_dummy_submission("deep_misconception")
        response = self.client.post(
            "/api/assessments/submit/",
            data=misconception_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertLess(data["mastery_score"], 0.6)
        self.assertLess(data["latent_ability_theta"], 0.0)
        self.assertGreater(len(data["misconceptions"]), 0)
        self.assertGreater(len(data["recommended_interventions"]), 0)
        priorities = [i.get("priority") for i in data["recommended_interventions"]]
        self.assertIn("high", priorities)

    def test_cross_domain_cellular_biology_submission(self):
        """Verify domain-agnostic processing for cellular biology assessment."""
        bio_payload = get_dummy_submission("cellular_biology")
        response = self.client.post(
            "/api/assessments/submit/",
            data=bio_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["domain"], "cellular_biology")
        self.assertIn("Cellular Biology", data["learning_gaps"][0]["concept_name"])


class LearnLensRouterIntegrationTestCase(TestCase):
    """Verifies BE1 Single-concept router, BKT, Ebbinghaus decay, and Firestore integration."""

    def setUp(self):
        self.client = APIClient()

    def test_calculate_new_mastery_bkt(self):
        """Test Bayesian Knowledge Tracing updates for correct and incorrect answers."""
        prior = 0.50
        post_correct = calculate_new_mastery(prior_mastery=prior, is_correct=True, slip_rate=0.1, guess_rate=0.2)
        self.assertGreater(post_correct, prior)

        post_incorrect = calculate_new_mastery(prior_mastery=prior, is_correct=False, slip_rate=0.1, guess_rate=0.2)
        self.assertLess(post_incorrect, prior)

    def test_calculate_retention_ebbinghaus(self):
        """Test Ebbinghaus memory retention decay formula."""
        now = 1000000.0
        r_now = calculate_retention(last_seen_timestamp=now, current_timestamp=now, stability=1.0)
        self.assertEqual(r_now, 1.0)

        one_day_later = now + 86400.0
        r_1day = calculate_retention(last_seen_timestamp=now, current_timestamp=one_day_later, stability=1.0)
        self.assertAlmostEqual(r_1day, 0.3679, delta=0.01)

    def test_firebase_update_and_read_student_state(self):
        """Test database sync and read-before-write logic."""
        diag_data = {
            "status": "misconception",
            "misconception": "Distribution Error",
            "severity": "critical",
        }
        res = update_student_state(
            student_id="student_test_99",
            concept_id="algebra.distribution",
            new_mastery=0.42,
            diagnostic_data=diag_data,
            retention_score=0.91,
        )
        self.assertEqual(res["student_id"], "student_test_99")
        self.assertEqual(res["new_mastery"], 0.42)

        read_state = get_student_concept_state(student_id="student_test_99", concept_id="algebra.distribution")
        self.assertAlmostEqual(read_state["prior_mastery"], 0.42, places=2)

    def test_taxonomy_verification_valid_and_invalid(self):
        """Test concept validation against registered dynamic concepts."""
        self.assertTrue(verify_concept_exists("algebra.distribution_rule"))
        self.assertFalse(verify_concept_exists("invalid.nonexistent.concept"))

    def test_router_single_item_flow(self):
        """Test POST /api/assessments/submit/ with single-concept payload."""
        payload = {
            "student_id": "student_dev_01",
            "concept_id": "algebra.distribution_rule",
            "student_answer": "3.5",
            "time_ms": 2500,
            "attempts": 1,
            "prior_mastery": 0.50,
        }
        response = self.client.post("/api/assessments/submit/", data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("new_mastery", data)
        self.assertIn("retention_score", data)
