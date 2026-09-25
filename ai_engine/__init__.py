"""
LearnLens AI Engine.
Native Python module for LLM prompt orchestration (OpenAI SDK),
cognitive diagnostic reasoning, and Scikit-learn behavioral analysis.
"""

from .diagnostic_agent import generate_diagnostic_report
from .ml_models import analyze_behavioral_patterns

__all__ = ["generate_diagnostic_report", "analyze_behavioral_patterns"]
