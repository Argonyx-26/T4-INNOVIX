"""
LearnLens API Views (BE1 - The Core Orchestrator).

Coordinates:
1. Firebase ID Token Authentication & Anti-Spoofing verification (core/authentication.py).
2. Strict DRF serializer validation (AssessmentSubmissionRequestSerializer).
3. Dynamic Taxonomy Verification (verify_concept_exists).
4. BE2 AI engine (fallbacks, behavioral classifier, LLM misconception diagnostics).
5. Firestore Read: Read-before-write prior concept state retrieval (get_student_concept_state).
6. Math engine (BKT mastery calculation and Ebbinghaus retention decay).
7. Database Sync: Overwrites mastery, logs response, and creates triage alerts in Firestore.
8. Teacher Dashboard Read Endpoints: Triage feed and class-wide mastery heatmap.
"""

import json
import logging
import os
import time
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Core Security
from core.authentication import FirebaseAuthentication
from core.settings import BASE_DIR

# DRF Serializers
from api.serializers import AssessmentSubmissionRequestSerializer

# BE2 AI Engine Imports
try:
    from packages.ai_engine.fallbacks import get_demo_fallback
    from packages.ai_engine.classifier import classify_behavior
    from packages.ai_engine.diagnostics import analyze_misconception
except ImportError:
    from ai_engine.fallbacks import get_demo_fallback
    from ai_engine.classifier import classify_behavior
    from ai_engine.diagnostics import analyze_misconception

# BE1 Mathematical & Database Imports
from math_engine.bkt import calculate_new_mastery, calculate_retention
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
    Core router executing the strict, authenticated 7-step assessment evaluation pipeline.
    """
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # ------------------------------------------------------------------
        # Step 1: Strict DRF Request Validation
        # ------------------------------------------------------------------
        serializer = AssessmentSubmissionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        student_id = validated_data["student_id"]
        concept_id = validated_data["concept_id"]
        student_answer = validated_data.get("student_answer")
        time_ms = validated_data["time_ms"]
        attempts = validated_data.get("attempts", 1)

        # ------------------------------------------------------------------
        # Step 1b: Concept Taxonomy Verification
        # ------------------------------------------------------------------
        if not verify_concept_exists(concept_id):
            raise ValidationError("Invalid concept_id: Concept does not exist in taxonomy.")

        # ------------------------------------------------------------------
        # Security: Anti-Spoofing Verification
        # ------------------------------------------------------------------
        # Ensure student_id in payload matches the authenticated Firebase UID
        if hasattr(request.user, "uid") and request.user.uid != student_id:
            logger.warning(
                f"[Security Alert] Identity mismatch: Token UID '{request.user.uid}' "
                f"attempted to submit for student_id '{student_id}'."
            )
            raise PermissionDenied("Student ID does not match authenticated user.")

        # ------------------------------------------------------------------
        # Step 2: Check Demo Fallback (Conference Resiliency)
        # ------------------------------------------------------------------
        # If student_answer is '3.5', get_demo_fallback returns the hardcoded
        # Distribution Error dictionary, bypassing external LLM calls.
        diagnosis = get_demo_fallback(student_answer)

        if diagnosis is not None:
            # Skip steps 3 and 4
            logger.info(f"[Core Router] Demo Fallback triggered for student '{student_id}'. Bypassing LLM.")
        else:
            # --------------------------------------------------------------
            # Step 3: Behavior Filter
            # --------------------------------------------------------------
            behavior = classify_behavior(time_ms=time_ms, attempts=attempts)

            if behavior == "CARELESS_ERROR":
                logger.info(f"[Core Router] Careless error flagged for student '{student_id}'. Returning prompt.")
                return Response(
                    {
                        "status": "careless",
                        "message": "Take your time and check your math.",
                    },
                    status=status.HTTP_200_OK,
                )

            # --------------------------------------------------------------
            # Step 4: LLM Misconception Diagnosis
            # --------------------------------------------------------------
            if behavior == "DEEP_MISCONCEPTION":
                logger.info("[Core Router] Deep misconception identified. Invoking AI diagnostic reasoning.")
                diagnosis = analyze_misconception(student_answer, concept_id)
            else:
                diagnosis = analyze_misconception(student_answer, concept_id)

        # ------------------------------------------------------------------
        # Step 5: Read Prior State & Mathematical Calculations
        # ------------------------------------------------------------------
        # 5a. Firestore Read-Before-Write: Fetch historical concept mastery & timestamp
        concept_state = get_student_concept_state(student_id=student_id, concept_id=concept_id)
        last_seen = concept_state.get("last_seen_timestamp")
        current_ts = time.time()

        # 5b. Retention Decay Calculation (Ebbinghaus forgetting curve R = e^(-t/S))
        retention_score = calculate_retention(
            last_seen_timestamp=last_seen,
            current_timestamp=current_ts,
            stability=1.0,
        )

        # 5c. Prior mastery resolution: payload override if passed, else database state
        prior_mastery = validated_data.get("prior_mastery")
        if prior_mastery is None:
            prior_mastery = concept_state.get("prior_mastery", 0.50)

        # 5d. Correctness observation determination
        is_correct = not bool(
            diagnosis.get("status") == "misconception"
            or diagnosis.get("misconception")
            or diagnosis.get("identified_misconceptions")
        )

        # 5e. BKT posterior & knowledge transition update
        new_mastery = calculate_new_mastery(
            prior_mastery=prior_mastery,
            is_correct=is_correct,
            slip_rate=0.10,
            guess_rate=0.20,
        )

        # ------------------------------------------------------------------
        # Step 6: Database Sync (Firebase Firestore)
        # ------------------------------------------------------------------
        update_student_state(
            student_id=student_id,
            concept_id=concept_id,
            new_mastery=new_mastery,
            diagnostic_data=diagnosis,
            retention_score=retention_score,
        )

        # ------------------------------------------------------------------
        # Step 7: Return Response
        # ------------------------------------------------------------------
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


class TeacherTriageFeedView(APIView):
    """
    GET /api/teacher/triage-alerts/
    Queries Firestore 'triage_alerts' for all records where status == 'NEEDS_INTERVENTION'.
    Returns a list of alerts for the Teacher Dashboard.
    """
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            db = get_firestore_db()
            alerts = []
            alerts_stream = db.collection("triage_alerts").where("status", "==", "NEEDS_INTERVENTION").stream()
            for doc_snap in alerts_stream:
                data = doc_snap.to_dict() or {}
                alert_entry = {
                    "alert_id": doc_snap.id,
                    **data,
                }
                alerts.append(alert_entry)
            return Response(alerts, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error(f"[Teacher Dashboard] Failed to fetch triage alerts: {exc}")
            return Response([], status=status.HTTP_200_OK)


class ClassHeatmapView(APIView):
    """
    GET /api/teacher/class-heatmap/
    Queries Firestore 'mastery_states' collection.
    Returns an aggregated JSON dictionary mapping student_id to their respective
    mastery_score and retention_score for rendering the frontend heatmap.
    """
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

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

    def get(self, request, *args, **kwargs):
        from django.conf import settings
        return Response(getattr(settings, "FIREBASE_WEB_CONFIG", {}), status=status.HTTP_200_OK)
