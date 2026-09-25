"""
FILE 5: fallbacks.py
Demo Matcher and Offline Safety Net for LearnLens backend (BE1 & BE2).

Guarantees the live hackathon pitch works flawlessly even if the conference
internet drops or the external LLM API is unavailable.
Adheres strictly to the nested array schema defined in shared_types.json
while supporting BE1 single-item router contracts.
"""
import re
from typing import Optional, Dict, Any

DEMO_REGEX = re.compile(r"^\s*3\.5\s*$")

DEMO_DISTRIBUTION_ERROR_DIAGNOSIS: Dict[str, Any] = {
    "misconceptions": [
        {
            "concept_id": "distributive_property",
            "identified_misconception": "Distribution Sign and Constant Multiplier Omission",
            "explanation": "You multiplied the variable but forgot to distribute the multiplier to the constant (2 * x + 3 = 10 -> 2x + 3 = 10 -> 2x = 7 -> x = 3.5).",
            "detected_in_items": ["item_demo_01"],
        }
    ],
    "recommended_interventions": [
        {
            "intervention_id": "dist_01",
            "title": "Targeted Remediation for Distributive Property",
            "type": "conceptual_reframing",
            "priority": "high",
            "actionable_steps": [
                "Review visual grid area model demonstrating 2 * (x + 3) = 2x + 6",
                "Complete 3 scaffolded single-step distribution drills",
                "Retest and solve the multi-step equation 2(x + 3) = 10",
            ],
        }
    ],
}


def get_demo_fallback(student_answer: Any) -> Optional[Dict[str, Any]]:
    """
    Offline safety net for the live hackathon pitch.
    Detects known demo inputs ('3.5') and returns instant, deterministic diagnostic responses
    matching the nested schema defined in shared_types.json.

    :param student_answer: Raw student answer string or number.
    :return: Hardcoded diagnostic dictionary if matched, or None signaling BE1 to call live diagnostic engine.
    """
    if student_answer is None:
        return None

    str_answer = str(student_answer).strip()
    if DEMO_REGEX.match(str_answer):
        return dict(DEMO_DISTRIBUTION_ERROR_DIAGNOSIS)

    return None
