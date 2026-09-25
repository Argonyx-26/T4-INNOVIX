# LearnLens Backend - Educational Diagnostic Engine

Domain-agnostic educational diagnostic engine backend built with **Python 3, Django, Django REST Framework, Firebase Admin SDK, Scikit-learn, and OpenAI SDK**, targeted for deployment on **Render (Web Service)**.

---

## 🏛️ Isolated Modular Architecture

To isolate backend developers and prevent merge conflicts, the workspace enforces strict separation of concerns:

| Directory | Scope & Responsibility | Primary Owner |
|---|---|---|
| [`/core/`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/core/) | Django settings, WSGI/ASGI configuration, routing root, Firebase Admin SDK initialization & stub. | Lead Dev / DevOps |
| [`/api/`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/api/) | DRF views, serializers, endpoints, orchestrating the diagnostic pipeline. | Backend Dev A |
| [`/math_engine/`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/math_engine/) | Native Python psychometric statistical models (2PL IRT ability estimation $\theta$, SEM, Bayesian topic mastery). | Backend Dev B |
| [`/ai_engine/`](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/ai_engine/) | Native Python ML scripts (Scikit-learn behavioral clustering) and LLM prompt generation (OpenAI SDK structured output). | Backend Dev B |

---

## 📜 Shared Contract Specification

The exact schema contract governing developer integration is located at:
- [shared_types.json](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/shared_types.json)

It defines:
1. `assessment_submission_request`: Exact schema accepted by `POST /api/assessments/submit/`.
2. `llm_diagnostic_output_payload`: Exact JSON payload expected from the LLM prompt completion (`ai_engine`).
3. `assessment_submission_response`: Composite payload returned to client applications containing both statistical psychometrics and AI diagnostic insights.

---

## 🚀 Getting Started

### 1. Configure Environment
Copy [.env.example](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/.env.example) to `.env`:
```bash
cp .env.example .env
```

### 2. Run Database Migrations
```bash
python manage.py migrate
```

### 3. Run Test Suite
```bash
python manage.py test api
```

### 4. Start Local Development Server
```bash
python manage.py runserver 8000
```

- Health Check: `http://localhost:8000/health/`
- API Submit Endpoint: `http://localhost:8000/api/assessments/submit/`
- Live Contract Schema: `http://localhost:8000/api/assessments/contract/`

---

## 🌐 Render Deployment

- Configuration is specified in [render.yaml](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/render.yaml) and [Procfile](file:///c:/Users/raghu/OneDrive/Desktop/argonyx1/Procfile).
- Static files are served via `whitenoise`.
- Firebase Admin SDK operates in stub mode when credentials are not supplied, ensuring seamless zero-downtime boots.
