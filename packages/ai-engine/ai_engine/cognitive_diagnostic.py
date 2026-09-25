"""
Cognitive Diagnostic Engine for LearnLens.
Analyzes student answers using OpenAI SDK with enforced JSON object response format.
Diagnoses underlying misconceptions and recommends pedagogical interventions.
"""
import json
import logging
from typing import Dict, Any, Optional

from .client import get_openai_client
from .exceptions import CognitiveDiagnosticError

logger = logging.getLogger("learnlens.ai_engine")

COGNITIVE_DIAGNOSTIC_SYSTEM_PROMPT = """You are an expert cognitive diagnostic psychometrician.
Analyze the provided student answer in the context of the target concept.
Identify any cognitive fallacy, invalid heuristic, or procedural misconception.

You MUST respond ONLY with a valid JSON object containing EXACTLY these three keys:
{
  "diagnosed_misconception": "string description of specific misconception",
  "confidence_score": 0.95,
  "recommended_intervention_id": "string intervention identifier"
}

Do not include markdown fences, comments, or extra keys. Return raw JSON.
"""

REQUIRED_KEYS = ("diagnosed_misconception", "confidence_score", "recommended_intervention_id")


def _validate_and_sanitize_diagnostic(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates output keys and handles KeyErrors gracefully if LLM hallucinates
    synonymous or missing keys.
    """
    # Graceful key resolution for common LLM hallucinations
    misconception = (
        data.get("diagnosed_misconception")
        or data.get("misconception")
        or data.get("diagnosis")
    )
    if not misconception:
        raise CognitiveDiagnosticError("Missing required key: 'diagnosed_misconception' in LLM response.")

    raw_conf = (
        data.get("confidence_score")
        if "confidence_score" in data
        else data.get("confidence", 0.85)
    )
    try:
        confidence = float(raw_conf)
        confidence = max(0.0, min(1.0, confidence))
    except (ValueError, TypeError) as exc:
        raise CognitiveDiagnosticError(f"Invalid 'confidence_score' value: {raw_conf}") from exc

    intervention_id = (
        data.get("recommended_intervention_id")
        or data.get("intervention_id")
        or data.get("recommended_intervention")
    )
    if not intervention_id:
        raise CognitiveDiagnosticError("Missing required key: 'recommended_intervention_id' in LLM response.")

    return {
        "diagnosed_misconception": str(misconception).strip(),
        "confidence_score": round(confidence, 4),
        "recommended_intervention_id": str(intervention_id).strip()
    }


def analyze_misconception(student_answer: str, concept_context: str) -> Dict[str, Any]:
    """
    Analyzes student answer against concept context to diagnose misconceptions.

    :param student_answer: The student's response/work.
    :param concept_context: The educational concept, domain, or rubric.
    :return: Exactly formatted dict:
             {"diagnosed_misconception": str, "confidence_score": float, "recommended_intervention_id": str}
    :raises ValueError: If input strings are empty.
    :raises CognitiveDiagnosticError: If LLM output fails schema constraints or inference fails.
    """
    if not isinstance(student_answer, str) or not student_answer.strip():
        raise ValueError("student_answer must be a non-empty string.")
    if not isinstance(concept_context, str) or not concept_context.strip():
        raise ValueError("concept_context must be a non-empty string.")

    client = get_openai_client()

    # Development fallback if OpenAI client / key is not available
    if client is None:
        logger.warning("Operating in dev mode: generating deterministic cognitive diagnostic.")
        return _validate_and_sanitize_diagnostic({
            "diagnosed_misconception": f"Systematic heuristic error concerning: {concept_context.strip()[:40]}",
            "confidence_score": 0.89,
            "recommended_intervention_id": f"intv_{abs(hash(concept_context)) % 1000:03d}_remedial"
        })

    try:
        user_message = (
            f"CONCEPT CONTEXT: {concept_context.strip()}\n"
            f"STUDENT ANSWER: {student_answer.strip()}\n\n"
            "Diagnose the underlying misconception and prescribe the intervention ID."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": COGNITIVE_DIAGNOSTIC_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        content = response.choices[0].message.content
        if not content:
            raise CognitiveDiagnosticError("OpenAI returned an empty response.")

        parsed_data = json.loads(content)
        return _validate_and_sanitize_diagnostic(parsed_data)

    except json.JSONDecodeError as exc:
        raise CognitiveDiagnosticError(f"Failed to parse LLM response as JSON: {exc}") from exc
    except CognitiveDiagnosticError:
        raise
    except Exception as exc:
        raise CognitiveDiagnosticError(f"Cognitive diagnostic analysis failed: {exc}") from exc
