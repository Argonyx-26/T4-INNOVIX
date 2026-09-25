"""
Scoring and Statistical Metric Computation Module.

Native Python implementation for weighted mastery scores, accuracy ratios,
and behavioral penalty adjustments (hints used, response time anomalies).
"""
from typing import List, Dict, Any


CONFIDENCE_WEIGHTS = {
    "low": 0.8,
    "medium": 1.0,
    "high": 1.2
}


def calculate_mastery_score(responses: List[Dict[str, Any]]) -> float:
    """
    Computes normalized domain mastery between 0.0 and 1.0.
    Incorporates:
    - Base item correctness
    - Hint penalties (reduces effective score per hint)
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
