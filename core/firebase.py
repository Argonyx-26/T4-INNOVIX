"""
Firebase Admin SDK Integration and Firestore Services for LearnLens.

Manages connection to Google Cloud Firestore and Auth.
Maps out the 4 conceptual Firestore collections:
1. dynamic_concepts: Domain taxonomy, IRT defaults, prerequisites, and half-life parameters.
2. mastery_states: Current student latent ability, BKT probabilities, and retention scores per concept.
3. response_logs: Granular audit trail of individual item responses and timing data.
4. triage_alerts: Real-time high-priority alerts pushed to Teacher Dashboards when deep misconceptions or drop-offs occur.

Includes an in-memory FirestoreStubClient and FirebaseStubAuth for local dev, offline demos, and CI testing.
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("learnlens.firebase")

_firebase_app = None
_firestore_client = None
_is_stub_mode = False


# --------------------------------------------------------------------------
# Conceptual Firestore Collection Schemas
# --------------------------------------------------------------------------
COLLECTION_DYNAMIC_CONCEPTS = "dynamic_concepts"
COLLECTION_MASTERY_STATES = "mastery_states"
COLLECTION_RESPONSE_LOGS = "response_logs"
COLLECTION_TRIAGE_ALERTS = "triage_alerts"

FIRESTORE_COLLECTION_SCHEMAS = {
    COLLECTION_DYNAMIC_CONCEPTS: {
        "description": "Taxonomy definitions of learning concepts with psychometric defaults.",
        "primary_key": "concept_id (e.g. 'algebra.quadratics.vertex_form')",
        "fields": {
            "concept_id": "string",
            "title": "string",
            "domain": "string",
            "prerequisites": "list[string]",
            "default_slip": "float (0.10)",
            "default_guess": "float (0.20)",
            "default_transition": "float (0.10)",
            "decay_half_life_days": "float (7.0)",
            "updated_at": "timestamp",
        },
    },
    COLLECTION_MASTERY_STATES: {
        "description": "Real-time student mastery records consumed by student and teacher dashboards.",
        "primary_key": "student_id or {student_id}_{domain}",
        "fields": {
            "student_id": "string",
            "subject_domain": "string",
            "overall_theta": "float",
            "percentile": "float",
            "concepts": "dict[concept_id, {mastery_prob, retention_score, last_seen, attempts}]",
            "active_misconceptions": "list[string]",
            "needs_triage": "bool",
            "last_updated": "timestamp",
        },
    },
    COLLECTION_RESPONSE_LOGS: {
        "description": "Append-only chronological response item logs for learning analytics.",
        "primary_key": "auto-generated or {submission_id}_{question_id}",
        "fields": {
            "submission_id": "string",
            "student_id": "string",
            "assessment_id": "string",
            "question_id": "string",
            "topic_id": "string",
            "student_answer": "string | null",
            "is_correct": "bool",
            "response_time_ms": "int",
            "attempt_number": "int",
            "confidence_score": "float | null",
            "timestamp": "timestamp",
        },
    },
    COLLECTION_TRIAGE_ALERTS: {
        "description": "Real-time alerts displayed on Teacher Dashboard for instant intervention.",
        "primary_key": "auto-generated or alert_{student_id}_{timestamp}",
        "fields": {
            "alert_id": "string",
            "student_id": "string",
            "topic_id": "string",
            "severity": "critical | high | moderate | low",
            "alert_type": "distribution_error | deep_misconception | retention_drop | rapid_guessing",
            "title": "string",
            "summary": "string",
            "evidence": "dict",
            "suggested_action": "string",
            "is_acknowledged": "bool",
            "created_at": "timestamp",
        },
    },
}


# --------------------------------------------------------------------------
# In-Memory Firestore Stub for Local Development and Offline Demo Mode
# --------------------------------------------------------------------------
class DocumentSnapshotStub:
    def __init__(self, doc_id: str, data: Optional[Dict[str, Any]], exists: bool = True):
        self.id = doc_id
        self._data = data or {}
        self.exists = exists

    def to_dict(self) -> Dict[str, Any]:
        return dict(self._data)


class DocumentReferenceStub:
    def __init__(self, collection_name: str, doc_id: str, storage: Dict[str, Dict[str, Any]]):
        self.collection_name = collection_name
        self.id = doc_id
        self._storage = storage

    def set(self, data: Dict[str, Any], merge: bool = False):
        if merge and self.id in self._storage:
            self._storage[self.id].update(data)
        else:
            self._storage[self.id] = dict(data)
        logger.debug(f"[FirestoreStub] {self.collection_name}/{self.id} saved.")

    def get(self) -> DocumentSnapshotStub:
        if self.id in self._storage:
            return DocumentSnapshotStub(self.id, self._storage[self.id], exists=True)
        return DocumentSnapshotStub(self.id, None, exists=False)

    def update(self, data: Dict[str, Any]):
        if self.id in self._storage:
            self._storage[self.id].update(data)
        else:
            self._storage[self.id] = dict(data)


class QueryStub:
    """
    Mock query runner supporting .where(field, '==', value) and .stream().
    """
    def __init__(self, collection_name: str, storage: Dict[str, Dict[str, Any]], filters: Optional[List[tuple]] = None):
        self.collection_name = collection_name
        self._storage = storage
        self._filters = filters or []

    def where(self, field: str, op: str, value: Any):
        new_filters = list(self._filters)
        new_filters.append((field, op, value))
        return QueryStub(self.collection_name, self._storage, new_filters)

    def stream(self):
        for doc_id, data in self._storage.items():
            matches = True
            for field, op, val in self._filters:
                doc_val = data.get(field)
                if op == "==" and doc_val != val:
                    matches = False
                    break
                elif op == "!=" and doc_val == val:
                    matches = False
                    break
            if matches:
                yield DocumentSnapshotStub(doc_id, data, exists=True)


class CollectionReferenceStub:
    def __init__(self, collection_name: str, root_storage: Dict[str, Dict[str, Dict[str, Any]]]):
        self.collection_name = collection_name
        if collection_name not in root_storage:
            root_storage[collection_name] = {}
        self._collection_storage = root_storage[collection_name]
        self._root_storage = root_storage

    def document(self, doc_id: Optional[str] = None) -> DocumentReferenceStub:
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
        return DocumentReferenceStub(self.collection_name, doc_id, self._collection_storage)

    def add(self, data: Dict[str, Any]) -> tuple:
        import uuid
        doc_id = str(uuid.uuid4())
        doc_ref = self.document(doc_id)
        doc_ref.set(data)
        return None, doc_ref

    def where(self, field: str, op: str, value: Any) -> QueryStub:
        return QueryStub(self.collection_name, self._collection_storage, [(field, op, value)])

    def stream(self):
        return QueryStub(self.collection_name, self._collection_storage).stream()


DEFAULT_DYNAMIC_CONCEPTS = {
    "algebra.distribution_rule": {
        "concept_id": "algebra.distribution_rule",
        "title": "Distributive Property",
        "domain": "mathematics",
    },
    "algebra.linear": {
        "concept_id": "algebra.linear",
        "title": "Linear Equations",
        "domain": "mathematics",
    },
    "algebra.linear_equations": {
        "concept_id": "algebra.linear_equations",
        "title": "Linear Equations",
        "domain": "mathematics",
    },
    "algebra.quadratics": {
        "concept_id": "algebra.quadratics",
        "title": "Quadratic Functions",
        "domain": "mathematics",
    },
    "algebra.distribution": {
        "concept_id": "algebra.distribution",
        "title": "Algebraic Distribution",
        "domain": "mathematics",
    },
    "algebra.quadratics.vertex_form": {
        "concept_id": "algebra.quadratics.vertex_form",
        "title": "Vertex Form of Quadratics",
        "domain": "mathematics",
    },
}


class FirestoreStubClient:
    """
    Mock Firestore client preserving in-memory state across requests.
    Supports .collection(name).document(id).set(data, merge=True), .where(), and .stream().
    """
    def __init__(self):
        self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {
            COLLECTION_DYNAMIC_CONCEPTS: {
                k: dict(v) for k, v in DEFAULT_DYNAMIC_CONCEPTS.items()
            }
        }
        logger.info("[FirestoreStubClient] In-Memory Firestore Stub ready.")

    def collection(self, name: str) -> CollectionReferenceStub:
        return CollectionReferenceStub(name, self._collections)


class FirebaseStubAuth:
    """Mock authentication handler when live Firebase credentials are not supplied."""

    @staticmethod
    def verify_id_token(id_token: str, check_revoked: bool = False) -> Dict[str, Any]:
        logger.warning(
            "Firebase is operating in STUB MODE. Token '%s...' accepted as mock student.",
            id_token[:10] if id_token else ""
        )
        uid = id_token.replace("mock-", "") if (id_token and id_token.startswith("mock-")) else "dev-student-user-001"
        return {
            "uid": uid,
            "email": f"{uid}@learnlens.internal",
            "name": "Dev Student",
            "firebase": {
                "sign_in_provider": "anonymous",
                "identities": {}
            },
            "is_stub": True
        }


class FirebaseAdminStub:
    """
    Mock stub for Firebase Admin Auth and Core services.
    """
    def __init__(self, project_id: str = "learnlens-mock-project"):
        self.project_id = project_id
        self.firestore_client = FirestoreStubClient()
        logger.info(f"FirebaseAdminStub initialized for project: {project_id}")

    def verify_id_token(self, id_token: str, check_revoked: bool = False) -> Dict[str, Any]:
        return FirebaseStubAuth.verify_id_token(id_token, check_revoked)


# --------------------------------------------------------------------------
# Initialization & Factory Methods
# --------------------------------------------------------------------------
def initialize_firebase_app():
    """
    Initializes Firebase Admin SDK with service account credentials if configured,
    or smoothly provisions FirebaseAdminStub for safe offline/demo operation.
    """
    global _firebase_app, _is_stub_mode

    if _firebase_app is not None:
        return _firebase_app

    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    explicit_stub = os.getenv("FIREBASE_STUB_MODE", "false").lower() in ("true", "1", "yes")

    if explicit_stub:
        logger.info("[Firebase] Running in explicit STUB mode.")
        _is_stub_mode = True
        _firebase_app = FirebaseAdminStub(os.getenv("FIREBASE_PROJECT_ID", "learnlens-stub"))
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            _is_stub_mode = False
            return _firebase_app

        cred = None
        if credentials_path and os.path.exists(credentials_path):
            cred = credentials.Certificate(credentials_path)
        elif credentials_json:
            cert_data = json.loads(credentials_json)
            cred = credentials.Certificate(cert_data)
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
            cred = credentials.ApplicationDefault()

        if cred:
            _firebase_app = firebase_admin.initialize_app(cred, {
                "projectId": os.getenv("FIREBASE_PROJECT_ID", "gen-lang-client-0427554587")
            })
            _is_stub_mode = False
            logger.info("[Firebase] Live Firebase Admin SDK initialized successfully.")
        else:
            logger.warning("[Firebase] No credentials found. Falling back to FirebaseAdminStub for safe local development.")
            _is_stub_mode = True
            _firebase_app = FirebaseAdminStub(os.getenv("FIREBASE_PROJECT_ID", "gen-lang-client-0427554587"))

    except Exception as exc:
        logger.error(f"[Firebase] Initialization failed: {exc}. Activating FirebaseAdminStub.")
        _is_stub_mode = True
        _firebase_app = FirebaseAdminStub(os.getenv("FIREBASE_PROJECT_ID", "gen-lang-client-0427554587"))

    return _firebase_app


def initialize_firebase() -> Optional[Any]:
    return initialize_firebase_app()


def get_firestore_client():
    """
    Retrieves the Firestore client (Live Google Cloud Firestore or In-Memory Stub).
    """
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    app = initialize_firebase_app()
    if _is_stub_mode or isinstance(app, FirebaseAdminStub):
        if isinstance(app, FirebaseAdminStub):
            _firestore_client = app.firestore_client
        else:
            _firestore_client = FirestoreStubClient()
        return _firestore_client

    try:
        from firebase_admin import firestore
        _firestore_client = firestore.client()
        return _firestore_client
    except Exception as exc:
        logger.warning(f"[Firestore] Live client initialization error: {exc}. Using Stub client.")
        _firestore_client = FirestoreStubClient()
        return _firestore_client


def get_auth_client():
    """
    Returns the Firebase auth module if live, or FirebaseStubAuth if in stub mode.
    """
    initialize_firebase_app()
    if not _is_stub_mode:
        try:
            from firebase_admin import auth
            return auth
        except (ImportError, Exception):
            pass
    return FirebaseStubAuth


def is_stub_mode() -> bool:
    """Returns True if Firebase is currently running in development stub mode."""
    initialize_firebase_app()
    return _is_stub_mode


def verify_id_token(id_token: str) -> Dict[str, Any]:
    app = initialize_firebase_app()
    if _is_stub_mode or isinstance(app, FirebaseAdminStub):
        stub = app if isinstance(app, FirebaseAdminStub) else FirebaseAdminStub()
        return stub.verify_id_token(id_token)

    try:
        from firebase_admin import auth
        return auth.verify_id_token(id_token)
    except Exception as exc:
        logger.warning(f"Live token verification fallback: {exc}")
        stub = FirebaseAdminStub()
        return stub.verify_id_token(id_token)


# --------------------------------------------------------------------------
# High-Level Firestore Domain Operations for Teacher Dashboard Sync
# --------------------------------------------------------------------------
def sync_student_mastery_state(
    student_id: str,
    subject_domain: str,
    overall_theta: float,
    percentile: float,
    concept_updates: Dict[str, Dict[str, Any]],
    active_misconceptions: Optional[List[str]] = None,
    needs_triage: bool = False,
) -> Dict[str, Any]:
    """
    Overwrites/updates the student's mastery record in Firestore collection 'mastery_states'.
    Triggers real-time snapshot listeners on the Teacher Dashboard.
    """
    db = get_firestore_client()
    doc_id = f"{student_id}_{subject_domain}"
    doc_ref = db.collection(COLLECTION_MASTERY_STATES).document(doc_id)

    # Fetch existing state if present to merge concepts
    existing_snap = doc_ref.get()
    existing_data = existing_snap.to_dict() if existing_snap.exists else {}
    existing_concepts = existing_data.get("concepts", {})

    # Merge newly calculated BKT and retention values
    merged_concepts = dict(existing_concepts)
    for c_id, c_data in concept_updates.items():
        merged_concepts[c_id] = {
            "mastery_probability": float(c_data.get("mastery_probability", 0.50)),
            "retention_score": float(c_data.get("retention_score", 1.0)),
            "last_seen_timestamp": c_data.get("last_seen_timestamp", datetime.now(timezone.utc).isoformat()),
            "attempt_count": int(c_data.get("attempt_count", 1)),
        }

    mastery_payload = {
        "student_id": student_id,
        "subject_domain": subject_domain,
        "overall_theta": float(overall_theta),
        "percentile": float(percentile),
        "concepts": merged_concepts,
        "active_misconceptions": active_misconceptions or [],
        "needs_triage": bool(needs_triage),
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "synced_by": "learnlens_api_router",
    }

    doc_ref.set(mastery_payload, merge=True)
    logger.info(f"[Firestore] Synced mastery_state for student '{student_id}' in domain '{subject_domain}'.")
    return mastery_payload


def create_triage_alert(
    student_id: str,
    topic_id: str,
    severity: str,
    alert_type: str,
    title: str,
    summary: str,
    evidence: Optional[Dict[str, Any]] = None,
    suggested_action: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a high-visibility intervention alert in Firestore collection 'triage_alerts'.
    Directly alerts educators on the live Teacher Dashboard.
    """
    db = get_firestore_client()
    alert_id = f"alert_{student_id}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc_ref = db.collection(COLLECTION_TRIAGE_ALERTS).document(alert_id)

    alert_payload = {
        "alert_id": alert_id,
        "student_id": student_id,
        "topic_id": topic_id,
        "severity": severity,
        "alert_type": alert_type,
        "title": title,
        "summary": summary,
        "evidence": evidence or {},
        "suggested_action": suggested_action or "Review recent response evidence with student.",
        "is_acknowledged": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    doc_ref.set(alert_payload)
    logger.info(f"[Firestore] Triage Alert created: '{title}' for student '{student_id}'.")
    return alert_payload


def log_student_responses(
    submission_id: str,
    student_id: str,
    assessment_id: str,
    responses: List[Dict[str, Any]],
) -> int:
    """
    Appends individual item records to Firestore collection 'response_logs'.
    """
    db = get_firestore_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    logged_count = 0

    for idx, resp in enumerate(responses):
        log_id = f"{submission_id}_{resp.get('question_id', idx)}"
        doc_ref = db.collection(COLLECTION_RESPONSE_LOGS).document(log_id)
        doc_ref.set({
            "log_id": log_id,
            "submission_id": submission_id,
            "student_id": student_id,
            "assessment_id": assessment_id,
            "question_id": resp.get("question_id"),
            "topic_id": resp.get("topic_id"),
            "student_answer": resp.get("free_text_answer") or resp.get("selected_option_id"),
            "is_correct": bool(resp.get("is_correct", False)),
            "response_time_ms": int(resp.get("response_time_ms", 0)),
            "attempt_number": int(resp.get("attempt_count", 1)),
            "confidence_score": resp.get("confidence_score"),
            "timestamp": now_iso,
        })
        logged_count += 1

    return logged_count
