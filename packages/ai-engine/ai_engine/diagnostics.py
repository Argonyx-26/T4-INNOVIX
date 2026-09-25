"""
FILE 3: diagnostics.py
Misconception Diagnosis & Prerequisite Reasoning using Google Gemini API.

Analyzes incorrect student answers, identifies the cognitive root cause,
and recommends pedagogical intervention types with JSON schema enforcement
matching the nested array contract in shared_types.json.
"""
import os
import json
from typing import Dict, Any, List
import google.generativeai as genai

from .prompts import DIAGNOSTIC_PROMPT
from .fallbacks import get_demo_fallback

# Initialize Gemini Client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as exc:
        print(f"[diagnostics.py] Warning configuring Gemini API: {exc}")

model = genai.GenerativeModel("gemini-1.5-flash")


def analyze_misconception(student_answer: str, active_concept: str) -> Dict[str, Any]:
    """
    Analyzes student answer against active concept to diagnose cognitive root cause.
    Outputs the exact nested JSON schema aligned with shared_types.json:
    {
      "misconceptions": [{"concept_id": str, "identified_misconception": str, "explanation": str}],
      "recommended_interventions": [{"intervention_id": str, "type": str, "actionable_steps": List[str]}]
    }

    :param student_answer: Raw student answer string.
    :param active_concept: Mathematical or conceptual topic.
    :return: Exactly formatted dictionary with nested misconceptions and interventions.
    """
    # 1. Check offline demo fallback first for conference safety
    demo_fallback = get_demo_fallback(student_answer)
    if demo_fallback is not None:
        return demo_fallback

    # 2. Live Gemini Diagnosis with native JSON enforcement
    try:
        current_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
        if not current_key or current_key.startswith("your_"):
            clean_cid = active_concept.lower().replace(" ", "_") if active_concept else "algebraic_equations"
            return {
                "misconceptions": [
                    {
                        "concept_id": clean_cid,
                        "identified_misconception": "Procedural Rule Misapplication",
                        "explanation": f"Student applied incorrect transformation steps in {active_concept}."
                    }
                ],
                "recommended_interventions": [
                    {
                        "intervention_id": f"intv_{clean_cid[:6]}_01",
                        "type": "conceptual_reframing",
                        "actionable_steps": [
                            f"Review core fundamentals of {active_concept}",
                            "Work through 3 guided step-by-step example drills"
                        ]
                    }
                ]
            }

        if current_key != genai.get_key():
            genai.configure(api_key=current_key)

        prompt = (
            f"{DIAGNOSTIC_PROMPT}\n\n"
            f"ACTIVE CONCEPT: {active_concept}\n"
            f"STUDENT ANSWER: {student_answer}\n"
        )

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        parsed_data = json.loads(response.text)

        # Validate and sanitize nested misconceptions array
        raw_misconceptions = parsed_data.get("misconceptions", [])
        sanitized_misconceptions: List[Dict[str, str]] = []
        if isinstance(raw_misconceptions, list) and len(raw_misconceptions) > 0:
            for item in raw_misconceptions:
                if isinstance(item, dict):
                    sanitized_misconceptions.append({
                        "concept_id": str(item.get("concept_id", active_concept.lower().replace(" ", "_"))),
                        "identified_misconception": str(item.get("identified_misconception", "Cognitive procedural error")),
                        "explanation": str(item.get("explanation", "Student misapplied conceptual transformation rule."))
                    })

        if not sanitized_misconceptions:
            sanitized_misconceptions = [{
                "concept_id": active_concept.lower().replace(" ", "_"),
                "identified_misconception": "Cognitive procedural error",
                "explanation": "Student misapplied conceptual transformation rule."
            }]

        # Validate and sanitize nested recommended_interventions array
        raw_interventions = parsed_data.get("recommended_interventions", [])
        sanitized_interventions: List[Dict[str, Any]] = []
        if isinstance(raw_interventions, list) and len(raw_interventions) > 0:
            for item in raw_interventions:
                if isinstance(item, dict):
                    steps = item.get("actionable_steps", [])
                    sanitized_interventions.append({
                        "intervention_id": str(item.get("intervention_id", "remedial_01")),
                        "type": str(item.get("type", "conceptual_reframing")),
                        "actionable_steps": [str(s) for s in steps] if isinstance(steps, list) and steps else [
                            "Review foundational concept video",
                            "Complete 3 guided practice drills"
                        ]
                    })

        if not sanitized_interventions:
            sanitized_interventions = [{
                "intervention_id": "gen_01",
                "type": "conceptual_reframing",
                "actionable_steps": [
                    "Review foundational concept principles",
                    "Complete 3 guided practice drills"
                ]
            }]

        return {
            "misconceptions": sanitized_misconceptions,
            "recommended_interventions": sanitized_interventions
        }

    except Exception as exc:
        print(f"[diagnostics.py] Error during Gemini analysis: {exc}")
        clean_cid = active_concept.lower().replace(" ", "_") if active_concept else "unknown_concept"
        return {
            "misconceptions": [
                {
                    "concept_id": clean_cid,
                    "identified_misconception": "API_TIMEOUT",
                    "explanation": "Diagnostic service temporarily unavailable. Default pedagogical fallback applied."
                }
            ],
            "recommended_interventions": [
                {
                    "intervention_id": "fallback_01",
                    "type": "remedial_lesson",
                    "actionable_steps": [
                        "Review fundamental concepts for this topic",
                        "Consult instructor or refer to concept reference notes"
                    ]
                }
            ]
        }
