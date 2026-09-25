import json
from pathlib import Path
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from math_engine import calculate_mastery_score, estimate_latent_ability
from ai_engine.diagnostic import synthesize_diagnostic_report


class LearnLensContractTestCase(TestCase):
    """Verifies that API and Engines strictly obey shared_types.json contracts."""

    def setUp(self):
        self.client = APIClient()
        root_dir = Path(__file__).resolve().parent.parent
        with open(root_dir / 'shared_types.json', 'r') as f:
            self.shared_types = json.load(f)

    def test_health_check_endpoint(self):
        """GET /api/health/ returns 200 OK and status flags."""
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['deployment_target'], 'Render')
        self.assertTrue('firebase_stub_mode' in data)

    def test_assessment_submission_contract_fidelity(self):
        """POST /api/assessments/submit/ accepts sample payload and returns valid LLM schema."""
        sample_payload = self.shared_types['examples']['sample_post_assessments_submit']
        response = self.client.post(
            '/api/assessments/submit/',
            data=sample_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.json()

        # Validate that the response contains all required fields from shared_types.json
        expected_schema = self.shared_types['definitions']['LLMDiagnosticResponse']
        required_keys = expected_schema['required']
        for key in required_keys:
            self.assertIn(key, result, f"Missing required LLM diagnostic key: {key}")

        # Check types
        self.assertEqual(result['assessment_id'], sample_payload['assessment_id'])
        self.assertEqual(result['student_id'], sample_payload['student_id'])
        self.assertEqual(result['domain'], sample_payload['domain'])
        self.assertTrue(0.0 <= result['mastery_score'] <= 1.0)
        self.assertIsInstance(result['latent_ability_theta'], float)
        self.assertIsInstance(result['learning_gaps'], list)
        self.assertIsInstance(result['misconceptions'], list)
        self.assertIsInstance(result['recommended_interventions'], list)
        self.assertIsInstance(result['summary_narrative'], str)

    def test_assessment_submission_validation_error(self):
        """Submitting malformed payload triggers 400 Bad Request."""
        invalid_payload = {
            "student_id": "std_123"
            # Missing assessment_id, domain, responses
        }
        response = self.client.post(
            '/api/assessments/submit/',
            data=invalid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

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
        sample_payload = self.shared_types['examples']['sample_post_assessments_submit']
        report = synthesize_diagnostic_report(
            assessment_id=sample_payload['assessment_id'],
            student_id=sample_payload['student_id'],
            domain=sample_payload['domain'],
            mastery_score=0.75,
            latent_ability_theta=0.5,
            responses=sample_payload['responses']
        )
        self.assertEqual(report['assessment_id'], sample_payload['assessment_id'])
        self.assertIn('learning_gaps', report)
        self.assertIn('misconceptions', report)
        self.assertIn('recommended_interventions', report)
