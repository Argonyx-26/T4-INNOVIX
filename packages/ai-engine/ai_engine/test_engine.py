"""
Unit tests for LearnLens AI Engine (BE2).
Pure Python test suite verifying local ML classifier and LLM diagnostic pipelines.
"""
import unittest
from ai_engine.behavior_classifier import classify_behavior
from ai_engine.cognitive_diagnostic import analyze_misconception
from ai_engine.ontology import generate_subject_ontology
from ai_engine.verification import generate_verification_question
from ai_engine.exceptions import (
    AIEngineError,
    ModelInferenceError,
    CognitiveDiagnosticError,
    OntologyGenerationError,
    QuestionGenerationError,
)


class TestIndigenousBehaviorClassifier(unittest.TestCase):
    """Verifies Task 1: Scikit-learn Random Forest behavior classifier."""

    def test_careless_classification(self):
        """Fast response with single attempt is classified as CARELESS."""
        result = classify_behavior(time_ms=1500, attempts=1)
        self.assertEqual(result, "CARELESS")

    def test_misconception_classification(self):
        """Slow response with multiple attempts is classified as MISCONCEPTION."""
        result = classify_behavior(time_ms=38000, attempts=3)
        self.assertEqual(result, "MISCONCEPTION")

    def test_negative_time_raises_value_error(self):
        """Negative timing must raise ValueError."""
        with self.assertRaises(ValueError):
            classify_behavior(time_ms=-500, attempts=1)

    def test_invalid_attempts_raises_value_error(self):
        """Zero or negative attempts must raise ValueError."""
        with self.assertRaises(ValueError):
            classify_behavior(time_ms=5000, attempts=0)

    def test_type_error_on_non_numeric(self):
        """Non-numeric arguments must raise TypeError."""
        with self.assertRaises(TypeError):
            classify_behavior(time_ms="fast", attempts=1)  # type: ignore


class TestCognitiveDiagnosticEngine(unittest.TestCase):
    """Verifies Task 2: Cognitive Diagnostic Engine output format and error handling."""

    def test_analyze_misconception_schema(self):
        """Verifies output contains exact 3 required keys with appropriate types."""
        result = analyze_misconception(
            student_answer="x = -2 (did not distribute negative sign)",
            concept_context="Solving Multi-Step Equations with Parentheses"
        )
        self.assertIsInstance(result, dict)
        self.assertIn("diagnosed_misconception", result)
        self.assertIn("confidence_score", result)
        self.assertIn("recommended_intervention_id", result)

        self.assertIsInstance(result["diagnosed_misconception"], str)
        self.assertIsInstance(result["confidence_score"], float)
        self.assertTrue(0.0 <= result["confidence_score"] <= 1.0)
        self.assertIsInstance(result["recommended_intervention_id"], str)

    def test_empty_arguments_raise_value_error(self):
        """Empty student answer or concept context raises ValueError."""
        with self.assertRaises(ValueError):
            analyze_misconception("", "Linear Equations")
        with self.assertRaises(ValueError):
            analyze_misconception("42", "")


class TestDynamicSubjectOntology(unittest.TestCase):
    """Verifies Task 3: Dynamic Subject Ontology Knowledge Graph Generator."""

    def test_generate_subject_ontology_structure(self):
        """Verifies ontology generation returns valid hierarchical concept tree."""
        subject = "Cellular Biology"
        result = generate_subject_ontology(subject)

        self.assertIsInstance(result, dict)
        self.assertEqual(result["subject"], subject)
        self.assertIn("root_concept_id", result)
        self.assertIn("concepts", result)
        self.assertIsInstance(result["concepts"], list)
        self.assertGreater(len(result["concepts"]), 0)

        for concept in result["concepts"]:
            self.assertIn("concept_id", concept)
            self.assertIn("name", concept)
            self.assertIn("description", concept)
            self.assertIn("prerequisites", concept)
            self.assertIsInstance(concept["prerequisites"], list)

    def test_empty_subject_raises_value_error(self):
        """Empty subject string raises ValueError."""
        with self.assertRaises(ValueError):
            generate_subject_ontology("   ")


class TestVerificationQuestionGenerator(unittest.TestCase):
    """Verifies Task 4: Follow-up Verification Question Generator."""

    def test_generate_verification_question_schema(self):
        """Verifies verification question contains options, answer key, and distractor diagnostic flags."""
        misconception = "Failing to distribute negative signs across parentheses"
        concept = "Algebraic Linear Equations"
        result = generate_verification_question(
            diagnosed_misconception=misconception,
            concept_context=concept
        )

        self.assertIsInstance(result, dict)
        self.assertEqual(result["target_misconception"], misconception)
        self.assertIn("cognitive_skill", result)
        self.assertIn("question_text", result)
        self.assertIn("options", result)
        self.assertIn("correct_option_id", result)
        self.assertIn("explanation", result)

        options = result["options"]
        self.assertGreaterEqual(len(options), 2)
        has_correct = False
        has_diagnostic_distractor = False
        for opt in options:
            self.assertIn("id", opt)
            self.assertIn("text", opt)
            self.assertIn("is_correct", opt)
            self.assertIn("diagnoses_misconception", opt)
            if opt["is_correct"]:
                has_correct = True
            if opt["diagnoses_misconception"]:
                has_diagnostic_distractor = True

        self.assertTrue(has_correct, "At least one option must be marked as correct.")
        self.assertTrue(has_diagnostic_distractor, "At least one distractor must diagnose the misconception.")

    def test_empty_params_raise_value_error(self):
        """Missing parameters raise ValueError."""
        with self.assertRaises(ValueError):
            generate_verification_question("", "Concept")


class TestExceptionHierarchy(unittest.TestCase):
    """Verifies that all custom exceptions are subclasses of standard Python exceptions."""

    def test_exception_inheritance(self):
        self.assertTrue(issubclass(ModelInferenceError, (AIEngineError, RuntimeError, Exception)))
        self.assertTrue(issubclass(CognitiveDiagnosticError, (AIEngineError, ValueError, Exception)))
        self.assertTrue(issubclass(OntologyGenerationError, (AIEngineError, ValueError, Exception)))
        self.assertTrue(issubclass(QuestionGenerationError, (AIEngineError, ValueError, Exception)))


if __name__ == "__main__":
    unittest.main()
