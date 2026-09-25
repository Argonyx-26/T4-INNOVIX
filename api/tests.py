"""
Comprehensive Unit & Integration Tests for LearnLens API, Math Engines, and Firebase Client.
Validates Phase 2 & 3: Security, Serializer, Taxonomy Validation, Retention, and Teacher Dashboard Endpoints.
"""

import time
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.firebase_client import (
    get_firestore_db,
    get_student_concept_state,
    update_student_state,
    verify_concept_exists,
)
from math_engine.bkt import calculate_new_mastery, calculate_retention


class LearnLensRouterIntegrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_calculate_new_mastery_bkt(self):
        """Test Bayesian Knowledge Tracing updates for correct and incorrect answers."""
        prior = 0.50
        post_correct = calculate_new_mastery(prior_mastery=prior, is_correct=True, slip_rate=0.1, guess_rate=0.2)
        self.assertGreater(post_correct, prior)

        post_incorrect = calculate_new_mastery(prior_mastery=prior, is_correct=False, slip_rate=0.1, guess_rate=0.2)
        self.assertLess(post_incorrect, prior)

        self.assertLessEqual(calculate_new_mastery(1.0, True), 1.0)
        self.assertGreaterEqual(calculate_new_mastery(0.0, False), 0.0)

    def test_calculate_retention_ebbinghaus(self):
        """Test Ebbinghaus memory retention decay formula."""
        now = 1000000.0
        r_now = calculate_retention(last_seen_timestamp=now, current_timestamp=now, stability=1.0)
        self.assertEqual(r_now, 1.0)

        one_day_later = now + 86400.0
        r_1day = calculate_retention(last_seen_timestamp=now, current_timestamp=one_day_later, stability=1.0)
        self.assertAlmostEqual(r_1day, 0.3679, delta=0.01)

        r_higher_stab = calculate_retention(last_seen_timestamp=now, current_timestamp=one_day_later, stability=3.0)
        self.assertGreater(r_higher_stab, r_1day)

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
            retention_score=0.85,
        )
        self.assertTrue(res["mastery_updated"])
        self.assertTrue(res["logged"])
        self.assertTrue(res["triage_alert"])

        state = get_student_concept_state(student_id="student_test_99", concept_id="algebra.distribution")
        self.assertEqual(state["prior_mastery"], 0.42)
        self.assertIsNotNone(state["last_seen_timestamp"])

        non_existent = get_student_concept_state(student_id="unknown_student", concept_id="geometry")
        self.assertEqual(non_existent["prior_mastery"], 0.50)
        self.assertIsNone(non_existent["last_seen_timestamp"])

    def test_post_assessment_unauthenticated_rejected_401(self):
        """Test that requests without Firebase Authorization token are rejected with 401."""
        payload = {
            "student_id": "student_no_auth",
            "concept_id": "algebra.linear",
            "student_answer": "42",
            "time_ms": 5000,
            "attempts": 1,
        }
        self.client.credentials()
        response = self.client.post("/api/assessments/submit/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_assessment_id_spoofing_rejected_403(self):
        """Test anti-spoofing: token UID student_A attempting to submit for student_B is rejected with 403."""
        payload = {
            "student_id": "student_victim",
            "concept_id": "algebra.linear",
            "student_answer": "42",
            "time_ms": 5000,
            "attempts": 1,
        }
        self.client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_attacker")
        response = self.client.post("/api/assessments/submit/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_assessment_strict_validation_errors_400(self):
        """Test that invalid payload structure returns HTTP 400 Bad Request."""
        self.client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_valid")

        # Missing concept_id
        bad_payload = {
            "student_id": "student_valid",
            "student_answer": "42",
            "time_ms": 5000,
        }
        response = self.client.post("/api/assessments/submit/", bad_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("concept_id", response.json())

        # Negative time_ms
        negative_time_payload = {
            "student_id": "student_valid",
            "concept_id": "algebra.linear",
            "student_answer": "42",
            "time_ms": -100,
        }
        response2 = self.client.post("/api/assessments/submit/", negative_time_payload, format="json")
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_taxonomy_validation_invalid_concept_rejected_400(self):
        """Test that an uncatalogued concept_id is rejected with HTTP 400."""
        student_id = "student_valid_tax"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer mock-{student_id}")

        payload = {
            "student_id": student_id,
            "concept_id": "nonexistent.taxonomy.concept",
            "student_answer": "x = 5",
            "time_ms": 10000,
            "attempts": 1,
        }
        response = self.client.post("/api/assessments/submit/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid concept_id: Concept does not exist in taxonomy.", str(response.json()))

    def test_post_assessment_demo_fallback_3_5(self):
        """Test that answer '3.5' triggers demo fallback and bypasses LLM."""
        student_id = "student_hackathon_01"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer mock-{student_id}")

        payload = {
            "student_id": student_id,
            "concept_id": "algebra.distribution_rule",
            "student_answer": "3.5",
            "time_ms": 12000,
            "attempts": 1,
            "prior_mastery": 0.50,
        }
        response = self.client.post("/api/assessments/submit/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["status"], "success")
        self.assertEqual(data["student_id"], student_id)
        self.assertIn("diagnosis", data)
        self.assertIn("Distribution Error", str(data["diagnosis"]))
        self.assertIn("new_mastery", data)
        self.assertIn("retention_score", data)

    def test_post_assessment_careless_error_filter(self):
        """Test that rapid answers (<4000ms, 1 attempt) return careless error message immediately."""
        student_id = "student_speedy"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer mock-{student_id}")

        payload = {
            "student_id": student_id,
            "concept_id": "algebra.linear",
            "student_answer": "42",
            "time_ms": 1500,  # fast latency
            "attempts": 1,
        }
        response = self.client.post("/api/assessments/submit/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["status"], "careless")
        self.assertEqual(data["message"], "Take your time and check your math.")

    def test_post_assessment_deep_misconception_flow_with_retention(self):
        """Test deep misconception flow including retention calculation and prior mastery accumulation."""
        student_id = "student_struggling"
        concept_id = "algebra.quadratics"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer mock-{student_id}")

        two_days_ago = time.time() - (2 * 86400.0)
        db = get_firestore_db()
        db.collection("mastery_states").document(student_id).set({
            "student_id": student_id,
            "concept_id": concept_id,
            "mastery_score": 0.70,
            f"concepts.{concept_id}": {
                "mastery_score": 0.70,
                "last_seen_timestamp": two_days_ago,
            },
        }, merge=True)

        payload = {
            "student_id": student_id,
            "concept_id": concept_id,
            "student_answer": "x = -b/2a",
            "time_ms": 55000,
            "attempts": 2,
        }
        response = self.client.post("/api/assessments/submit/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["status"], "success")
        self.assertIn("diagnosis", data)
        self.assertIn("new_mastery", data)
        self.assertIn("retention_score", data)
        self.assertLess(data["retention_score"], 0.5)

    def test_teacher_triage_feed_endpoint(self):
        """Test GET /api/teacher/triage-alerts/ returns all NEEDS_INTERVENTION alerts."""
        self.client.credentials(HTTP_AUTHORIZATION="Bearer mock-teacher_admin")

        db = get_firestore_db()
        db.collection("triage_alerts").document("alert_student_feed_01").set({
            "student_id": "student_feed_01",
            "concept_id": "algebra.quadratics",
            "status": "NEEDS_INTERVENTION",
            "diagnostic_data": {"misconception": "Quadratic root sign confusion"},
        })
        db.collection("triage_alerts").document("alert_student_feed_resolved").set({
            "student_id": "student_feed_resolved",
            "concept_id": "algebra.linear",
            "status": "RESOLVED",
        })

        response = self.client.get("/api/teacher/triage-alerts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        alerts = response.json()
        self.assertIsInstance(alerts, list)
        alert_statuses = [a.get("status") for a in alerts]
        self.assertIn("NEEDS_INTERVENTION", alert_statuses)
        self.assertNotIn("RESOLVED", alert_statuses)

    def test_teacher_class_heatmap_endpoint(self):
        """Test GET /api/teacher/class-heatmap/ returns aggregated mastery and retention dictionary."""
        self.client.credentials(HTTP_AUTHORIZATION="Bearer mock-teacher_admin")

        db = get_firestore_db()
        db.collection("mastery_states").document("student_heatmap_01").set({
            "student_id": "student_heatmap_01",
            "concept_id": "algebra.linear",
            "mastery_score": 0.88,
            "retention_score": 0.94,
        })

        response = self.client.get("/api/teacher/class-heatmap/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        heatmap = response.json()
        self.assertIsInstance(heatmap, dict)
        self.assertIn("student_heatmap_01", heatmap)
        self.assertEqual(heatmap["student_heatmap_01"]["mastery_score"], 0.88)
        self.assertEqual(heatmap["student_heatmap_01"]["retention_score"], 0.94)

    def test_config_firebase_endpoint(self):
        """Test public Firebase web config endpoint."""
        response = self.client.get("/api/config/firebase/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["projectId"], "gen-lang-client-0427554587")

    def test_teacher_dashboard_endpoints_unauthenticated_rejected(self):
        """Test that Teacher Dashboard read endpoints strictly require authentication (HTTP 401)."""
        self.client.credentials()  # Clear auth credentials
        resp_triage = self.client.get("/api/teacher/triage-alerts/")
        self.assertEqual(resp_triage.status_code, status.HTTP_401_UNAUTHORIZED)

        resp_heatmap = self.client.get("/api/teacher/class-heatmap/")
        self.assertEqual(resp_heatmap.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_phase3_production_security_settings(self):
        """Verify DRF Throttling rates and CORS configuration in settings."""
        from django.conf import settings
        # Throttling verification
        rest_framework_settings = getattr(settings, "REST_FRAMEWORK", {})
        throttle_classes = rest_framework_settings.get("DEFAULT_THROTTLE_CLASSES", [])
        throttle_rates = rest_framework_settings.get("DEFAULT_THROTTLE_RATES", {})

        self.assertIn("rest_framework.throttling.AnonRateThrottle", throttle_classes)
        self.assertIn("rest_framework.throttling.UserRateThrottle", throttle_classes)
        self.assertEqual(throttle_rates.get("anon"), "10/min")
        self.assertEqual(throttle_rates.get("user"), "60/min")

        # CORS lockdown verification
        self.assertFalse(getattr(settings, "CORS_ALLOW_ALL_ORIGINS", True))
        allowed_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
        self.assertIsInstance(allowed_origins, list)
        self.assertTrue(len(allowed_origins) > 0)

