"""
Bayesian Knowledge Tracing (BKT) and Memory Retention Engine for LearnLens.
Implements dynamic mastery probability updates and Ebbinghaus retention decay.
"""

import math
import time
from typing import Union


def calculate_new_mastery(
    prior_mastery: float,
    is_correct: bool,
    slip_rate: float = 0.1,
    guess_rate: float = 0.2,
    transition_rate: float = 0.1,
) -> float:
    """
    Standard Bayesian Knowledge Tracing (BKT) posterior probability formula.

    Equations:
    1. Posterior probability of mastery given observed response:
       - If is_correct is True:
         P(L|C) = [ P(L) * (1 - S) ] / [ P(L) * (1 - S) + (1 - P(L)) * G ]
       - If is_correct is False:
         P(L|I) = [ P(L) * S ] / [ P(L) * S + (1 - P(L)) * (1 - G) ]

    2. Knowledge acquisition transition step (Learning):
       P(L_{t+1}) = P(L|Obs) + (1 - P(L|Obs)) * T

    Parameters:
        prior_mastery (float): Prior mastery probability P(L_t) in [0.0, 1.0].
        is_correct (bool): Student correctness observation.
        slip_rate (float): Probability of slipping P(Incorrect | Known), default 0.1.
        guess_rate (float): Probability of guessing P(Correct | Unknown), default 0.2.
        transition_rate (float): Probability of learning transition P(T), default 0.1.

    Returns:
        float: Updated mastery score bounded in [0.0, 1.0].
    """
    p_l = max(0.0, min(1.0, float(prior_mastery)))
    s = max(0.001, min(0.999, float(slip_rate)))
    g = max(0.001, min(0.999, float(guess_rate)))
    t = max(0.0, min(1.0, float(transition_rate)))
    obs_correct = bool(is_correct)

    if obs_correct:
        numerator = p_l * (1.0 - s)
        denominator = numerator + ((1.0 - p_l) * g)
    else:
        numerator = p_l * s
        denominator = numerator + ((1.0 - p_l) * (1.0 - g))

    if denominator <= 0.0:
        p_posterior = p_l
    else:
        p_posterior = numerator / denominator

    # Learning transition update
    new_mastery = p_posterior + ((1.0 - p_posterior) * t)
    new_mastery = max(0.0, min(1.0, new_mastery))

    return round(float(new_mastery), 4)


def calculate_retention(
    last_seen_timestamp: float,
    current_timestamp: float,
    stability: float = 1.0,
) -> float:
    """
    Ebbinghaus Forgetting Curve formula:
        R = e^(-t / S)

    Where:
        t: Time elapsed in days = (current_timestamp - last_seen_timestamp) / 86400.0
        S: Memory stability factor in days (default 1.0 day).

    Parameters:
        last_seen_timestamp (float): Epoch timestamp (seconds) when concept was last practiced.
        current_timestamp (float): Current epoch timestamp (seconds).
        stability (float): Memory stability factor S (higher values decay slower).

    Returns:
        float: Estimated retention probability between 0.0 and 1.0.
    """
    if last_seen_timestamp is None:
        return 1.0

    curr = float(current_timestamp) if current_timestamp is not None else time.time()
    last = float(last_seen_timestamp)
    stab = max(0.001, float(stability) if stability is not None else 1.0)

    # Time elapsed in days
    t_days = max(0.0, (curr - last) / 86400.0)

    # R = exp(-t / S)
    retention = math.exp(-t_days / stab)
    retention = max(0.0, min(1.0, retention))

    return round(float(retention), 4)


# Backward-compatible alias for existing callers
calculate_bkt = calculate_new_mastery
