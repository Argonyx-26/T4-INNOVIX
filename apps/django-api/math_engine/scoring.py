"""
Scoring and Statistical Metric Computation Module for LearnLens Math Engine.

Native Python implementation for:
1. calculate_mastery_score: weighted mastery score (0.0 - 1.0) with confidence adjustments and hint penalties.
2. compute_assessment_metrics: coordinates IRT calibration, SEM calculation, and topic mastery.
"""

from typing import Any, Dict, List
from .irt_model import estimate_theta_eap, theta_to_percentile
from .mastery_estimator import estimate_topic_mastery


CONFIDENCE_WEIGHTS = {
    "low": 0.8,
    "medium": 1.0,
    "high": 1.2,
}


def calculate_mastery_score(responses: List[Dict[str, Any]]) -> float:
    """
    Computes normalized domain mastery between 0.0 and 1.0.
    Incorporates:
    - Base item correctness
    - Hint penalties (reduces effective score per hint down to floor 0.3)
    - Learner confidence weights
    """
    if not responses:
        return 0.0

    total_weight = 0.0
    accumulated_score = 0.0

    for item in responses:
        is_correct = bool(item.get("is_correct", False))
        confidence = str(item.get("confidence_level", "medium")).lower()
        weight = CONFIDENCE_WEIGHTS.get(confidence, 1.0)
        hints_used = int(item.get("hints_used", 0))

        # Each hint used slightly reduces credit for that item (down to min 0.3)
        hint_penalty = max(0.3, 1.0 - (hints_used * 0.2))

        item_score = (1.0 if is_correct else 0.0) * hint_penalty
        accumulated_score += item_score * weight
        total_weight += weight

    if total_weight <= 0.0:
        return 0.0

    mastery = accumulated_score / total_weight
    return round(max(0.0, min(1.0, mastery)), 4)


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
