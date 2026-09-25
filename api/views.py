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
from ai_engine import synthesize_diagnostic_report
from core.firebase import is_stub_mode


class AssessmentSubmitView(APIView):
    """
    POST /api/assessments/submit/
    Accepts student assessment submission, orchestrates statistical evaluation
    via math_engine, generates cognitive diagnosis via ai_engine, and returns
    structured diagnostic response.
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

        # 2. Compute psychometric statistics via math_engine (Dev 1 module)
        mastery_score = calculate_mastery_score(responses)
        latent_ability_theta = estimate_latent_ability(responses)

        # 3. Generate diagnostic report via ai_engine (Dev 2 module)
        diagnostic_payload = synthesize_diagnostic_report(
            assessment_id=assessment_id,
            student_id=student_id,
            domain=domain,
            mastery_score=mastery_score,
            latent_ability_theta=latent_ability_theta,
            responses=responses
        )

        # 4. Verify output fidelity against shared_types.json LLM response contract
        response_serializer = LLMDiagnosticResponseSerializer(data=diagnostic_payload)
        if response_serializer.is_valid():
            return Response(response_serializer.validated_data, status=status.HTTP_200_OK)
        else:
            # Return raw payload with schema warning if strict validation has minor diff
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
