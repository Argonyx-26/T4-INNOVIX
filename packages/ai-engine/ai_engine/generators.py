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
    current_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
    if not current_key or current_key.startswith("your_"):
        clean_slug = subject_domain.lower().replace(" ", "_") if subject_domain else "general_math"
        return {
            "concept_id": f"{clean_slug}_foundations",
            "name": f"Foundations of {subject_domain.title() if subject_domain else 'General Math'}",
            "prerequisites": ["basic_arithmetic", "symbolic_representation"]
        }

    try:
        if hasattr(genai, "get_key") and current_key != genai.get_key():
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
            "concept_id": str(parsed_data.get("concept_id", subject_domain.lower().replace(" ", "_"))),
            "name": str(parsed_data.get("name", subject_domain)),
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
    current_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
    if not current_key or current_key.startswith("your_"):
        return {
            "visual_analogy": "Imagine a delivery bag with multiple items inside: when applying a delivery multiplier to the bag, each item inside gets multiplied, not just the first one.",
            "micro_lesson_text": "When distributing across parentheses, remember to multiply the outside factor with every individual term inside before combining like terms."
        }

    try:
        if hasattr(genai, "get_key") and current_key != genai.get_key():
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
    current_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
    if not current_key or current_key.startswith("your_"):
        return {
            "question_text": "Solve for x in the equation 3(x + 2) = 15:",
            "options": [
                "x = 3",
                "x = 4.33",
                "x = 5",
                "x = 1"
            ],
            "correct_answer": "x = 3"
        }

    try:
        if hasattr(genai, "get_key") and current_key != genai.get_key():
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

def generate_library_resources(query: str) -> List[Dict[str, Any]]:
    """
    Generates a list of educational resources for a given topic using Gemini.
    Gracefully falls back to hardcoded resources on API failures.
    """
    fallback_resources = [
        {
            "id": f"fb-1-{query.replace(' ', '-')}",
            "title": f"Introduction to {query.title()}",
            "type": "video",
            "discipline": "General Sciences",
            "tier": "School (K-12)",
            "source": "Khan Academy",
            "durationOrPages": "10 mins",
            "url": f"https://www.khanacademy.org/search?page_search_query={query}",
            "summary": "A comprehensive introductory video breaking down the core concepts.",
            "matchedMisconception": "Foundational gaps"
        },
        {
            "id": f"fb-2-{query.replace(' ', '-')}",
            "title": f"Advanced Concepts in {query.title()}",
            "type": "paper",
            "discipline": "General Sciences",
            "tier": "Undergraduate (UG)",
            "source": "Coursera",
            "durationOrPages": "4 weeks",
            "url": f"https://www.coursera.org/search?query={query}",
            "summary": "Deep dive into academic theories and practical applications.",
            "matchedMisconception": "Advanced application errors"
        },
        {
            "id": f"fb-3-{query.replace(' ', '-')}",
            "title": f"{query.title()} Crash Course",
            "type": "video",
            "discipline": "General Sciences",
            "tier": "School (K-12)",
            "source": "YouTube",
            "durationOrPages": "15 mins",
            "url": f"https://www.youtube.com/results?search_query=Crash+Course+{query}",
            "summary": "Fast-paced visual explanation of the topic.",
            "matchedMisconception": "Conceptual mapping"
        }
    ]

    current_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
    if not current_key or current_key.startswith("your_"):
        print(f"[generators.py] No valid Gemini API Key found. Returning fallback resources for '{query}'.")
        return fallback_resources

    try:
        if hasattr(genai, "get_key") and current_key != genai.get_key():
            genai.configure(api_key=current_key)

        prompt = f"""You are a universal educational library search engine. The student searched for: "{query}". 
        Return a JSON array of exactly 4 highly relevant educational resources covering this topic. 
        Mix different formats (videos, interactive simulators, research papers, cheatsheets).
        Each object must EXACTLY match this structure:
        {{
            "id": "unique-id",
            "title": "Resource Title",
            "type": "video", // MUST BE EXACTLY ONE OF: "video", "simulation", "paper", "cheatsheet"
            "discipline": "Mathematics",
            "tier": "School (K-12)",
            "source": "Platform Name (e.g. YouTube, Coursera, MIT OCW)",
            "durationOrPages": "e.g. 15 mins or 5 pages",
            "url": "https://example.com",
            "summary": "Brief 2-sentence summary of what this teaches.",
            "matchedMisconception": "The exact misunderstanding this solves."
        }}
        Return ONLY a valid JSON array. Do not include markdown blocks (```json) or any other text."""

        search_model = genai.GenerativeModel("gemini-3.8-flash")
        response = search_model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        parsed_data = json.loads(response.text)
        if isinstance(parsed_data, list):
            return parsed_data
        else:
            raise ValueError("Response was not a JSON array")

    except Exception as exc:
        print(f"[generators.py] Error during generate_library_resources (503/ResourceExhausted likely): {exc}")
        return fallback_resources
