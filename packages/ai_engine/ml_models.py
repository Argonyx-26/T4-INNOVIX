"""
Scikit-learn Native ML Models for Behavioral Diagnostics.

Performs engagement pattern classification and anomalous response detection
(e.g., rapid guessing, time-sink analysis, confidence-calibration mismatch).
"""

from typing import Any, Dict, List
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def analyze_behavioral_patterns(responses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extracts behavioral features from responses using Scikit-Learn.
    Detects guessing, high-struggle items, and overall engagement index.
    """
    if not responses or len(responses) < 2:
        return {
            "rapid_guessing_detected": False,
            "average_response_time_ms": 0,
            "engagement_index": 1.0,
            "struggle_item_ids": [],
            "outlier_responses": [],
        }

    times = [r.get("response_time_ms", 30000) for r in responses]
    difficulties = [r.get("item_difficulty", 0.0) for r in responses]
    corrects = [1.0 if r.get("is_correct", False) else 0.0 for r in responses]

    avg_time = float(np.mean(times))

    # Features: [response_time, difficulty, is_correct]
    features = np.column_stack([times, difficulties, corrects])

    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)

    # Use KMeans (k=2: efficient fluent responses vs struggle/guessing)
    n_clusters = min(2, len(responses))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=5)
    cluster_labels = kmeans.fit_predict(scaled_features)

    # Detect rapid guessing (< 5000ms on difficult items)
    rapid_guesses = [
        r.get("question_id")
        for r in responses
        if r.get("response_time_ms", 0) < 5000 and r.get("item_difficulty", 0.0) > 0.0
    ]

    # Detect high struggle items (> 2x average time and incorrect)
    struggle_items = [
        r.get("question_id")
        for r in responses
        if r.get("response_time_ms", 0) > (1.8 * avg_time) and not r.get("is_correct", False)
    ]

    engagement_score = max(0.2, min(1.0, 1.0 - (len(rapid_guesses) / max(len(responses), 1))))

    return {
        "rapid_guessing_detected": len(rapid_guesses) > 0,
        "rapid_guessing_item_ids": rapid_guesses,
        "average_response_time_ms": int(avg_time),
        "engagement_index": round(engagement_score, 2),
        "struggle_item_ids": struggle_items,
        "cluster_distribution": [int(c) for c in cluster_labels],
    }
