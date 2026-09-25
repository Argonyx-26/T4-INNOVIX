# LearnLens - System Audit 1
**Timestamp:** 2026-09-25T13:46:23+05:30  
**Project Phase:** Backend AI & Core Logic Completion / Pre-Integration  

---

## 1. Monorepo Integrity & File Structure

A physical filesystem audit of root directory `c:\argonyx2` was conducted against the target monorepo architecture:

| Target Monorepo Path | Current Workspace Location | Status | Boundary & Isolation Notes |
| :--- | :--- | :--- | :--- |
| `apps/student-fe/` (FE1) | *Not Found* | **MISSING** | Directory has not been scaffolded. |
| `apps/teacher-fe/` (FE2) | *Not Found* | **MISSING** | Directory has not been scaffolded. |
| `apps/django-api/` (BE1) | Root `/core/`, `/api/`, `/math_engine/` | **STRUCTURAL MISALIGNMENT** | Implemented as flat root directories rather than nested under `apps/django-api/`. |
| `packages/ai-engine/` (BE2) | Root `/ai_engine/` | **STRUCTURAL MISALIGNMENT** | Implemented as flat root directory rather than isolated package under `packages/ai-engine/`. |
| `shared_types.json` | Root `/shared_types.json` | **VERIFIED** | Present in root workspace directory. |

### Boundary Audit & Code Leakage Analysis:
- **BE2 Isolation (`/ai_engine/`):** Pure Python modules maintain strict isolation. No Django imports (`django.*`), HTTP views, serializer classes, or database ORM models are present within `/ai_engine/`.
- **BE1 Isolation (`/api/`, `/core/`, `/math_engine/`):** Django routing and controllers are contained within `/api/` and `/core/`. However, `/api/views.py` currently invokes high-level assessment synthesis without utilizing the new granular Gemini micro-pipelines (`classifier.py`, `diagnostics.py`, `generators.py`).
- **Monorepo Structure:** All code currently resides in a single flat Python project rather than a formal multi-package monorepo workspace (e.g., Turborepo / pnpm workspace / Poetry multi-package layout).

---

## 2. Backend & AI Engine Status (BE1 & BE2)

### AI Engine (`/ai_engine/` - BE2)

| Component | Status | Verification & Evidence |
| :--- | :--- | :--- |
| **Gemini API Integration** (`response_mime_type="application/json"`) | **[IMPLEMENTED]** | `diagnostics.py` and `generators.py` configure `genai.GenerativeModel("gemini-1.5-flash")` with explicit `generation_config={"response_mime_type": "application/json"}`. |
| **Scikit-learn Behavior Classifier** (`.joblib` generation & inference) | **[IMPLEMENTED]** | `classifier.py` contains `train_and_export_model()` (trained on 300 rows) and `classify_behavior(time_ms, attempt_count, hint_used) -> str`, generating and caching `behavior_model.joblib`. |
| **Generators (Ontology, Intervention, Verification Question)** | **[IMPLEMENTED]** | `generators.py` provides `generate_concept_graph()`, `generate_intervention()`, and `generate_verification_question()`, complete with prompt templates and offline fallback schemas. |
| **Demo Fallback Matcher** ("3.5" math error) | **[IMPLEMENTED]** | `fallbacks.py` defines `get_demo_fallback(student_answer)` that intercepts `"3.5"` (from equation $2(x+3)=10$) and returns the hardcoded distribution sign error payload. Integrated as Step 1 inside `analyze_misconception()`. |

### API & Math Engine (`/api/`, `/math_engine/`, `/core/` - BE1)

| Component | Status | Verification & Evidence |
| :--- | :--- | :--- |
| **`POST /api/assessments/submit/` Routing Logic** | **[IMPLEMENTED]** | DRF endpoint wired in `api/urls.py` and handled by `AssessmentSubmitView` in `api/views.py` with `AssessmentSubmissionSerializer`. |
| **Bayesian Knowledge Tracing (BKT) & Ebbinghaus Decay** | **[MISSING]** | `math_engine/` only contains 1PL Rasch Item Response Theory (`irt.py`) and weighted heuristic mastery calculation (`scoring.py`). Probabilistic $P(L_t)$ BKT transitions and exponential memory retention $R = e^{-t/S}$ are completely unwritten. |
| **Firebase Admin SDK & Firestore Write (`update_student_state`)** | **[PARTIAL]** | `core/firebase.py` initializes Firebase Admin SDK with fallback stub mode (`FirebaseStubAuth`), but Firestore client persistence and the `update_student_state()` persistence helper are not implemented. |
| **Error Handling (Try/Except Blocks)** | **[IMPLEMENTED]** | Complete try/except guards implemented across all Gemini calls and inference steps in `/ai_engine/` returning structured fallback dictionaries on timeout or missing credentials. |

---

## 3. Frontend Scaffolding Status (FE1 & FE2)

### Student Experience (`FE1` - `apps/student-fe/`)

| Feature | Status | Gap Analysis |
| :--- | :--- | :--- |
| **Adaptive Quiz UI (Focus Mode)** | **[MISSING]** | No Next.js application, React component, or CSS module exists in the repository. |
| **Web Speech API / OCR Input Handlers** | **[MISSING]** | Audio capture, speech-to-text recognition hooks, and client-side canvas/image OCR ingestion pipelines are absent. |
| **Diagnostic Modal UI Component** | **[MISSING]** | Component to render real-time cognitive misconceptions and pedagogical interventions is absent. |

### Teacher Dashboard (`FE2` - `apps/teacher-fe/`)

| Feature | Status | Gap Analysis |
| :--- | :--- | :--- |
| **Kanban Board Grid UI** | **[MISSING]** | UI layout displaying triage columns (e.g., Critical Interventions, Careless Slips, Mastered) is absent. |
| **Firebase `onSnapshot` Real-time Triage Sync** | **[MISSING]** | React hooks listening to Firestore collection `/triage_alerts` are unwritten due to missing frontend codebase. |

---

## 4. API Contract & Integration Readiness

### 1. `api/views.py` Import Verification
- **Current State:** `api/views.py` only imports `synthesize_diagnostic_report` from `ai_engine`.
- **Integration Gap:** `api/views.py` does **not** yet import or call:
  - `classify_behavior` from `ai_engine.classifier`
  - `analyze_misconception` from `ai_engine.diagnostics`
  - `get_demo_fallback` from `ai_engine.fallbacks`
  - `generate_intervention` / `generate_verification_question` from `ai_engine.generators`
- **Result:** The newly built BE2 granular modules are operational in isolation, but are not yet plugged into the HTTP request/response pipeline in BE1.

### 2. Contract Schema Discrepancy (`shared_types.json` vs Gemini Outputs)
A schema impedance mismatch exists between the holistic assessment contract and the atomic diagnostic functions:

| Data Property | `shared_types.json` Contract (`LLMDiagnosticResponse`) | Gemini API Output (`diagnostics.py`) | Compatibility Status |
| :--- | :--- | :--- | :--- |
| **Misconception Key** | `misconceptions`: Array of objects (`concept_id`, `identified_misconception`, `explanation`, `detected_in_items`) | `diagnosed_misconception`: String | **MISMATCH**: Flattened string vs. normalized relational array. |
| **Confidence Score** | `mastery_score` (0.0 - 1.0) & `latent_ability_theta` (-3.0 to +3.0) | `confidence_score`: Float (0.0 - 1.0) | **MISMATCH**: Item-level confidence vs. student-level latent ability. |
| **Intervention Key** | `recommended_interventions`: Array of objects (`intervention_id`, `title`, `type`, `priority`, `actionable_steps`) | `recommended_intervention_type`: String (e.g. `'dist_01'`) | **MISMATCH**: String code vs. full intervention specification. |
| **Prerequisite Key** | Nested under `learning_gaps[].concept_id` | `prerequisite_gap`: String | **MISMATCH**: Scalar field vs. list of gap objects. |

### 3. Verdict
**Verdict:** **NOT READY FOR PRODUCTION MERGE; READY FOR INTEGRATION ADAPTER IMPLEMENTATION.**  
BE2 has delivered all requested standalone Python modules, models, and fallbacks. However, BE1 must write an adapter function within `api/views.py` that maps the atomic output of `analyze_misconception` and `classify_behavior` into the multi-item response schema demanded by `shared_types.json` and the frontend.

---

## 5. Critical Blockers & Immediate Action Items (Next 60 Minutes)

1. **BE1 $\leftrightarrow$ BE2 Pipeline Wiring & Schema Adaptation:**
   - Update `api/views.py` (`POST /api/assessments/submit/`) to iterate student item responses, call `classify_behavior(time_ms, attempt_count, hint_used)`, invoke `analyze_misconception(student_answer, active_concept)`, and map the resulting dictionary into the format defined by `shared_types.json`.
   - Wire `get_demo_fallback()` directly into the view pipeline to ensure the "3.5" hackathon pitch demo executes synchronously with zero latency.

2. **Implement Missing Math Engine Functions (BKT & Ebbinghaus) & Firestore State Sync:**
   - Implement `math_engine/bkt.py` with standard four-parameter Bayesian Knowledge Tracing ($P(L_0), P(T), P(S), P(G)$) to update student mastery probabilities after each attempt.
   - Implement `math_engine/ebbinghaus.py` computing forgetting curve decay $R = e^{-\Delta t / S}$.
   - Add `core/firestore_sync.py` implementing `update_student_state(student_id, state_payload)` to write diagnostic alerts to Firestore for FE2's triage dashboard.

3. **Monorepo Restructuring & Frontend Inception:**
   - Initialize Next.js projects for `apps/student-fe` and `apps/teacher-fe` or establish proxy directories to unblock FE1 and FE2 development.
   - Supply FE1 with a static mock JSON response conforming to `shared_types.json` so UI development can proceed decoupled from backend deployment.
