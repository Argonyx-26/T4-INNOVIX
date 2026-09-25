"""
Firebase Firestore Client for LearnLens API (BE1).
Handles student mastery state synchronization, concept state reading, response logging,
and Teacher Dashboard triage alerts.
"""

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger("learnlens.firebase_client")

_db = None


def get_firestore_db():
    """
    Initializes and returns the Firestore client using default credentials,
    mounted service accounts, or the safe local development stub.
    """
    global _db
    if _db is not None:
        return _db

    project_id = os.getenv("FIREBASE_PROJECT_ID", "gen-lang-client-0427554587")
    stub_mode = os.getenv("FIREBASE_STUB_MODE", "false").lower() in ("true", "1", "yes")

    if stub_mode:
        from core.firebase import get_firestore_client
        _db = get_firestore_client()
        return _db

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred = None
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            elif cred_json:
                cred = credentials.Certificate(json.loads(cred_json))
            elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
                cred = credentials.ApplicationDefault()

            if cred:
                firebase_admin.initialize_app(cred, {"projectId": project_id})
            else:
                try:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, {"projectId": project_id})
                except Exception:
                    logger.warning("[Firebase Client] No default credentials found; activating stub client.")
                    from core.firebase import get_firestore_client
                    _db = get_firestore_client()
                    return _db

        _db = firestore.client()
        logger.info(f"[Firebase Client] Connected to Firestore project: {project_id}")
        return _db

    except Exception as exc:
        logger.warning(f"[Firebase Client] Falling back to stub Firestore: {exc}")
        from core.firebase import get_firestore_client
        _db = get_firestore_client()
        return _db


def _parse_timestamp(raw_value: Any) -> Optional[float]:
    """Helper to convert varied timestamp formats (float, int, ISO string) to epoch seconds."""
    if raw_value is None:
        return None
    if isinstance(raw_value, (int, float)):
        return float(raw_value)
    if isinstance(raw_value, str):
        try:
            iso_clean = raw_value.replace("Z", "+00:00")
            dt = datetime.fromisoformat(iso_clean)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.timestamp()
        except Exception:
            return None
    return None


def get_student_concept_state(student_id: str, concept_id: str) -> Dict[str, Any]:
    """
    Queries Firestore 'mastery_states' collection for a student's prior concept mastery.

    Returns:
        dict: {"prior_mastery": float, "last_seen_timestamp": Optional[float]}
        Defaults to {"prior_mastery": 0.50, "last_seen_timestamp": None} if not found.
    """
    default_state = {"prior_mastery": 0.50, "last_seen_timestamp": None}
    try:
        db = get_firestore_db()
        doc_snap = db.collection("mastery_states").document(str(student_id)).get()

        if not doc_snap.exists:
            return default_state

        data = doc_snap.to_dict() or {}
        concept_data = None

        # 1. Check nested dict: data["concepts"][concept_id]
        if "concepts" in data and isinstance(data["concepts"], dict):
            concept_data = data["concepts"].get(concept_id)

        # 2. Check dotted key representation: data["concepts.<concept_id>"]
        if not concept_data and f"concepts.{concept_id}" in data:
            concept_data = data.get(f"concepts.{concept_id}")

        # 3. Check direct top-level fields matching concept_id
        if not concept_data and data.get("concept_id") == concept_id:
            concept_data = data

        if not concept_data or not isinstance(concept_data, dict):
            # If student doc exists with global mastery_score fallback
            if "mastery_score" in data:
                prior_m = float(data["mastery_score"])
                last_seen_raw = data.get("last_seen_timestamp") or data.get("last_updated")
                return {
                    "prior_mastery": prior_m,
                    "last_seen_timestamp": _parse_timestamp(last_seen_raw),
                }
            return default_state

        prior_m = float(concept_data.get("mastery_score", concept_data.get("mastery_prob", 0.50)))
        last_seen_raw = (
            concept_data.get("last_seen_timestamp")
            or concept_data.get("last_practiced")
            or concept_data.get("last_seen")
            or data.get("last_updated")
        )
        last_ts = _parse_timestamp(last_seen_raw)

        return {
            "prior_mastery": prior_m,
            "last_seen_timestamp": last_ts,
        }

    except Exception as exc:
        logger.error(f"[Firebase Error] Failed to read concept state for '{student_id}': {exc}")
        return default_state


def update_student_state(
    student_id: str,
    concept_id: str,
    new_mastery: float,
    diagnostic_data: Dict[str, Any],
    retention_score: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Synchronizes the student's evaluated state with Firebase Firestore:
    1. Updates mastery_score and retention_score in 'mastery_states'.
    2. Writes a new log entry to 'response_logs'.
    3. Updates student's alert status in 'triage_alerts' to 'NEEDS_INTERVENTION'
       if a misconception was diagnosed, attaching diagnostic_data.

    Parameters:
        student_id (str): Identifier of the student.
        concept_id (str): Topic or concept identifier.
        new_mastery (float): Updated BKT mastery score.
        diagnostic_data (dict): Synthesis output from AI or fallback engine.
        retention_score (float, optional): Ebbinghaus retention decay score.

    Returns:
        dict: Operation status summary.
    """
    db = get_firestore_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_ts = time.time()
    result = {
        "student_id": str(student_id),
        "concept_id": str(concept_id),
        "new_mastery": float(new_mastery),
        "mastery_updated": False,
        "logged": False,
        "triage_alert": False,
    }

    # 1. Update mastery_score & retention_score in 'mastery_states' collection
    try:
        mastery_doc_ref = db.collection("mastery_states").document(str(student_id))
        concept_record = {
            "mastery_score": float(new_mastery),
            "last_practiced": now_iso,
            "last_seen_timestamp": now_ts,
        }
        if retention_score is not None:
            concept_record["retention_score"] = float(retention_score)

        mastery_payload = {
            "student_id": str(student_id),
            "concept_id": str(concept_id),
            "mastery_score": float(new_mastery),
            f"concepts.{concept_id}": concept_record,
            "last_updated": now_iso,
            "last_seen_timestamp": now_ts,
        }
        if retention_score is not None:
            mastery_payload["retention_score"] = float(retention_score)

        mastery_doc_ref.set(mastery_payload, merge=True)
        result["mastery_updated"] = True
        logger.info(f"[Firebase] Updated mastery_states for student '{student_id}' on concept '{concept_id}'.")

    except Exception as exc:
        logger.error(f"[Firebase Error] Failed to update mastery_states for '{student_id}': {exc}")

    # 2. Write new log entry to 'response_logs' collection
    try:
        log_doc_ref = db.collection("response_logs").document()
        log_payload = {
            "student_id": str(student_id),
            "concept_id": str(concept_id),
            "mastery_score": float(new_mastery),
            "retention_score": float(retention_score) if retention_score is not None else None,
            "diagnostic_data": diagnostic_data or {},
            "timestamp": now_iso,
        }
        log_doc_ref.set(log_payload)
        result["logged"] = True
        logger.info(f"[Firebase] Appended response log for student '{student_id}'.")

    except Exception as exc:
        logger.error(f"[Firebase Error] Failed to write response_logs for '{student_id}': {exc}")

    # 3. Check if a misconception was diagnosed and update 'triage_alerts'
    try:
        has_misconception = False
        if diagnostic_data and isinstance(diagnostic_data, dict):
            has_misconception = bool(
                diagnostic_data.get("status") == "misconception"
                or diagnostic_data.get("misconception")
                or diagnostic_data.get("identified_misconceptions")
                or str(diagnostic_data.get("severity", "")).lower() in ("critical", "high", "moderate")
            )

        if has_misconception:
            alert_doc_ref = db.collection("triage_alerts").document(f"alert_{student_id}")
            alert_payload = {
                "student_id": str(student_id),
                "concept_id": str(concept_id),
                "status": "NEEDS_INTERVENTION",
                "diagnostic_data": diagnostic_data,
                "updated_at": now_iso,
            }
            alert_doc_ref.set(alert_payload, merge=True)
            result["triage_alert"] = True
            logger.info(f"[Firebase] Triage alert set to NEEDS_INTERVENTION for student '{student_id}'.")

    except Exception as exc:
        logger.error(f"[Firebase Error] Failed to update triage_alerts for '{student_id}': {exc}")

    return result


def verify_concept_exists(concept_id: str) -> bool:
    """
    Queries the 'dynamic_concepts' Firestore collection.
    Returns True if the concept document exists, False otherwise.
    """
    if not concept_id or not isinstance(concept_id, str):
        return False
    try:
        db = get_firestore_db()
        doc_snap = db.collection("dynamic_concepts").document(str(concept_id).strip()).get()
        return bool(doc_snap.exists)
    except Exception as exc:
        logger.error(f"[Firebase Error] Failed to verify concept '{concept_id}': {exc}")
        return False

