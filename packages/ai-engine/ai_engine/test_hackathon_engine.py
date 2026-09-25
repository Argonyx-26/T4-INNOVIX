"""
Unit tests for LearnLens Hackathon AI Engine (Phase 2 & 3 Granular Pipelines).
Verifies:
1. classifier.py: Scikit-learn behavior classification (CARELESS_ERROR vs DEEP_MISCONCEPTION)
2. fallbacks.py: Live pitch demo "3.5" interceptor
3. diagnostics.py: Misconception diagnosis with native JSON schema conformity
4. generators.py: Concept graph, visual analogy intervention, and verification question generation
"""
import unittest
from ai_engine.classifier import classify_behavior, train_and_export_model
from ai_engine.fallbacks import get_demo_fallback
from ai_engine.diagnostics import analyze_misconception
from ai_engine.generators import (
    generate_concept_graph,
    generate_intervention,
    generate_verification_question,
)


class HackathonClassifierTestCase(unittest.TestCase):
    """Verifies local ML Random Forest classification using attempt metadata."""

    def test_careless_error_prediction(self):
        # Fast time (< 3000ms), 1 attempt, 0 hints -> CARELESS_ERROR
        tag = classify_behavior(time_ms=1200, attempt_count=1, hint_used=0)
        self.assertEqual(tag, "CARELESS_ERROR")

    def test_deep_misconception_prediction(self):
        # Long time (> 8000ms), multiple attempts, hints used -> DEEP_MISCONCEPTION
        tag = classify_behavior(time_ms=25000, attempt_count=3, hint_used=2)
        self.assertEqual(tag, "DEEP_MISCONCEPTION")

    def test_keyword_arguments_flexibility(self):
        # Supports alternative kwarg 'attempts'
        tag = classify_behavior(time_ms=1000, attempts=1)
        self.assertEqual(tag, "CARELESS_ERROR")


class HackathonDemoFallbackTestCase(unittest.TestCase):
    """Verifies offline pitch demonstration safety net."""

    def test_pitch_demo_3_5_match(self):
        result = get_demo_fallback("3.5")
        self.assertIsNotNone(result)
        self.assertIn("misconceptions", result)
        self.assertIn("recommended_interventions", result)
        self.assertEqual(result["misconceptions"][0]["concept_id"], "distributive_property")
        self.assertEqual(result["recommended_interventions"][0]["intervention_id"], "dist_01")

    def test_non_demo_answer_returns_none(self):
        self.assertIsNone(get_demo_fallback("x = 4"))
        self.assertIsNone(get_demo_fallback(""))
        self.assertIsNone(get_demo_fallback(123))  # type: ignore


class HackathonDiagnosticsTestCase(unittest.TestCase):
    """Verifies analyze_misconception schema conformity and fallback resilience."""

    def test_analyze_misconception_schema(self):
        result = analyze_misconception("x = 7", "algebraic_equations")
        self.assertIn("misconceptions", result)
        self.assertIn("recommended_interventions", result)
        self.assertIsInstance(result["misconceptions"], list)
        self.assertIsInstance(result["recommended_interventions"], list)
        self.assertGreater(len(result["misconceptions"]), 0)
        self.assertGreater(len(result["recommended_interventions"]), 0)

        # Check nested structure
        misc = result["misconceptions"][0]
        self.assertIn("concept_id", misc)
        self.assertIn("identified_misconception", misc)
        self.assertIn("explanation", misc)

        intv = result["recommended_interventions"][0]
        self.assertIn("intervention_id", intv)
        self.assertIn("type", intv)
        self.assertIn("actionable_steps", intv)
        self.assertIsInstance(intv["actionable_steps"], list)


class HackathonGeneratorsTestCase(unittest.TestCase):
    """Verifies concept graph, intervention, and question generators."""

    def test_generate_concept_graph_structure(self):
        result = generate_concept_graph("Linear Algebra")
        self.assertIn("concept_id", result)
        self.assertIn("name", result)
        self.assertIn("prerequisites", result)
        self.assertIsInstance(result["prerequisites"], list)

    def test_generate_intervention_structure(self):
        result = generate_intervention("Sign distribution omission")
        self.assertIn("visual_analogy", result)
        self.assertIn("micro_lesson_text", result)
        self.assertTrue(len(result["visual_analogy"]) > 0)
        self.assertTrue(len(result["micro_lesson_text"]) > 0)

    def test_generate_verification_question_structure(self):
        result = generate_verification_question("algebraic_equations", "distribution error")
        self.assertIn("question_text", result)
        self.assertIn("options", result)
        self.assertIn("correct_answer", result)
        self.assertEqual(len(result["options"]), 4)
        self.assertIn(result["correct_answer"], result["options"])


if __name__ == "__main__":
    unittest.main()
