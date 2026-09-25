"""
Standard Python exception definitions for LearnLens AI Engine.
All exceptions derive from standard Python Exception and AIEngineError
so Backend Developer 1 (BE1) can catch them cleanly without crashing the server.
"""

class AIEngineError(Exception):
    """Base exception for all AI Engine errors."""
    pass


class ModelInferenceError(AIEngineError, RuntimeError):
    """Raised when the local statistical/ML model fails during loading or inference."""
    pass


class CognitiveDiagnosticError(AIEngineError, ValueError):
    """Raised when cognitive diagnostic analysis fails or LLM output violates schema."""
    pass


class OntologyGenerationError(AIEngineError, ValueError):
    """Raised when subject ontology generation fails or schema validation fails."""
    pass


class QuestionGenerationError(AIEngineError, ValueError):
    """Raised when verification question generation fails or schema validation fails."""
    pass
