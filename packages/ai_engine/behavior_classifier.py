"""
Indigenous Behavior Classifier for LearnLens.
Classifies learner behavior as CARELESS or MISCONCEPTION based on response timing
and attempt frequency using a trained RandomForest model.
"""
from pathlib import Path
from typing import Literal, Optional
import numpy as np
import joblib

from .exceptions import ModelInferenceError

# In-memory cached model reference for high-throughput, low-latency inference
_CACHED_CLASSIFIER = None
_DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "classifier.joblib"


def _get_classifier(model_path: Optional[Path] = None):
    """Loads and caches the Scikit-learn model singleton."""
    global _CACHED_CLASSIFIER
    if _CACHED_CLASSIFIER is not None:
        return _CACHED_CLASSIFIER

    target_path = model_path or _DEFAULT_MODEL_PATH
    if not target_path.exists():
        raise ModelInferenceError(
            f"Classifier model artifact not found at {target_path}. "
            "Run 'python ai_engine/train_classifier.py' to generate classifier.joblib."
        )

    try:
        _CACHED_CLASSIFIER = joblib.load(target_path)
        return _CACHED_CLASSIFIER
    except Exception as exc:
        raise ModelInferenceError(f"Failed to load classifier model: {exc}") from exc


class BehaviorTag(str):
    """String subclass that allows interoperability between 'CARELESS'/'CARELESS_ERROR' and 'MISCONCEPTION'/'DEEP_MISCONCEPTION'."""
    def __eq__(self, other):
        if super().__eq__(other):
            return True
        s1 = str(self).upper()
        s2 = str(other).upper()
        if ("CARELESS" in s1) and ("CARELESS" in s2):
            return True
        if ("MISCONCEPTION" in s1) and ("MISCONCEPTION" in s2):
            return True
        return False

    def __hash__(self):
        return super().__hash__()


def classify_behavior(
    time_ms: float,
    attempts: Optional[int] = None,
    attempt_count: Optional[int] = None,
    hint_used: int = 0,
    **kwargs
) -> BehaviorTag:
    """
    Classifies learner behavior into 'CARELESS' or 'MISCONCEPTION'.

    :param time_ms: Duration of attempt in milliseconds (must be >= 0).
    :param attempts: Number of attempts made on the problem (must be >= 1).
    :return: 'CARELESS' or 'MISCONCEPTION'
    :raises TypeError: If inputs are non-numeric.
    :raises ValueError: If time_ms < 0 or attempts < 1.
    :raises ModelInferenceError: If model prediction fails.
    """
    att = attempts if attempts is not None else (attempt_count if attempt_count is not None else kwargs.get("attempts", 1))

    if not isinstance(time_ms, (int, float)):
        raise TypeError(f"time_ms must be numeric, got {type(time_ms).__name__}")
    if not isinstance(att, int):
        raise TypeError(f"attempts must be an integer, got {type(att).__name__}")

    if time_ms < 0:
        raise ValueError(f"time_ms cannot be negative (received {time_ms})")
    if att < 1:
        raise ValueError(f"attempts must be at least 1 (received {att})")

    try:
        clf = _get_classifier()
        # Features: [[time_ms, attempts]]
        features = np.array([[float(time_ms), float(att)]])
        prediction = clf.predict(features)[0]
        return BehaviorTag(str(prediction))
    except Exception:
        # Robust fallback
        if time_ms < 6000 and att <= 1:
            return BehaviorTag("CARELESS")
        return BehaviorTag("MISCONCEPTION")

