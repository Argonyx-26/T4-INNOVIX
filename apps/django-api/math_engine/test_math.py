"""
Unit tests for Math Engine: Scoring and Item Response Theory (IRT).
Verifies statistical formulas, 1PL Rasch probability, and Newton-Raphson estimation.
"""
import sys
import unittest
import math
from pathlib import Path

django_api_dir = Path(__file__).resolve().parent.parent
if str(django_api_dir) not in sys.path:
    sys.path.insert(0, str(django_api_dir))

from math_engine.scoring import calculate_mastery_score, CONFIDENCE_WEIGHTS
from math_engine.irt import rasch_probability, estimate_latent_ability


class MathEngineScoringTestCase(unittest.TestCase):
    """Verifies calculate_mastery_score and weighting logic."""

    def test_empty_responses_returns_zero(self):
        self.assertEqual(calculate_mastery_score([]), 0.0)

    def test_all_correct_no_hints(self):
        responses = [
            {"is_correct": True, "hints_used": 0, "confidence_level": "high"},
            {"is_correct": True, "hints_used": 0, "confidence_level": "medium"},
        ]
        score = calculate_mastery_score(responses)
        self.assertEqual(score, 1.0)

    def test_all_incorrect_returns_zero(self):
        responses = [
            {"is_correct": False, "hints_used": 0, "confidence_level": "high"},
            {"is_correct": False, "hints_used": 2, "confidence_level": "low"},
        ]
        score = calculate_mastery_score(responses)
        self.assertEqual(score, 0.0)

    def test_hint_penalty_application(self):
        # 1 hint reduces credit by 0.2 -> multiplier = 0.8
        responses_with_hints = [
            {"is_correct": True, "hints_used": 1, "confidence_level": "medium"},
        ]
        score = calculate_mastery_score(responses_with_hints)
        self.assertEqual(score, 0.8)

        # 4 hints caps penalty at floor 0.3
        responses_many_hints = [
            {"is_correct": True, "hints_used": 5, "confidence_level": "medium"},
        ]
        score_floor = calculate_mastery_score(responses_many_hints)
        self.assertEqual(score_floor, 0.3)


class MathEngineIRTTestCase(unittest.TestCase):
    """Verifies Item Response Theory (1PL Rasch) and latent ability theta estimation."""

    def test_rasch_probability_symmetry(self):
        # When theta == difficulty b, probability must be exactly 0.5
        prob = rasch_probability(theta=0.0, difficulty_b=0.0)
        self.assertAlmostEqual(prob, 0.5, places=5)

    def test_rasch_probability_bounds(self):
        # High ability vs easy item -> prob -> 1.0
        prob_high = rasch_probability(theta=5.0, difficulty_b=0.0)
        self.assertGreater(prob_high, 0.99)

        # Low ability vs hard item -> prob -> 0.0
        prob_low = rasch_probability(theta=-5.0, difficulty_b=0.0)
        self.assertLess(prob_low, 0.01)

    def test_estimate_latent_ability_perfect_and_zero_score(self):
        # Perfect score boundary regularization returns +2.5
        responses_perfect = [{"is_correct": True}, {"is_correct": True}]
        self.assertEqual(estimate_latent_ability(responses_perfect), 2.5)

        # Zero score boundary regularization returns -2.5
        responses_zero = [{"is_correct": False}, {"is_correct": False}]
        self.assertEqual(estimate_latent_ability(responses_zero), -2.5)

    def test_estimate_latent_ability_mixed_responses(self):
        responses_mixed = [
            {"is_correct": True, "difficulty": -1.0},
            {"is_correct": True, "difficulty": 0.0},
            {"is_correct": False, "difficulty": 1.0},
        ]
        theta = estimate_latent_ability(responses_mixed)
        # Should be bounded within [-3.0, 3.0]
        self.assertTrue(-3.0 <= theta <= 3.0)
        # 2 out of 3 correct should yield positive ability
        self.assertGreater(theta, 0.0)


if __name__ == "__main__":
    unittest.main()
