"""
BE2 Behavioral Classifier for LearnLens AI Engine.
Classifies student submission dynamics based on latency and attempt counts.
"""

from typing import Union


def classify_behavior(time_ms: Union[int, float], attempts: int = 1) -> str:
    """
    Classifies student response behavior.

    Returns:
        "CARELESS_ERROR": Rapid response latency indicating a hasty calculation slip.
        "DEEP_MISCONCEPTION": Prolonged latency or repeated unsuccessful attempts.
        "STANDARD": Normal engagement latency.
    """
    try:
        t = float(time_ms) if time_ms is not None else 30000.0
        att = int(attempts) if attempts is not None else 1
    except (ValueError, TypeError):
        t, att = 30000.0, 1

    # Less than 4 seconds suggests careless fast error
    if t < 4000 and att == 1:
        return "CARELESS_ERROR"

    # Multiple attempts or high latency suggests deep misconception struggle
    if att >= 2 or t > 45000:
        return "DEEP_MISCONCEPTION"

    # Default fallback classification
    return "DEEP_MISCONCEPTION"
