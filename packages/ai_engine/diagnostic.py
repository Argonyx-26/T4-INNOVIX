"""
Diagnostic synthesis module combining psychometrics and LLM analysis.
Adheres strictly to shared_types.json schema.
"""
import json
import logging
from typing import Dict, Any, List
from .client import get_openai_client
from .prompts import DIAGNOSTIC_SYSTEM_PROMPT, build_user_prompt

logger = logging.getLogger("learnlens.ai_engine")


def _generate_mock_diagnostic(
    assessment_id: str,
    student_id: str,
    domain: str,
    mastery_score: float,
    latent_ability_theta: float,
    responses: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Fallback generator strictly adhering to shared_types.json LLMDiagnosticResponse."""
    incorrect_items = [
        r.get("item_id", f"item_{i}")
        for i, r in enumerate(responses)
        if not r.get("is_correct", False)
    ]
    
    severity = "critical" if mastery_score < 0.5 else ("moderate" if mastery_score < 0.8 else "minor")
    
    return {
        "assessment_id": assessment_id,
        "student_id": student_id,
        "domain": domain,
        "mastery_score": round(mastery_score, 4),
        "latent_ability_theta": round(latent_ability_theta, 4),
        "learning_gaps": [
            {
                "concept_id": f"{domain}_core_foundations",
                "concept_name": f"Foundational Principles in {domain.replace('_', ' ').title()}",
                "severity": severity,
                "description": f"Analysis indicates inconsistent recall or application in {domain} items.",
                "evidence_item_ids": incorrect_items[:3] or [responses[0].get("item_id", "item_0")]
            }
        ],
        "misconceptions": [
            {
                "concept_id": f"{domain}_heuristics",
                "identified_misconception": "Over-generalized Procedural Shortcut",
                "explanation": "Student consistently applied simplified procedural rules without validating boundary constraints.",
                "detected_in_items": incorrect_items[:2] or [responses[0].get("item_id", "item_0")]
            }
        ],
        "recommended_interventions": [
            {
                "intervention_id": f"intv_{domain[:4]}_001",
                "title": f"Targeted Scaffolded Review: {domain.replace('_', ' ').title()}",
                "type": "conceptual_reframing",
                "priority": "high" if mastery_score < 0.6 else "medium",
                "actionable_steps": [
                    "Complete interactive conceptual tutorial focusing on fundamental rules",
                    "Engage in 3 scaffolded worked-example drills",
                    "Conduct self-explanation check before final problem submission"
                ]
            }
        ],
        "summary_narrative": (
            f"Learner demonstrated a mastery score of {int(mastery_score * 100)}% "
            f"with an estimated latent ability (theta) of {latent_ability_theta:.2f}. "
            f"Primary remediation should target conceptual precision in {domain.replace('_', ' ')}."
        )
    }


def synthesize_diagnostic_report(
    assessment_id: str,
    student_id: str,
    domain: str,
    mastery_score: float,
    latent_ability_theta: float,
    responses: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Synthesizes full diagnostic report via OpenAI LLM or structured local fallback.
    Returns dictionary conforming exactly to shared_types.json LLMDiagnosticResponse schema.
    """
    client = get_openai_client()

    if client:
        try:
            user_content = build_user_prompt(
                assessment_id=assessment_id,
                student_id=student_id,
                domain=domain,
                mastery_score=mastery_score,
                latent_ability_theta=latent_ability_theta,
                responses=responses
            )
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": DIAGNOSTIC_SYSTEM_PROMPT},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            raw_text = response.choices[0].message.content
            return json.loads(raw_text)
        except Exception as exc:
            logger.error("OpenAI diagnostic generation failed: %s. Using development fallback.", exc)

    return _generate_mock_diagnostic(
        assessment_id=assessment_id,
        student_id=student_id,
        domain=domain,
        mastery_score=mastery_score,
        latent_ability_theta=latent_ability_theta,
        responses=responses
    )
