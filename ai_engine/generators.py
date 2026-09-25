"""
FILE 4: generators.py
Generative Pedagogical Pipelines using Google Gemini API.

Includes:
1. Prerequisite Concept Graph Generator
2. Visual Analogy & Micro-Lesson Intervention Generator
3. Verification Question Generator
All enforcing native JSON output with robust offline fallback dictionaries.
"""
import os
import json
from typing import Dict, Any, List
import google.generativeai as genai

from .prompts import ONTOLOGY_PROMPT, INTERVENTION_PROMPT, VERIFICATION_PROMPT

# Initialize Gemini Client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as exc:
        print(f"[generators.py] Warning configuring Gemini API: {exc}")

model = genai.GenerativeModel("gemini-1.5-flash")


def generate_concept_graph(subject_domain: str) -> Dict[str, Any]:
    """
    Maps a subject domain into a prerequisite concept graph.

    :param subject_domain: Name of academic domain (e.g., 'Linear Algebra', 'Cellular Biology').
    :return: Exactly formatted dictionary:
             {"concept_id": str, "name": str, "prerequisites": List[str]}
    """
    try:
        current_key = os.environ.get("GEMINI_API_KEY", "")
        if current_key and current_key != genai.get_key():
            genai.configure(api_key=current_key)

        prompt = (
            f"{ONTOLOGY_PROMPT}\n\n"
            f"SUBJECT DOMAIN: {subject_domain}\n"
        )

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        parsed_data = json.loads(response.text)
        return {
            "concept_id": str(parsed_data.get("concept_id", f"{subject_domain.lower().replace(' ', '_')}_foundations")),
            "name": str(parsed_data.get("name", f"Foundations of {subject_domain.title()}")),
            "prerequisites": list(parsed_data.get("prerequisites", []))
        }

    except Exception as exc:
        print(f"[generators.py] Error during generate_concept_graph: {exc}")
        clean_slug = subject_domain.lower().replace(" ", "_") if subject_domain else "general_math"
        return {
            "concept_id": f"{clean_slug}_foundations",
            "name": f"Foundations of {subject_domain.title() if subject_domain else 'General Math'}",
            "prerequisites": ["basic_arithmetic", "symbolic_representation"]
        }


def generate_intervention(diagnosed_misconception: str) -> Dict[str, Any]:
    """
    Creates a visual analogy and micro-lesson to correct the diagnosed misconception.

    :param diagnosed_misconception: Diagnosed cognitive error or erroneous mental model.
    :return: Exactly formatted dictionary:
             {"visual_analogy": str, "micro_lesson_text": str}
    """
    try:
        current_key = os.environ.get("GEMINI_API_KEY", "")
        if current_key and current_key != genai.get_key():
            genai.configure(api_key=current_key)

        prompt = (
            f"{INTERVENTION_PROMPT}\n\n"
            f"DIAGNOSED MISCONCEPTION: {diagnosed_misconception}\n"
        )

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        parsed_data = json.loads(response.text)
        return {
            "visual_analogy": str(parsed_data.get("visual_analogy", "")),
            "micro_lesson_text": str(parsed_data.get("micro_lesson_text", ""))
        }

    except Exception as exc:
        print(f"[generators.py] Error during generate_intervention: {exc}")
        return {
            "visual_analogy": "Imagine a delivery bag with multiple items inside: when applying a delivery multiplier to the bag, each item inside gets multiplied, not just the first one.",
            "micro_lesson_text": "When distributing across parentheses, remember to multiply the outside factor with every individual term inside before combining like terms."
        }


def generate_verification_question(concept: str, resolved_misconception: str) -> Dict[str, Any]:
    """
    Generates a follow-up multiple-choice question testing the same cognitive skill in a fresh context.

    :param concept: The active educational concept.
    :param resolved_misconception: The cognitive error to test against.
    :return: Exactly formatted dictionary:
             {"question_text": str, "options": List[str], "correct_answer": str}
    """
    try:
        current_key = os.environ.get("GEMINI_API_KEY", "")
        if current_key and current_key != genai.get_key():
            genai.configure(api_key=current_key)

        prompt = (
            f"{VERIFICATION_PROMPT}\n\n"
            f"ACTIVE CONCEPT: {concept}\n"
            f"RESOLVED MISCONCEPTION: {resolved_misconception}\n"
        )

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        parsed_data = json.loads(response.text)
        options = list(parsed_data.get("options", []))
        correct_answer = str(parsed_data.get("correct_answer", ""))

        # Ensure 4 options are present
        if len(options) != 4 or correct_answer not in options:
            raise ValueError("Invalid options or correct_answer structure in LLM output.")

        return {
            "question_text": str(parsed_data.get("question_text", "")),
            "options": options,
            "correct_answer": correct_answer
        }

    except Exception as exc:
        print(f"[generators.py] Error during generate_verification_question: {exc}")
        fallback_options = [
            "Multiply only the variable term by the factor",
            "Multiply every term inside parentheses by the outside factor",
            "Remove parentheses without performing multiplication",
            "Invert the signs of all terms inside parentheses"
        ]
        return {
            "question_text": f"Which of the following demonstrates the mathematically correct application of {concept}?",
            "options": fallback_options,
            "correct_answer": fallback_options[1]
        }
