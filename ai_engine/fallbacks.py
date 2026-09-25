"""
FILE 5: fallbacks.py
Demo Matcher and Offline Safety Net for LearnLens backend (BE2).

Guarantees the live hackathon pitch works flawlessly even if the conference
internet drops or the external LLM API is unavailable.
"""
from typing import Optional, Dict, Any


def get_demo_fallback(student_answer: str) -> Optional[Dict[str, Any]]:
    """
    Offline safety net for the live hackathon pitch.
    Detects known demo inputs and returns instant, deterministic diagnostic responses.

    :param student_answer: Raw student answer string.
    :return: Hardcoded diagnostic dictionary if matched, or None signaling BE1 to call live Gemini.
    """
    if not isinstance(student_answer, str):
        return None

    cleaned_answer = student_answer.strip()

    # Planned live demo error for equation: 2(x + 3) = 10 -> Student got 2x + 3 = 10 -> 2x = 7 -> x = 3.5
    if cleaned_answer == "3.5":
        return {
            "diagnosed_misconception": "Distribution Sign Error: You multiplied the variable but forgot to distribute the multiplier to the constant.",
            "confidence_score": 0.99,
            "prerequisite_gap": "Distributive Property",
            "recommended_intervention_type": "dist_01"
        }

    return None
