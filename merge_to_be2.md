# LearnLens: BE1 ↔ BE2 Handshake & Integration Specification (`merge_to_be2.md`)

**Document Version:** 1.0.0  
**Generated At:** 2026-09-25T15:15:00+05:30  
**Target Roles:** BE1 (API Architect & Data Engineer) & BE2 (AI Engine & ML Engineer)  
**System Status:** 15/15 Tests Passing (100% Pass Rate) | Django System Check: 0 Issues  

---

## 1. Executive Summary

This document establishes the official integration handshake between **BE1 (Deterministic Core & Orchestrator)** and **BE2 (Probabilistic AI & ML Engine)** for the LearnLens diagnostic platform.

### Architectural Philosophy:
* **BE1 (Anchor):** Owns API routing, request validation, identity authentication, Bayesian Knowledge Tracing (BKT), Ebbinghaus retention decay, and multi-collection Firebase Firestore synchronization.
* **BE2 (Reasoning):** Owns behavioral response classification, prompt engineering, Gemini/OpenAI LLM diagnostic inference, and offline demo fallbacks.
* **Decoupled Boundary:** BE1 imports BE2's functions as a black box. BE2 writes zero database queries and zero HTTP views, preventing merge conflicts and guaranteeing data integrity.

---

## 2. The 4 Pre-Merge Handshake Checkpoints

| Checkpoint | Target Function / Module | Contract Status | Verified Behavior |
|---|---|---|---|
| **1. Import Verification** | `ai_engine` / `packages.ai_engine` | **[READY]** | Resilient dual-path imports in [`api/views.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/api/views.py#L32-L41). Automatically resolves imports whether BE2 code resides at root `/ai_engine/` or nested `/packages/ai_engine/`. |
| **2. Signature Matching** | `classify_behavior` & `analyze_misconception` | **[READY]** | Correct parameter binding. `classify_behavior(time_ms, attempts)` and `analyze_misconception(student_answer, concept_id)`. |
| **3. Fallback Handling** | `get_demo_fallback` | **[READY]** | When `get_demo_fallback(student_answer)` returns a dictionary (for `"3.5"`), the router bypasses classifier and LLM calls, protecting against network loss. |
| **4. Data Handoff** | `update_student_state` | **[READY]** | The dictionary returned by BE2's diagnostic function is passed into `update_student_state()`, populating `response_logs` and triggering `triage_alerts` (`NEEDS_INTERVENTION`). |

---

## 3. Code Evidence: The 7-Step Diagnostic Handshake

Below is the verified implementation in [`api/views.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/api/views.py) connecting BE1 and BE2:

```python
# ==============================================================================
# Step 1: Authentication & Request Validation (BE1)
# ==============================================================================
serializer = AssessmentSubmissionRequestSerializer(data=request.data)
serializer.is_valid(raise_exception=True)
validated_data = serializer.validated_data

student_id = validated_data["student_id"]
concept_id = validated_data["concept_id"]
student_answer = validated_data.get("student_answer")
time_ms = validated_data["time_ms"]
attempts = validated_data.get("attempts", 1)

# Step 1b: Taxonomy Validation against dynamic_concepts (BE1)
if not verify_concept_exists(concept_id):
    raise ValidationError("Invalid concept_id: Concept does not exist in taxonomy.")

# Step 1c: Anti-Spoofing Identity Verification (BE1)
if hasattr(request.user, "uid") and request.user.uid != student_id:
    raise PermissionDenied("Student ID does not match authenticated user.")

# ==============================================================================
# Step 2: Conference Demo Fallback (BE2)
# ==============================================================================
diagnosis = get_demo_fallback(student_answer)

if diagnosis is not None:
    # Bypasses Steps 3 and 4 for pitch resiliency
    logger.info("Demo Fallback triggered; bypassing LLM.")
else:
    # ==========================================================================
    # Step 3: Latency & Attempts Behavioral Classifier (BE2)
    # ==========================================================================
    behavior = classify_behavior(time_ms=time_ms, attempts=attempts)

    if behavior == "CARELESS_ERROR":
        return Response(
            {
                "status": "careless",
                "message": "Take your time and check your math.",
            },
            status=status.HTTP_200_OK,
        )

    # ==========================================================================
    # Step 4: AI Diagnostic Misconception Reasoning (BE2)
    # ==========================================================================
    diagnosis = analyze_misconception(student_answer, concept_id)

# ==============================================================================
# Step 5: Read-Before-Write & Mathematical Calculations (BE1)
# ==============================================================================
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
)

new_mastery = calculate_new_mastery(
    prior_mastery=prior_mastery,
    is_correct=is_correct,
    slip_rate=0.10,
    guess_rate=0.20,
)

# ==============================================================================
# Step 6: Firestore Database Synchronization (BE1)
# ==============================================================================
update_student_state(
    student_id=student_id,
    concept_id=concept_id,
    new_mastery=new_mastery,
    diagnostic_data=diagnosis,
    retention_score=retention_score,
)

# ==============================================================================
# Step 7: HTTP 200 API Response (BE1)
# ==============================================================================
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
```

---

## 4. Contract Signatures & Types

### 4.1 BE2 Function Signatures Required by BE1
```python
def get_demo_fallback(student_answer: Any) -> Optional[Dict[str, Any]]:
    """Returns a dict if student_answer == '3.5', else None."""

def classify_behavior(time_ms: Union[int, float], attempts: int = 1) -> str:
    """Returns 'CARELESS_ERROR', 'DEEP_MISCONCEPTION', or 'STANDARD'."""

def analyze_misconception(student_answer: Any, concept_id: str) -> Dict[str, Any]:
    """Returns structured diagnosis JSON with misconception details."""
```

### 4.2 Expected Diagnostic Payload from BE2
```json
{
  "status": "misconception",
  "misconception": "Distribution Error",
  "severity": "critical",
  "diagnostic_summary": "Student failed to multiply coefficient across both terms.",
  "suggested_action": "Review distributive property with visual tiles.",
  "identified_misconceptions": [
    {
      "topic_id": "algebra.distribution_rule",
      "misconception_name": "Distribution Error",
      "severity": "critical"
    }
  ]
}
```

---

## 5. Phase 1, Phase 2, and Phase 3 Delivery Matrix

| Phase | Milestone | Implemented Modules | Verified Status |
|---|---|---|---|
| **Phase 1** | Foundation & Routing | [`core/`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/core/), [`math_engine/bkt.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/math_engine/bkt.py), [`api/views.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/api/views.py) | **VERIFIED** |
| **Phase 2** | Security & Read-Before-Write | [`api/firebase_client.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/api/firebase_client.py), [`core/authentication.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/core/authentication.py), [`api/serializers.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/api/serializers.py) | **VERIFIED** |
| **Phase 3** | Taxonomy & Dashboard APIs | [`api/urls.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/api/urls.py), [`core/settings.py`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/core/settings.py) (`Throttling`, `CORS`), `Teacher Views` | **VERIFIED** |

### Additional Teacher Dashboard Endpoints (Phase 3):
1. `GET /api/teacher/triage-alerts/`
   * Protected: Requires `Authorization: Bearer <token>`
   * Returns: List of student alerts where `status == "NEEDS_INTERVENTION"`.
2. `GET /api/teacher/class-heatmap/`
   * Protected: Requires `Authorization: Bearer <token>`
   * Returns: Dictionary of students with their respective `mastery_score` and `retention_score`.

---

## 6. Automated Test Verification (15/15 Passing)

Execute the test suite at any time via:
```bash
python manage.py test api
```

```text
Ran 15 tests in 1.093s

OK
Destroying test database for alias 'default'...
Found 15 test(s).
System check identified no issues (0 silenced).
```

### Verified Test Cases:
1. `test_calculate_new_mastery_bkt`: Math engine posterior calculations and clamping.
2. `test_calculate_retention_ebbinghaus`: Math engine memory retention decay curve.
3. `test_firebase_update_and_read_student_state`: Firestore read-before-write and logging.
4. `test_post_assessment_unauthenticated_rejected_401`: Token requirement enforcement.
5. `test_post_assessment_id_spoofing_rejected_403`: Student ID token spoofing protection.
6. `test_post_assessment_strict_validation_errors_400`: DRF request body schema enforcement.
7. `test_taxonomy_validation_invalid_concept_rejected_400`: Taxonomy existence check rejection.
8. `test_post_assessment_demo_fallback_3_5`: Pitch demo fallback answer `"3.5"`.
9. `test_post_assessment_careless_error_filter`: Rapid latency careless error interception.
10. `test_post_assessment_deep_misconception_flow_with_retention`: End-to-end 7-step pipeline.
11. `test_teacher_triage_feed_endpoint`: Filtered teacher alert stream.
12. `test_teacher_class_heatmap_endpoint`: Aggregated class heatmap dictionary.
13. `test_config_firebase_endpoint`: Public web client configuration endpoint.
14. `test_teacher_dashboard_endpoints_unauthenticated_rejected`: 401 guard on dashboard views.
15. `test_phase3_production_security_settings`: Rate throttling and CORS origin configuration.

---

## 7. Instructions for BE2 Developers

1. **Working Directory:** Write and optimize your prompts, model clients, and heuristics strictly in [`/ai_engine/`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/ai_engine/).
2. **Environment Variables:** Provide your OpenAI/Gemini API keys in `.env` (`OPENAI_API_KEY`, `OPENAI_MODEL`).
3. **No Direct DB Calls:** Do not import `firebase_admin` or perform Firestore calls inside `/ai_engine/`. The orchestrator (`api/views.py`) handles all database operations automatically.
4. **Merge Confidence:** The dual-import mechanism in `api/views.py` guarantees immediate compatibility whether you push code directly to `/ai_engine/` or via a package namespace.
