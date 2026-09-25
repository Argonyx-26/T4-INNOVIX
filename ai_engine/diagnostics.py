"""
FILE 3: diagnostics.py
Misconception Diagnosis & Prerequisite Reasoning using Google Gemini API.

Analyzes incorrect student answers, identifies the cognitive root cause,
and recommends pedagogical intervention types with JSON schema enforcement.
"""
import os
import json
from typing import Dict, Any
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

    :param student_answer: Raw student answer string.
    :param active_concept: Mathematical or conceptual topic.
    :return: Exactly formatted dictionary:
             {"diagnosed_misconception": str, "confidence_score": float, "prerequisite_gap": str, "recommended_intervention_type": str}
    """
    # 1. Check offline demo fallback first for conference safety
    demo_fallback = get_demo_fallback(student_answer)
    if demo_fallback is not None:
        return demo_fallback

    # 2. Live Gemini Diagnosis with native JSON enforcement
    try:
        # Dynamically re-configure if API key was updated in environment
        current_key = os.environ.get("GEMINI_API_KEY", "")
        if current_key and current_key != genai.get_key():
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

        # Enforce required schema keys and float conversion
        return {
            "diagnosed_misconception": str(parsed_data.get("diagnosed_misconception", "Cognitive procedural error")),
            "confidence_score": float(parsed_data.get("confidence_score", 0.85)),
            "prerequisite_gap": str(parsed_data.get("prerequisite_gap", "Foundational Arithmetic")),
            "recommended_intervention_type": str(parsed_data.get("recommended_intervention_type", "gen_01"))
        }

    except Exception as exc:
        print(f"[diagnostics.py] Error during Gemini analysis: {exc}")
        return {
            "diagnosed_misconception": "API_TIMEOUT",
            "confidence_score": 0.0,
            "prerequisite_gap": "Unknown",
            "recommended_intervention_type": "fallback_01"
        }
