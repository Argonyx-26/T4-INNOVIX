"""
Prompt Templates for LearnLens AI Engine.
Strictly specifies the JSON output keys matching shared_types.json.
"""

DIAGNOSTIC_SYSTEM_PROMPT = """You are LearnLens's Senior Educational Diagnostician and Cognitive Psychometrician.
Your mission is to perform deep diagnostic reasoning on learner assessment data across any domain (STEM, humanities, or technical skills).

You must analyze:
1. Mathematical IRT metrics (theta ability score, SEM, percentile, topic mastery).
2. Question-level student responses, response latencies, attempt counts, and free-text explanations.
3. Behavioral anomalies (guessing, fatigue, conceptual roadblocks).

CRITICAL REQUIREMENT:
You MUST respond with ONLY a valid, single JSON object adhering to this schema:
{
  "diagnostic_summary": "string - concise executive assessment of current proficiency and core conceptual patterns",
  "proficiency_level": "novice" | "emerging" | "proficient" | "advanced" | "master",
  "identified_misconceptions": [
    {
      "topic_id": "string",
      "misconception_name": "string",
      "severity": "critical" | "moderate" | "minor",
      "evidence_question_ids": ["string"],
      "detailed_rationale": "string"
    }
  ],
  "cognitive_strengths": ["string"],
  "learning_gaps": [
    {
      "topic_id": "string",
      "gap_description": "string",
      "priority_rank": integer
    }
  ],
  "recommended_interventions": [
    {
      "action_type": "micro_lesson" | "targeted_practice" | "concept_map_review" | "worked_example_study",
      "target_topic": "string",
      "description": "string",
      "estimated_time_minutes": integer
    }
  ],
  "confidence_index": float (between 0.0 and 1.0)
}

DO NOT include markdown backticks (like ```json), explanations, or any text outside the raw JSON object.
"""


def format_user_diagnostic_prompt(
    subject_domain: str,
    grade_or_target_level: str,
    math_metrics: dict,
    responses: list,
    behavioral_summary: dict,
) -> str:
    """
    Constructs the contextual prompt containing psychometric results and response evidence.
    """
    import json

    context = {
        "domain": subject_domain,
        "target_level": grade_or_target_level or "Standard Level",
        "psychometric_math_metrics": math_metrics,
        "behavioral_observations": behavioral_summary,
        "student_responses": [
            {
                "question_id": r.get("question_id"),
                "topic_id": r.get("topic_id"),
                "item_difficulty": r.get("item_difficulty"),
                "is_correct": r.get("is_correct"),
                "response_time_ms": r.get("response_time_ms"),
                "attempt_count": r.get("attempt_count", 1),
                "confidence_score": r.get("confidence_score"),
                "free_text_answer": r.get("free_text_answer"),
            }
            for r in responses
        ],
    }

    return (
        f"Analyze the following student assessment session data for domain '{subject_domain}' "
        f"and produce the complete diagnostic JSON report:\n\n"
        f"{json.dumps(context, indent=2)}"
    )
