# LearnLens: Backend Developer 1 (BE1) - Master Architecture & Agent Context Guide

**Role:** Lead API Architect & Data Engineer (BE1)
**Stack:** Python 3, Django, Django REST Framework (DRF), Firebase Admin SDK
**Project:** LearnLens (15-Hour Hackathon)

---

## 1. The "Big Picture": What We Are Building
LearnLens is a domain-agnostic educational diagnostic engine. Instead of just marking a student's answer as "wrong," it uses AI to diagnose the exact cognitive misconception (e.g., "Forgot to distribute the negative sign") and delivers a micro-intervention to fix it. 

### Your Role (BE1) vs. BE2
In this architecture, **BE1 is the deterministic anchor**, and **BE2 is the probabilistic reasoning engine**.
*   **BE2 (AI Engine):** Builds the Gemini AI prompts and Scikit-learn behavior classifiers. BE2 determines *what* the student did wrong.
*   **BE1 (You):** Builds the API routing, the mathematical scoring models, and the database synchronization. You determine *how* that diagnosis is securely routed, mathematically scored, and saved to the database.

**Why this decoupled architecture?** 
If we let an LLM (BE2) update database scores directly, it might hallucinate a mastery score of "150%". By keeping the AI isolated, your deterministic mathematical engines (BKT) ensure perfect data integrity. Furthermore, this separation guarantees zero Git merge conflicts.

---

## 2. The Assessment Workflow (How BE1 and BE2 Connect)
Every time a student submits an answer, your API (`api/views.py`) acts as the orchestrator. You execute this exact 7-step flow:

1.  **Validate & Authenticate (BE1):** Check the Firebase bearer token and ensure the payload is structurally valid via DRF Serializers.
2.  **Fetch History (BE1):** Read the student's past mastery score and timestamp from Firestore.
3.  **Check Offline Fallback (BE2):** Call `get_demo_fallback()`. If the student entered the demo string `"3.5"`, instantly intercept it to guarantee the live hackathon pitch works even if the Wi-Fi drops.
4.  **Behavior Filter (BE2):** Call `classify_behavior()`. If the student answered in 2 seconds, the local ML model flags it as a "CARELESS_ERROR". You abort the AI call and tell the student to try again, saving API costs.
5.  **AI Diagnosis (BE2):** Call `analyze_misconception()`. The Gemini LLM analyzes the math and returns a strict JSON diagnosis.
6.  **Mathematical Update (BE1):** Pass the result through your Bayesian Knowledge Tracing (BKT) and Ebbinghaus Retention formulas to compute their new mathematical probability of mastery.
7.  **Database Sync (BE1):** Write the new score and diagnosis to Firebase Firestore, which instantly triggers a WebSocket update on the Teacher's React frontend.

---

## 3. Implementation Status & Phase Breakdown

The backend development is split into three phases. According to the latest system audit, **Phases 1 and 2 are fully built and verified.** Your current objective is to execute Phase 3.

### ✅ PHASE 1: Foundation & Core Orchestration (COMPLETED)
*   **What was built:** The base Django setup, the BKT/Retention math engines in pure Python, the offline fallback interception, and the core 7-step API router in `AssessmentSubmitView.post()`.
*   **Why we built it:** To prove that BE1 and BE2 could communicate and that data could flow from an HTTP request, through the AI, into a mathematical formula, and out as a JSON response.

### ✅ PHASE 2: Integration, Hardening & Security (COMPLETED)
*   **What was built:** Firestore Read-Before-Write logic (fetching past mastery before updating), strict DRF Serializer validation, Firebase ID Token authentication middleware, and Identity Anti-Spoofing guards.
*   **Why we built it:** The initial API was blindly trusting client data. Phase 2 ensured that malformed data throws a clean HTTP 400, and unauthenticated/malicious users cannot overwrite other students' mastery states (HTTP 401/403).

### 🚀 PHASE 3: Finalization, Taxonomy & Dashboard APIs (PENDING - CURRENT TASK)
This is your active mission. You must build the final pieces to unblock the Teacher Dashboard frontend and secure the system for production deployment.
*   **What needs to be built:**
    1.  **Taxonomy Validation:** When a student submits an assessment for a `concept_id`, you must query the `dynamic_concepts` Firestore collection first. If the concept doesn't exist, block the request (HTTP 400). *Why? To prevent database pollution with fake/invalid concepts.*
    2.  **Teacher Dashboard Read APIs:** Build two new authenticated `GET` endpoints: `/api/teacher/triage-alerts/` (returns all active student alerts) and `/api/teacher/class-heatmap/` (returns aggregated class mastery scores). *Why? The frontend needs these to render the initial UI state when a teacher logs in.*
    3.  **Production Security Hardening:** Add DRF Throttling (Rate Limiting) and lock down `CORS_ALLOWED_ORIGINS`. *Why? Because Gemini API calls cost money. A malicious script could spam our open endpoint and exhaust the hackathon budget in 5 minutes.*

---

## 4. Key Mathematical & Database Concepts (For AI Agent Context)

To assist BE1 effectively, the AI agent must understand the underlying formulas and database structures:

*   **Bayesian Knowledge Tracing (BKT):** A Hidden Markov Model used to estimate the probability that a student knows a concept. It uses four parameters: Prior Knowledge, Slip Rate (knowing it but making a mistake), Guess Rate (not knowing it but guessing correctly), and Transition Rate (learning the concept during the task).
*   **Ebbinghaus Retention Decay:** A mathematical formula ($R = e^{-t/S}$) representing how human memory fades over time ($t$). We use this to schedule verification questions just as the student is about to forget the concept.
*   **Firestore Data Strategy:** 
    *   `mastery_states`: A single document per student containing nested maps of their concept mastery scores. We use `merge=True` to update one concept without overwriting others.
    *   `response_logs`: An append-only historical audit trail of every answer ever submitted.
    *   `triage_alerts`: A targeted collection. When the AI diagnoses a misconception, we write an alert here. The Teacher Frontend has an `onSnapshot` listener attached to this collection, so the UI updates instantly.

---

## 5. System Directives for the AI Assistant
When assisting BE1, strictly adhere to these rules:
1.  **Boundary Enforcement:** Do NOT generate, modify, or suggest changes to files inside `/ai_engine/`. That is BE2's domain.
2.  **Tech Stack Loyalty:** Write all API logic using Django REST Framework (DRF). Use standard DRF Views, Serializers, and Permissions. Do not introduce FastAPI, Flask, or async/await architectures at this stage.
3.  **Error Handling:** All Firebase Admin SDK calls must be wrapped in `try/except` blocks. If Firestore times out, log the error to `stderr` but allow the HTTP response to return the calculated math to the client safely.
4.  **No Boilerplate Destruction:** When providing solutions for Phase 3, do not delete or rewrite the existing, verified Phase 1 and Phase 2 code. Provide additive changes or targeted replacements.