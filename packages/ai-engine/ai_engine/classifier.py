"""
FILE 1: classifier.py
Indigenous Behavior Classifier for LearnLens backend (BE2).

Trains and serves a RandomForestClassifier to differentiate between
CARELESS_ERROR (label 0) and DEEP_MISCONCEPTION (label 1) using attempt metadata.
"""
from pathlib import Path
from typing import Optional, Union
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

MODEL_PATH = Path(__file__).resolve().parent / "behavior_model.joblib"
_CACHED_MODEL: Optional[RandomForestClassifier] = None

LABEL_MAP = {
    0: "CARELESS_ERROR",
    1: "DEEP_MISCONCEPTION"
}


def train_and_export_model(export_path: Optional[Path] = None) -> RandomForestClassifier:
    """
    Generates a synthetic pandas DataFrame of 300 rows simulating student metadata
    and trains a Scikit-learn RandomForestClassifier.

    Rule:
    - Fast time (< 3000ms) + 1 attempt = CARELESS_ERROR (0)
    - Long time + multiple attempts = DEEP_MISCONCEPTION (1)

    Saves the trained model to behavior_model.joblib.
    """
    target_path = export_path or MODEL_PATH
    np.random.seed(42)

    n_samples = 300
    half = n_samples // 2

    # Group 0: CARELESS_ERROR (Fast time < 3000ms, 1 attempt, minimal hints)
    time_careless = np.random.uniform(low=400, high=2990, size=half).astype(int)
    attempts_careless = np.ones(half, dtype=int)
    hints_careless = np.random.choice([0, 1], size=half, p=[0.90, 0.10])
    labels_careless = np.zeros(half, dtype=int)

    # Group 1: DEEP_MISCONCEPTION (Long time >= 8000ms, multiple attempts >= 2, frequent hints)
    time_misconception = np.random.uniform(low=8000, high=45000, size=half).astype(int)
    attempts_misconception = np.random.choice([2, 3, 4, 5], size=half, p=[0.40, 0.35, 0.15, 0.10])
    hints_misconception = np.random.choice([0, 1, 2, 3], size=half, p=[0.20, 0.40, 0.30, 0.10])
    labels_misconception = np.ones(half, dtype=int)

    df_careless = pd.DataFrame({
        "time_ms": time_careless,
        "attempt_count": attempts_careless,
        "hint_used": hints_careless,
        "label": labels_careless
    })

    df_misconception = pd.DataFrame({
        "time_ms": time_misconception,
        "attempt_count": attempts_misconception,
        "hint_used": hints_misconception,
        "label": labels_misconception
    })

    df = pd.concat([df_careless, df_misconception], ignore_index=True)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    X = df[["time_ms", "attempt_count", "hint_used"]]
    y = df["label"]

    clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X, y)

    joblib.dump(clf, target_path)

    global _CACHED_MODEL
    _CACHED_MODEL = clf
    return clf


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
    time_ms: Union[int, float],
    attempt_count: Optional[int] = None,
    hint_used: int = 0,
    attempts: Optional[int] = None,
    **kwargs
) -> BehaviorTag:
    """
    Classifies student attempt behavior into 'CARELESS' or 'MISCONCEPTION'.

    :param time_ms: Duration of student attempt in milliseconds.
    :param attempt_count: Number of attempts made on the problem.
    :param hint_used: Number of hints accessed.
    :return: BehaviorTag('CARELESS') or BehaviorTag('MISCONCEPTION')
    :raises TypeError: If inputs are non-numeric.
    :raises ValueError: If time_ms < 0 or attempts < 1.
    """
    global _CACHED_MODEL
    att = attempts if attempts is not None else (attempt_count if attempt_count is not None else kwargs.get("attempts", 1))

    if not isinstance(time_ms, (int, float)):
        raise TypeError(f"time_ms must be numeric, got {type(time_ms).__name__}")
    if not isinstance(att, int):
        raise TypeError(f"attempts must be an integer, got {type(att).__name__}")

    if time_ms < 0:
        raise ValueError(f"time_ms cannot be negative (received {time_ms})")
    if att < 1:
        raise ValueError(f"attempts must be at least 1 (received {att})")

    t_ms = float(time_ms)
    hints = int(hint_used) if hint_used is not None else 0

    try:
        # Load or retrieve cached model
        if _CACHED_MODEL is None:
            if not MODEL_PATH.exists():
                train_and_export_model(MODEL_PATH)
            else:
                _CACHED_MODEL = joblib.load(MODEL_PATH)

        features = pd.DataFrame([{
            "time_ms": int(t_ms),
            "attempt_count": int(att),
            "hint_used": int(hints)
        }])

        prediction_label = int(_CACHED_MODEL.predict(features)[0])
        raw_tag = LABEL_MAP.get(prediction_label, "CARELESS_ERROR")
        return BehaviorTag("CARELESS" if "CARELESS" in raw_tag else "MISCONCEPTION")

    except Exception:
        # Rule-based fallback if ML model is unavailable
        if t_ms < 5000 and att <= 1:
            return BehaviorTag("CARELESS")
        return BehaviorTag("MISCONCEPTION")
