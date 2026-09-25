"""
BE2 Fallbacks Module for LearnLens AI Engine.
Provides conference demo fallback bypass for planned errors.
"""

import re
from typing import Any, Dict, Optional

DEMO_REGEX = re.compile(r"^\s*3\.5\s*$")

DEMO_DISTRIBUTION_ERROR_DIAGNOSIS = {
    "status": "misconception",
    "misconception": "Distribution Error",
    "severity": "critical",
    "diagnostic_summary": "Systemic Algebraic Misconception Detected: Distribution Error. Learner failed to distribute negative factor across binomial terms, resulting in 3.5.",
    "identified_misconceptions": [
        {
            "topic_id": "algebra.distribution_rule",
            "misconception_name": "Distribution Error",
            "severity": "critical",
            "detailed_rationale": "Learner evaluated a - (b + c) as a - b + c without propagating the negative sign across parentheses.",
        }
    ],
    "suggested_action": "Immediate 1-on-1 worked example intervention on algebraic distribution.",
    "confidence_index": 1.0,
}


def get_demo_fallback(student_answer: Any) -> Optional[Dict[str, Any]]:
    """
    Checks if student answer matches the planned demo error ('3.5').
    If matched, returns hardcoded 'Distribution Error' diagnostic dict to bypass external LLM.
    Otherwise returns None.
    """
    if student_answer is None:
        return None

    str_answer = str(student_answer).strip()
    if DEMO_REGEX.match(str_answer):
        return dict(DEMO_DISTRIBUTION_ERROR_DIAGNOSIS)

    return None
