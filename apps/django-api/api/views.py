"""
LearnLens API Views (BE1 & BE2 Orchestrator).

Coordinates:
1. Multi-item holistic assessment submission (shared_types.json contract).
2. Granular single-item 7-step pipeline (BKT, Ebbinghaus decay, Firestore state sync).
3. Local ML behavioral classification & Gemini / local offline diagnostic reasoning.
4. Pitch demo zero-latency interceptor ("3.5").
5. Teacher Dashboard endpoints (Triage feed and class-wide mastery heatmap).
6. Render service health check monitoring.
"""

import json
import logging
import os
import time
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Core Security & Settings
from core.authentication import FirebaseAuthentication
from core.settings import BASE_DIR
from core.firebase import is_stub_mode

# DRF Serializers
from api.serializers import (
    AssessmentSubmissionSerializer,
    LLMDiagnosticResponseSerializer,
    AssessmentSubmissionRequestSerializer,
)

# AI Engine Imports
try:
    from ai_engine.fallbacks import get_demo_fallback
    from ai_engine.classifier import classify_behavior
    from ai_engine.diagnostics import analyze_misconception
    from ai_engine.diagnostic import synthesize_diagnostic_report
except ImportError:
    from packages.ai_engine.fallbacks import get_demo_fallback
    from packages.ai_engine.classifier import classify_behavior
    from packages.ai_engine.diagnostics import analyze_misconception
    from packages.ai_engine.diagnostic import synthesize_diagnostic_report

# Math Engine & Firestore Database Imports
from math_engine.bkt import calculate_new_mastery, calculate_retention
from math_engine.scoring import calculate_mastery_score
from math_engine.irt import estimate_latent_ability
from api.firebase_client import (
    get_firestore_db,
    get_student_concept_state,
    update_student_state,
    verify_concept_exists,
)

logger = logging.getLogger("learnlens.api")


class AssessmentSubmitView(APIView):
    """
    POST /api/assessments/submit/
    Dual-mode submission endpoint supporting:
    Mode A: Multi-item assessment submission matching shared_types.json contract.
    Mode B: Single-concept assessment with BKT mastery update and Ebbinghaus retention decay.
    """
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.data or {}

        # ----------------------------------------------------------------------
        # MODE A: Multi-item Assessment Submission (shared_types.json contract)
        # ----------------------------------------------------------------------
        if "responses" in payload or "concept_id" not in payload:
            serializer = AssessmentSubmissionSerializer(data=payload)
            if not serializer.is_valid():
                return Response(
                    {
                        "error": "Invalid assessment submission payload",
                        "details": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            validated_data = serializer.validated_data
            assessment_id = str(validated_data["assessment_id"])
            student_id = validated_data["student_id"]
            domain = validated_data["domain"]
            responses = validated_data["responses"]

            # Security anti-spoofing if authenticated with live Firebase UID
            if hasattr(request.user, "uid") and request.user.uid and not getattr(request.user, "is_stub", False):
                if request.user.uid != student_id:
                    raise PermissionDenied("Student ID does not match authenticated user.")

            # 1. Compute psychometric statistics via math_engine
            mastery_score = calculate_mastery_score(responses)
            latent_ability_theta = estimate_latent_ability(responses)

            # 2. Iterate through student item responses with ML behavioral classification
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

            # Construct learning gaps & narrative
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

            # Optional background sync with Firestore state
            try:
                if incorrect_items and all_misconceptions:
                    update_student_state(
                        student_id=student_id,
                        concept_id=domain,
                        new_mastery=mastery_score,
                        diagnostic_data={
                            "status": "misconception",
                            "misconception": all_misconceptions[0].get("identified_misconception", "Cognitive Error"),
                            "severity": "critical" if mastery_score < 0.6 else "moderate",
                        },
                        retention_score=1.0,
                    )
            except Exception as sync_exc:
                logger.debug(f"Firestore state sync notice: {sync_exc}")

            # Verify output fidelity against shared_types.json LLM response contract
            response_serializer = LLMDiagnosticResponseSerializer(data=diagnostic_payload)
            if response_serializer.is_valid():
                return Response(response_serializer.validated_data, status=status.HTTP_200_OK)
            return Response(diagnostic_payload, status=status.HTTP_200_OK)

        # ----------------------------------------------------------------------
        # MODE B: Single-Concept Assessment Submission (BE1 7-Step Pipeline)
        # ----------------------------------------------------------------------
        serializer = AssessmentSubmissionRequestSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        student_id = validated_data["student_id"]
        concept_id = validated_data["concept_id"]
        student_answer = validated_data.get("student_answer")
        time_ms = validated_data["time_ms"]
        attempts = validated_data.get("attempts", 1)

        # Concept Taxonomy Verification
        if not verify_concept_exists(concept_id):
            raise ValidationError("Invalid concept_id: Concept does not exist in taxonomy.")

        # Security: Anti-Spoofing Verification
        if hasattr(request.user, "uid") and request.user.uid and not getattr(request.user, "is_stub", False):
            if request.user.uid != student_id:
                raise PermissionDenied("Student ID does not match authenticated user.")

        # Step 2: Check Demo Fallback (Conference Resiliency for '3.5')
        diagnosis = get_demo_fallback(student_answer)

        if diagnosis is not None:
            logger.info(f"[Core Router] Demo Fallback triggered for student '{student_id}'. Bypassing LLM.")
        else:
            # Step 3: Behavior Filter
            behavior = classify_behavior(time_ms=time_ms, attempts=attempts)

            if behavior == "CARELESS_ERROR":
                logger.info(f"[Core Router] Careless error flagged for student '{student_id}'.")
                return Response(
                    {
                        "status": "careless",
                        "message": "Take your time and check your math.",
                    },
                    status=status.HTTP_200_OK,
                )

            # Step 4: Misconception Diagnosis
            diagnosis = analyze_misconception(student_answer, concept_id)

        # Step 5: Read Prior State & Mathematical Calculations
        concept_state = get_student_concept_state(student_id=student_id, concept_id=concept_id)
        last_seen = concept_state.get("last_seen_timestamp")
        current_ts = time.time()

        retention_score = calculate_retention(
            last_seen_timestamp=last_seen,
            current_timestamp=current_ts,
            stability=1.0,
        )

        prior_mastery = validated_data.get("prior_mastery")
        if prior_mastery is None:
            prior_mastery = concept_state.get("prior_mastery", 0.50)

        is_correct = not bool(
            diagnosis.get("status") == "misconception"
            or diagnosis.get("misconception")
            or diagnosis.get("identified_misconceptions")
            or diagnosis.get("misconceptions")
        )

        new_mastery = calculate_new_mastery(
            prior_mastery=prior_mastery,
            is_correct=is_correct,
            slip_rate=0.10,
            guess_rate=0.20,
        )

        # Step 6: Database Sync (Firebase Firestore)
        update_student_state(
            student_id=student_id,
            concept_id=concept_id,
            new_mastery=new_mastery,
            diagnostic_data=diagnosis,
            retention_score=retention_score,
        )

        # Step 7: Return Response
        return Response(
            {
                "status": "success",
                "student_id": student_id,
                "concept_id": concept_id,
                "new_mastery": new_mastery,
                "retention_score": retention_score,
                "diagnosis": diagnosis,
            },
            status=status.HTTP_200_OK,
        )


class HealthCheckView(APIView):
    """
    GET /api/health/
    Health check endpoint for Render service monitoring and diagnostics.
    """
    permission_classes = [AllowAny]

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


class TeacherTriageFeedView(APIView):
    """
    GET /api/teacher/triage-alerts/
    Queries Firestore 'triage_alerts' for all records where status == 'NEEDS_INTERVENTION'.
    """
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            db = get_firestore_db()
            alerts = []
            alerts_stream = db.collection("triage_alerts").where("status", "==", "NEEDS_INTERVENTION").stream()
            for doc_snap in alerts_stream:
                data = doc_snap.to_dict() or {}
                alerts.append({
                    "alert_id": doc_snap.id,
                    **data,
                })
            return Response(alerts, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error(f"[Teacher Dashboard] Failed to fetch triage alerts: {exc}")
            return Response([], status=status.HTTP_200_OK)


class ClassHeatmapView(APIView):
    """
    GET /api/teacher/class-heatmap/
    Queries Firestore 'mastery_states' collection to render the frontend class heatmap.
    """
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            db = get_firestore_db()
            heatmap_data = {}
            docs_stream = db.collection("mastery_states").stream()
            for doc_snap in docs_stream:
                data = doc_snap.to_dict() or {}
                student_id = str(data.get("student_id") or doc_snap.id)
                mastery_score = float(data.get("mastery_score", 0.50))
                retention_score = float(data.get("retention_score", 1.0)) if data.get("retention_score") is not None else 1.0
                heatmap_data[student_id] = {
                    "mastery_score": mastery_score,
                    "retention_score": retention_score,
                    "concept_id": data.get("concept_id"),
                    "concepts": data.get("concepts", {}),
                    "last_updated": data.get("last_updated"),
                }
            return Response(heatmap_data, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error(f"[Teacher Dashboard] Failed to aggregate class heatmap: {exc}")
            return Response({}, status=status.HTTP_200_OK)


class ContractSchemaView(APIView):
    """
    GET /api/assessments/contract/
    Returns the shared_types.json contract for developer inspection.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        contract_path = BASE_DIR / "shared_types.json"
        if os.path.exists(contract_path):
            with open(contract_path, "r", encoding="utf-8") as f:
                schema_data = json.load(f)
            return Response(schema_data, status=status.HTTP_200_OK)
        return Response({"error": "shared_types.json not found"}, status=status.HTTP_404_NOT_FOUND)


class FirebaseConfigView(APIView):
    """
    GET /api/config/firebase/
    Exposes public Firebase web configuration for dynamic frontend client setup.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        from django.conf import settings
        return Response(getattr(settings, "FIREBASE_WEB_CONFIG", {}), status=status.HTTP_200_OK)


class LibrarySearchView(APIView):
    """
    GET /api/library/search/?q=[topic]
    Uses Gemini AI (via ai_engine generators) to find highly relevant multi-format
    learning resources. Falls back gracefully on 503 Overload errors.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([], status=status.HTTP_200_OK)
            
        try:
            from ai_engine.generators import generate_library_resources
        except ImportError:
            from packages.ai_engine.generators import generate_library_resources
            
        resources = generate_library_resources(query)
        return Response(resources, status=status.HTTP_200_OK)


class CartesiaTTSProxyView(APIView):
    """
    Proxies text-to-speech requests to the Cartesia Sonic API.
    Keeps the API key secure on the server side and avoids browser CORS issues.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        import requests as http_requests

        text = request.data.get("text", "").strip()
        if not text:
            return Response(
                {"error": "No text provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cartesia_key = os.environ.get("CARTESIA_API_KEY", "")
        if not cartesia_key:
            return Response(
                {"error": "Cartesia API key not configured on the server"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            cartesia_response = http_requests.post(
                "https://api.cartesia.ai/tts/bytes",
                headers={
                    "Cartesia-Version": "2024-06-10",
                    "X-API-Key": cartesia_key,
                    "Content-Type": "application/json",
                },
                json={
                    "model_id": "sonic-2",
                    "transcript": text,
                    "voice": {
                        "mode": "id",
                        "id": "694f9389-aac1-45b6-b726-9d9369183238",
                    },
                    "output_format": {
                        "container": "mp3",
                        "bit_rate": 128000,
                        "sample_rate": 44100,
                    },
                    "language": "en",
                },
                timeout=15,
            )

            if cartesia_response.status_code != 200:
                logger.warning(
                    "Cartesia API error %s: %s",
                    cartesia_response.status_code,
                    cartesia_response.text[:200],
                )
                return Response(
                    {"error": f"Cartesia API returned {cartesia_response.status_code}"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            from django.http import HttpResponse
            response = HttpResponse(
                cartesia_response.content,
                content_type="audio/mpeg",
            )
            response["Content-Length"] = len(cartesia_response.content)
            response["Cache-Control"] = "no-cache"
            return response

        except http_requests.exceptions.Timeout:
            return Response(
                {"error": "Cartesia API request timed out"},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except Exception as e:
            logger.exception("Cartesia TTS proxy error: %s", e)
            return Response(
                {"error": "Internal TTS error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
