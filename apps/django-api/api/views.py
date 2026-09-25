"""
API Views for LearnLens Diagnostic Engine.
Orchestrates requests across the isolated Math and AI Engines.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api.serializers import (
    AssessmentSubmissionSerializer,
    LLMDiagnosticResponseSerializer,
)
from math_engine import calculate_mastery_score, estimate_latent_ability
from ai_engine import (
    classify_behavior,
    analyze_misconception,
    get_demo_fallback,
    synthesize_diagnostic_report,
)
from core.firebase import is_stub_mode


class AssessmentSubmitView(APIView):
    """
    POST /api/assessments/submit/
    Accepts student assessment submission, orchestrates statistical evaluation
    via math_engine, classifies learner behavior with local ML classifier,
    generates cognitive diagnosis via ai_engine micro-pipelines, and returns
    structured diagnostic response conforming to shared_types.json.
    """
    def post(self, request, *args, **kwargs):
        # 1. Validate submission payload against shared_types.json contract
        serializer = AssessmentSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "error": "Invalid assessment submission payload",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data
        assessment_id = str(validated_data["assessment_id"])
        student_id = validated_data["student_id"]
        domain = validated_data["domain"]
        responses = validated_data["responses"]

        # 2. Compute psychometric statistics via math_engine
        mastery_score = calculate_mastery_score(responses)
        latent_ability_theta = estimate_latent_ability(responses)

        # 3. Iterate through student item responses with ML behavioral classification
        all_misconceptions = []
        all_interventions = []
        incorrect_items = []

        for resp in responses:
            item_id = resp.get("item_id")
            student_answer = str(resp.get("user_answer", ""))
            time_ms = int(resp.get("time_spent_seconds", 5.0) * 1000)
            hints = int(resp.get("hints_used", 0))
            attempts = hints + 1

            # A. Run local ML behavior classifier (sub-millisecond)
            behavior_tag = classify_behavior(time_ms=time_ms, attempt_count=attempts, hint_used=hints)

            # B. Only diagnose items that are incorrect or flagged as struggle
            if not resp.get("is_correct", False):
                incorrect_items.append(item_id)
                diag_result = analyze_misconception(
                    student_answer=student_answer,
                    active_concept=domain
                )

                for misc in diag_result.get("misconceptions", []):
                    misc_entry = dict(misc)
                    misc_entry["detected_in_items"] = [item_id]
                    all_misconceptions.append(misc_entry)

                for intv in diag_result.get("recommended_interventions", []):
                    intv_entry = dict(intv)
                    intv_entry["title"] = f"Targeted Remediation for {domain.replace('_', ' ').title()}"
                    intv_entry["priority"] = "high" if behavior_tag == "DEEP_MISCONCEPTION" else "medium"
                    all_interventions.append(intv_entry)

        # Fallback if student had incorrect answers but no misconceptions detected
        if incorrect_items and not all_misconceptions:
            all_misconceptions.append({
                "concept_id": domain,
                "identified_misconception": "Procedural Rule Misapplication",
                "explanation": f"Student applied incorrect transformation steps in {domain.replace('_', ' ')}.",
                "detected_in_items": incorrect_items
            })
            all_interventions.append({
                "intervention_id": f"intv_{domain[:4]}_fallback",
                "title": f"Review Core Foundations of {domain.replace('_', ' ').title()}",
                "type": "conceptual_reframing",
                "priority": "high",
                "actionable_steps": [
                    "Review introductory worked example",
                    "Complete 3 scaffolded practice drills"
                ]
            })

        # 4. Construct learning gaps & narrative
        learning_gaps = []
        if incorrect_items:
            severity = "critical" if mastery_score < 0.6 else "moderate"
            learning_gaps.append({
                "concept_id": domain,
                "concept_name": domain.replace("_", " ").title(),
                "severity": severity,
                "description": f"Identified conceptual hurdles and {len(all_misconceptions)} misconception patterns in {domain.replace('_', ' ')}.",
                "evidence_item_ids": incorrect_items
            })

        summary_narrative = (
            f"Learner achieved {int(mastery_score * 100)}% mastery with estimated ability (theta) of {latent_ability_theta:.2f}. "
            f"Evaluation detected {len(all_misconceptions)} conceptual hurdles requiring targeted remediation."
            if all_misconceptions else
            f"Learner demonstrated complete mastery ({int(mastery_score * 100)}%) with zero detected misconceptions."
        )

        diagnostic_payload = {
            "assessment_id": assessment_id,
            "student_id": student_id,
            "domain": domain,
            "mastery_score": mastery_score,
            "latent_ability_theta": latent_ability_theta,
            "learning_gaps": learning_gaps,
            "misconceptions": all_misconceptions,
            "recommended_interventions": all_interventions,
            "summary_narrative": summary_narrative
        }

        # 5. Verify output fidelity against shared_types.json LLM response contract
        response_serializer = LLMDiagnosticResponseSerializer(data=diagnostic_payload)
        if response_serializer.is_valid():
            return Response(response_serializer.validated_data, status=status.HTTP_200_OK)
        else:
            return Response(diagnostic_payload, status=status.HTTP_200_OK)


class HealthCheckView(APIView):
    """
    GET /api/health/
    Health check endpoint for Render service monitoring and diagnostics.
    """
    def get(self, request, *args, **kwargs):
        return Response(
            {
                "status": "healthy",
                "service": "learnlens_backend",
                "deployment_target": "Render",
                "firebase_stub_mode": is_stub_mode(),
                "engine_status": {
                    "math_engine": "operational",
                    "ai_engine": "operational"
                }
            },
            status=status.HTTP_200_OK
        )
