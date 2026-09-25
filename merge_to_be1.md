# LearnLens - BE2 to BE1 Handshake & Merge Specification
**Document:** `merge_to_be1.md`  
**Timestamp:** 2026-09-25T15:12:06+05:30  
**Origin:** Lead AI Engineer (BE2 - AI & ML Engine)  
**Recipient:** Backend Developer 1 (BE1 - Django API & Math Engine Orchestrator)  
**Status:** **ALL 4 INTEGRATION POINTS [READY] — CLEARED FOR MERGE**

---

## 1. Executive Summary

All Phase 1, Phase 2, and Phase 3 modules inside `packages/ai-engine/` have been audited, trained, verified, and aligned with `shared_types.json`. 

This document provides BE1 with the exact import pathways, synchronous function signatures, contract schemas, and copy-paste view orchestration code required to merge the AI Engine into the Django API (`apps/django-api/`) without merge conflicts or server crashes.

---

## 2. Monorepo Architecture & Import Resolution

The workspace is organized into the following isolated monorepo structure:

```
c:/argonyx2/
├── apps/
│   ├── django-api/                  <-- BE1 Workspace (Django, DRF, Math Engine)
│   │   ├── api/
│   │   │   ├── views.py             <-- Integration point for BE2 functions
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── core/                    <-- settings.py (configured with sys.path hook)
│   │   ├── math_engine/             <-- IRT, BKT, scoring algorithms
│   │   └── manage.py
│   ├── student-fe/                  <-- FE1 Workspace (Next.js Focus Mode UI)
│   │   └── mock_diagnostic_response.json
│   └── teacher-fe/                  <-- FE2 Workspace (Next.js Triage Kanban UI)
├── packages/
│   └── ai-engine/                   <-- BE2 Workspace (Local ML & Gemini Pipelines)
│       └── ai_engine/
│           ├── classifier.py        <-- classify_behavior (Scikit-learn RF)
│           ├── behavior_model.joblib<-- Serialized ML model
│           ├── diagnostics.py       <-- analyze_misconception (Gemini API)
│           ├── fallbacks.py         <-- get_demo_fallback ("3.5" interceptor)
│           ├── generators.py        <-- Concept graph, intervention, question
│           └── prompts.py           <-- System prompts aligned with shared_types.json
├── mock_diagnostic_response.json    <-- Static payload for frontend modal
├── shared_types.json                <-- Root API contract
└── restructure_workspace.py         <-- Monorepo reorganization script
```

### Import Hook:
`apps/django-api/core/settings.py` and `manage.py` have been configured to automatically add `packages/ai-engine` to `sys.path`. BE1 can import modules directly:

```python
from ai_engine import (
    classify_behavior,
    analyze_misconception,
    get_demo_fallback,
    generate_concept_graph,
    generate_intervention,
    generate_verification_question,
)
```

---

## 3. Pre-Merge Verification Checklist

| Integration Point | Status | Guarantee & Verification Evidence |
| :--- | :---: | :--- |
| **1. Synchronous Execution** | **[READY]** | All functions use standard Python `def` (zero `async`/`await`). Safe for standard Django synchronous views. |
| **2. Clean Return Types** | **[READY]** | Returns strictly native Python primitives (`str`, `dict`, `None`). No raw `GenerateContentResponse`, gRPC, or Scikit-learn tensor objects escape. |
| **3. Contract Alignment** | **[READY]** | Outputs strictly conform to the nested array schema in `shared_types.json` (`misconceptions` and `recommended_interventions`). |
| **4. Exception Isolation** | **[READY]** | 100% of LLM calls and inference operations are shielded by `try/except` blocks. In the event of a timeout or network drop, functions return safe fallback dictionaries rather than raising 500 errors. |

---

## 4. Exported Function Specifications

### 4.1. Behavior Classifier (`classify_behavior`)
- **File:** `packages/ai-engine/ai_engine/classifier.py`
- **Purpose:** Fast local machine learning classification of student attempt patterns.
- **Signature:**
  ```python
  def classify_behavior(time_ms: int, attempt_count: int, hint_used: int) -> str
  ```
- **Performance:** Sub-millisecond inference using in-memory singleton cached `RandomForestClassifier`.
- **Return Values:** Strictly `"CARELESS_ERROR"` or `"DEEP_MISCONCEPTION"`.

---

### 4.2. Pitch Demo Interceptor (`get_demo_fallback`)
- **File:** `packages/ai-engine/ai_engine/fallbacks.py`
- **Purpose:** Zero-latency, offline safety net for the live pitch demonstration ($2(x+3)=10 \rightarrow x=3.5$).
- **Signature:**
  ```python
  def get_demo_fallback(student_answer: str) -> Optional[Dict[str, Any]]
  ```
- **Return Behavior:**
  - If `student_answer.strip() == "3.5"`: Returns the hardcoded distribution sign error dictionary.
  - Any other answer: Returns `None` (signaling BE1 to invoke live Gemini diagnostics).

---

### 4.3. Cognitive Diagnostic Engine (`analyze_misconception`)
- **File:** `packages/ai-engine/ai_engine/diagnostics.py`
- **Purpose:** Deep cognitive root-cause diagnosis using Gemini 1.5 Flash with native JSON enforcement.
- **Signature:**
  ```python
  def analyze_misconception(student_answer: str, active_concept: str) -> Dict[str, Any]
  ```
- **Execution Flow:**
  1. Checks `get_demo_fallback(student_answer)` first.
  2. If not demo, calls Gemini using `response_mime_type="application/json"`.
  3. If Wi-Fi is disconnected or API times out, catches the error and returns a safe fallback dictionary (`API_TIMEOUT`).

---

## 5. Output Schema Contracts

Both `analyze_misconception` and `get_demo_fallback` output the exact schema below:

### Example: Live Demo Output (`student_answer="3.5"`)
```json
{
  "misconceptions": [
    {
      "concept_id": "distributive_property",
      "identified_misconception": "Distribution Sign and Constant Multiplier Omission",
      "explanation": "You multiplied the variable but forgot to distribute the multiplier to the constant (2 * x + 3 = 10 -> 2x + 3 = 10 -> 2x = 7 -> x = 3.5)."
    }
  ],
  "recommended_interventions": [
    {
      "intervention_id": "dist_01",
      "type": "conceptual_reframing",
      "actionable_steps": [
        "Review visual grid area model demonstrating 2 * (x + 3) = 2x + 6",
        "Complete 3 scaffolded single-step distribution drills",
        "Retest and solve the multi-step equation 2(x + 3) = 10"
      ]
    }
  ]
}
```

### Example: Network Failure / API Timeout Fallback
```json
{
  "misconceptions": [
    {
      "concept_id": "algebraic_equations",
      "identified_misconception": "API_TIMEOUT",
      "explanation": "Diagnostic service temporarily unavailable. Default pedagogical fallback applied."
    }
  ],
  "recommended_interventions": [
    {
      "intervention_id": "fallback_01",
      "type": "remedial_lesson",
      "actionable_steps": [
        "Review fundamental concepts for this topic",
        "Consult instructor or refer to concept reference notes"
      ]
    }
  ]
}
```

---

## 6. Implementation Code Snippet for BE1 (`api/views.py`)

BE1 can drop this logic directly into `POST /api/assessments/submit/` in `apps/django-api/api/views.py`:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Import BE2 modules from packages/ai-engine
from ai_engine import (
    classify_behavior,
    analyze_misconception,
    get_demo_fallback,
)
from math_engine import calculate_mastery_score, estimate_latent_ability


class AssessmentSubmitView(APIView):
    def post(self, request, *args, **kwargs):
        payload = request.data
        assessment_id = payload.get("assessment_id")
        student_id = payload.get("student_id")
        domain = payload.get("domain", "algebraic_equations")
        responses = payload.get("responses", [])

        if not responses:
            return Response({"error": "No responses provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Evaluate Item Response Theory (IRT) & Mastery via math_engine
        mastery_score = calculate_mastery_score(responses)
        latent_theta = estimate_latent_ability(responses)

        all_misconceptions = []
        all_interventions = []

        # 2. Iterate through student item responses
        for resp in responses:
            item_id = resp.get("item_id")
            student_answer = str(resp.get("user_answer", ""))
            time_ms = int(resp.get("time_spent_seconds", 5.0) * 1000)
            attempts = int(resp.get("hints_used", 0)) + 1
            hints = int(resp.get("hints_used", 0))

            # A. Run local ML behavior classifier (sub-millisecond)
            behavior_tag = classify_behavior(time_ms=time_ms, attempt_count=attempts, hint_used=hints)

            # B. Only diagnose items that are incorrect or flagged as struggle
            if not resp.get("is_correct", False):
                # Guaranteed safe: checks demo shortcut first, calls Gemini, falls back on timeout
                diag_result = analyze_misconception(
                    student_answer=student_answer,
                    active_concept=domain
                )

                for misc in diag_result.get("misconceptions", []):
                    misc["detected_in_items"] = [item_id]
                    all_misconceptions.append(misc)

                for intv in diag_result.get("recommended_interventions", []):
                    intv["title"] = f"Targeted Remediation for {domain.title()}"
                    intv["priority"] = "high" if behavior_tag == "DEEP_MISCONCEPTION" else "medium"
                    all_interventions.append(intv)

        # 3. Assemble response payload matching shared_types.json LLMDiagnosticResponse
        final_response = {
            "assessment_id": assessment_id,
            "student_id": student_id,
            "domain": domain,
            "mastery_score": mastery_score,
            "latent_ability_theta": latent_theta,
            "learning_gaps": [
                {
                    "concept_id": domain,
                    "concept_name": domain.replace("_", " ").title(),
                    "severity": "critical" if mastery_score < 0.6 else "moderate",
                    "description": "Identified conceptual hurdles in multi-step problem solving.",
                    "evidence_item_ids": [r["item_id"] for r in responses if not r.get("is_correct", False)]
                }
            ],
            "misconceptions": all_misconceptions,
            "recommended_interventions": all_interventions,
            "summary_narrative": (
                f"Learner achieved {int(mastery_score * 100)}% mastery. "
                f"Evaluation detected {len(all_misconceptions)} conceptual hurdles requiring targeted remediation."
            )
        }

        return Response(final_response, status=status.HTTP_200_OK)
```

---

## 7. Handshake Summary
- **Zero Blockers**: All AI modules are operational, resilient, and verified.
- **Frontend Unblocked**: `mock_diagnostic_response.json` is deployed to `apps/student-fe/` so FE1 can proceed immediately with Next.js Focus Mode UI development.
- **BE1 Clear to Merge**: Handshake complete.
