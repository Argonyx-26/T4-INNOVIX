"""
FILE 5: fallbacks.py
Demo Matcher and Offline Safety Net for LearnLens backend (BE2).

Guarantees the live hackathon pitch works flawlessly even if the conference
internet drops or the external LLM API is unavailable.
Adheres strictly to the nested array schema defined in shared_types.json.
"""
from typing import Optional, Dict, Any


def get_demo_fallback(student_answer: str) -> Optional[Dict[str, Any]]:
    """
    Offline safety net for the live hackathon pitch.
    Detects known demo inputs and returns instant, deterministic diagnostic responses
    matching the nested schema defined in shared_types.json.

    :param student_answer: Raw student answer string.
    :return: Hardcoded diagnostic dictionary if matched, or None signaling BE1 to call live Gemini.
    """
    if not isinstance(student_answer, str):
        return None

    cleaned_answer = student_answer.strip()

    # Planned live demo error for equation: 2(x + 3) = 10 -> Student got 2x + 3 = 10 -> 2x = 7 -> x = 3.5
    if cleaned_answer == "3.5":
        return {
            "misconceptions": [
                {
                    "concept_id": "distributive_property",
                    "identified_misconception": "Distribution Sign and Constant Multiplier Omission",
                    "explanation": "You multiplied the variable but forgot to distribute the multiplier to the constant (2 * x + 3 = 10 -> 2x + 3 = 10 -> 2x = 7 -> x = 3.5)."
                }
            ],
            "recommended_interventions": [
                {
                    "intervention_id": "dist_01",
                    "type": "conceptual_reframing",
                    "actionable_steps": [
                        "Review visual grid area model demonstrating 2 * (x + 3) = 2x + 6",
                        "Complete 3 scaffolded single-step distribution drills",
                        "Retest and solve the multi-step equation 2(x + 3) = 10"
                    ]
                }
            ]
        }

    return None
