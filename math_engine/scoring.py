"""
Main Statistical Scoring Pipeline for LearnLens Math Engine.

Coordinates IRT calibration, SEM calculation, and topic mastery.
Ensures outputs strictly map to math_metrics schema in shared_types.json.
"""

from typing import Any, Dict, List
from .irt_model import estimate_theta_eap, theta_to_percentile
from .mastery_estimator import estimate_topic_mastery


def compute_assessment_metrics(responses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes all statistical metrics from raw student responses.

    Args:
        responses: List of response item dictionaries conforming to shared_types.json

    Returns:
        Dict conforming to math_metrics contract:
        {
            "theta_score": float,
            "standard_error": float,
            "percentile_rank": float,
            "raw_score": int,
            "total_items": int,
            "topic_mastery": { topic_id: float }
        }
    """
    total_items = len(responses)
    if total_items == 0:
        return {
            "theta_score": 0.0,
            "standard_error": 1.0,
            "percentile_rank": 50.0,
            "raw_score": 0,
            "total_items": 0,
            "topic_mastery": {},
        }

    raw_score = sum(1 for r in responses if r.get("is_correct", False))

    difficulties = [float(r.get("item_difficulty", 0.0)) for r in responses]
    discriminations = [float(r.get("item_discrimination", 1.0)) for r in responses]
    is_correct_list = [bool(r.get("is_correct", False)) for r in responses]

    # IRT 2PL Ability estimation via Bayesian EAP
    theta, sem = estimate_theta_eap(difficulties, discriminations, is_correct_list)
    percentile = theta_to_percentile(theta)

    # Bayesian topic mastery probabilities
    topic_mastery = estimate_topic_mastery(responses)

    return {
        "theta_score": theta,
        "standard_error": sem,
        "percentile_rank": percentile,
        "raw_score": raw_score,
        "total_items": total_items,
        "topic_mastery": topic_mastery,
    }
