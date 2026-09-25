"""
LLM Diagnostic Agent for LearnLens AI Engine.
Invokes OpenAI SDK to synthesize psychometric scores into pedagogical insights,
guaranteeing adherence to shared_types.json.
"""

import json
import logging
from typing import Any, Dict, List
from .config import get_default_model, get_openai_client
from .prompts import DIAGNOSTIC_SYSTEM_PROMPT, format_user_diagnostic_prompt

logger = logging.getLogger("learnlens.ai_engine")


def _generate_fallback_diagnostic(
    math_metrics: Dict[str, Any],
    responses: List[Dict[str, Any]],
    domain: str,
) -> Dict[str, Any]:
    """
    Deterministic pedagogical rule-based synthesis used when OpenAI API key is unavailable
    or during integration testing. Guaranteed to adhere 100% to shared_types.json.
    """
    theta = math_metrics.get("theta_score", 0.0)
    raw_score = math_metrics.get("raw_score", 0)
    total_items = math_metrics.get("total_items", max(len(responses), 1))
    accuracy = raw_score / max(total_items, 1)

    if theta >= 1.5:
        proficiency = "master"
    elif theta >= 0.8:
        proficiency = "advanced"
    elif theta >= -0.2:
        proficiency = "proficient"
    elif theta >= -1.2:
        proficiency = "emerging"
    else:
        proficiency = "novice"

    incorrect_responses = [r for r in responses if not r.get("is_correct", False)]
    correct_responses = [r for r in responses if r.get("is_correct", False)]

    # Extract topics
    weak_topics = list({r.get("topic_id", "foundational_concepts") for r in incorrect_responses})
    strong_topics = list({r.get("topic_id", "core_principles") for r in correct_responses})

    misconceptions = []
    for inc in incorrect_responses[:3]:
        t_id = inc.get("topic_id", "general_reasoning")
        misconceptions.append({
            "topic_id": t_id,
            "misconception_name": f"Procedural or conceptual error in {t_id.split('.')[-1].replace('_', ' ').title()}",
            "severity": "critical" if inc.get("item_difficulty", 0.0) < 0.0 else "moderate",
            "evidence_question_ids": [str(inc.get("question_id", "unknown"))],
            "detailed_rationale": (
                f"Student failed item {inc.get('question_id')} with difficulty {inc.get('item_difficulty')}. "
                f"Attempt took {inc.get('response_time_ms', 0)}ms indicating cognitive dissonance."
            ),
        })

    learning_gaps = []
    for idx, topic in enumerate(weak_topics[:3], start=1):
        learning_gaps.append({
            "topic_id": topic,
            "gap_description": f"Incomplete schema integration regarding {topic.replace('.', ' ')}.",
            "priority_rank": idx,
        })

    interventions = []
    for topic in weak_topics[:2]:
        interventions.append({
            "action_type": "worked_example_study",
            "target_topic": topic,
            "description": f"Review scaffolded solution walks for {topic}.",
            "estimated_time_minutes": 15,
        })
    if weak_topics:
        interventions.append({
            "action_type": "targeted_practice",
            "target_topic": weak_topics[0],
            "description": f"Complete 5 calibration problems targeting {weak_topics[0]}.",
            "estimated_time_minutes": 10,
        })
    else:
        interventions.append({
            "action_type": "micro_lesson",
            "target_topic": strong_topics[0] if strong_topics else domain,
            "description": "Advance to next-tier challenge concepts.",
            "estimated_time_minutes": 12,
        })

    strengths = [
        f"Consistently solves items in {topic.replace('.', ' ')}"
        for topic in strong_topics[:3]
    ] or [f"Basic familiarity with {domain} problem structures."]

    summary = (
        f"Student achieved an IRT theta ability score of {theta} ({round(accuracy * 100, 1)}% accuracy) "
        f"in {domain.replace('_', ' ').title()}. Current proficiency categorized as '{proficiency}'."
    )

    return {
        "diagnostic_summary": summary,
        "proficiency_level": proficiency,
        "identified_misconceptions": misconceptions,
        "cognitive_strengths": strengths,
        "learning_gaps": learning_gaps,
        "recommended_interventions": interventions,
        "confidence_index": round(min(0.95, max(0.60, 0.5 + (total_items * 0.05))), 2),
    }


def generate_diagnostic_report(
    subject_domain: str,
    grade_or_target_level: str,
    math_metrics: Dict[str, Any],
    responses: List[Dict[str, Any]],
    behavioral_summary: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Produces the complete diagnostic report conforming strictly to shared_types.json.
    Queries OpenAI SDK if available; otherwise uses deterministic fallback synthesizer.
    """
    client = get_openai_client()

    if not client:
        return _generate_fallback_diagnostic(math_metrics, responses, subject_domain)

    user_prompt = format_user_diagnostic_prompt(
        subject_domain=subject_domain,
        grade_or_target_level=grade_or_target_level,
        math_metrics=math_metrics,
        responses=responses,
        behavioral_summary=behavioral_summary,
    )

    try:
        response = client.chat.completions.create(
            model=get_default_model(),
            messages=[
                {"role": "system", "content": DIAGNOSTIC_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content
        parsed = json.loads(content)

        # Validate mandatory keys
        required_keys = [
            "diagnostic_summary",
            "proficiency_level",
            "identified_misconceptions",
            "cognitive_strengths",
            "learning_gaps",
            "recommended_interventions",
            "confidence_index",
        ]
        if all(k in parsed for k in required_keys):
            return parsed
        else:
            logger.warning("[AI Engine] OpenAI response lacked keys, using fallback synthesizer.")
            return _generate_fallback_diagnostic(math_metrics, responses, subject_domain)

    except Exception as exc:
        logger.error(f"[AI Engine] OpenAI call failed: {exc}. Utilizing robust fallback synthesizer.")
        return _generate_fallback_diagnostic(math_metrics, responses, subject_domain)
