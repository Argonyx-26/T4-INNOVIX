"""
AI Engine for LearnLens (BE2).
Contains indigenous behavior classification models and external LLM diagnostic pipelines.
Provides pure Python functions with standard exception handling for BE1 integration.
"""
# Hackathon Core AI Engine (Gemini & Scikit-learn Stack)
from .classifier import classify_behavior, train_and_export_model
from .diagnostics import analyze_misconception
from .generators import (
    generate_concept_graph,
    generate_intervention,
    generate_verification_question,
)
from .fallbacks import get_demo_fallback
from .prompts import (
    DIAGNOSTIC_PROMPT,
    ONTOLOGY_PROMPT,
    INTERVENTION_PROMPT,
    VERIFICATION_PROMPT,
)

# Shared Assessment Diagnostic Pipeline
from .diagnostic import synthesize_diagnostic_report
from .exceptions import (
    AIEngineError,
    ModelInferenceError,
    CognitiveDiagnosticError,
    OntologyGenerationError,
    QuestionGenerationError,
)

__all__ = [
    # Hackathon BE2 Functions
    "classify_behavior",
    "train_and_export_model",
    "analyze_misconception",
    "generate_concept_graph",
    "generate_intervention",
    "generate_verification_question",
    "get_demo_fallback",
    "DIAGNOSTIC_PROMPT",
    "ONTOLOGY_PROMPT",
    "INTERVENTION_PROMPT",
    "VERIFICATION_PROMPT",
    # Diagnostic Pipeline & Exceptions
    "synthesize_diagnostic_report",
    "AIEngineError",
    "ModelInferenceError",
    "CognitiveDiagnosticError",
    "OntologyGenerationError",
    "QuestionGenerationError",
]
