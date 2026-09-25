"""
Ebbinghaus Forgetting Curve and Memory Retention Engine for LearnLens.

Calculates memory retention decay over elapsed time, adjusted for spaced repetition
and retrieval attempt count.
"""

import math
from datetime import datetime, timezone
from typing import Any, Union


def calculate_retention(
    last_seen: Any,
    attempts: int = 1,
    baseline_half_life_days: float = 7.0,
) -> float:
    """
    Computes expected memory retention R in [0.0, 1.0] using the Ebbinghaus decay model:
        R = exp(- delta_t / S) = 2^(- delta_t / half_life)

    Where:
        delta_t is time elapsed in days since last seen.
        half_life scales dynamically with prior review attempts:
            half_life = baseline_half_life_days * (1.0 + 0.5 * max(attempts - 1, 0))

    Parameters:
        last_seen (Any):
            - datetime object (timezone-aware or naive)
            - ISO-8601 string (e.g. '2026-09-20T10:00:00Z')
            - epoch timestamp (float/int > 1,000,000)
            - days elapsed directly (float/int <= 10,000)
            - None / 0 (assumes interaction just happened, delta_t = 0)
        attempts (int): Number of cumulative retrieval practice encounters (>= 1).
        baseline_half_life_days (float): Default half-life in days (default: 7.0 days).

    Returns:
        float: Retention probability between 0.0 and 1.0.
    """
    if last_seen is None or last_seen == 0:
        return 1.0

    delta_days = 0.0
    now = datetime.now(timezone.utc)

    # 1. Parse elapsed days based on type of last_seen
    if isinstance(last_seen, datetime):
        if last_seen.tzinfo is None:
            # Naive datetime assumed UTC
            dt_aware = last_seen.replace(tzinfo=timezone.utc)
        else:
            dt_aware = last_seen
        delta_seconds = (now - dt_aware).total_seconds()
        delta_days = max(0.0, delta_seconds / 86400.0)

    elif isinstance(last_seen, str):
        try:
            # Clean trailing Z for fromisoformat compatibility across python versions
            iso_str = last_seen.replace("Z", "+00:00")
            dt = datetime.fromisoformat(iso_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            delta_seconds = (now - dt).total_seconds()
            delta_days = max(0.0, delta_seconds / 86400.0)
        except Exception:
            # Fallback if unparseable
            delta_days = 0.0

    elif isinstance(last_seen, (int, float)):
        if last_seen > 1_000_000_000:
            # Epoch timestamp in seconds
            dt = datetime.fromtimestamp(last_seen, tz=timezone.utc)
            delta_seconds = (now - dt).total_seconds()
            delta_days = max(0.0, delta_seconds / 86400.0)
        elif last_seen > 1_000_000:
            # Epoch timestamp in milliseconds
            dt = datetime.fromtimestamp(last_seen / 1000.0, tz=timezone.utc)
            delta_seconds = (now - dt).total_seconds()
            delta_days = max(0.0, delta_seconds / 86400.0)
        else:
            # Direct representation of days elapsed
            delta_days = max(0.0, float(last_seen))

    # 2. Compute dynamic half-life based on spaced repetition attempts
    safe_attempts = max(1, int(attempts))
    half_life = baseline_half_life_days * (1.0 + (0.5 * (safe_attempts - 1)))
    half_life = max(0.1, half_life)

    # 3. Ebbinghaus exponential decay
    # R = 2^(- delta_days / half_life)
    retention = math.pow(2.0, -(delta_days / half_life))

    # Bound within [0.0, 1.0]
    retention = max(0.0, min(1.0, retention))
    return round(float(retention), 4)
