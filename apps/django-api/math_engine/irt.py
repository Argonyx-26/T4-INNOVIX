"""
Item Response Theory (IRT) and Latent Ability Estimation Module.

Native Python implementation using psychometric statistical models (1PL / Rasch).
"""
import math
from typing import List, Dict, Any


def rasch_probability(theta: float, difficulty_b: float) -> float:
    """
    Computes 1PL (Rasch) probability of correct response:
    P(X = 1 | theta, b) = 1 / (1 + exp(-(theta - b)))
    """
    exponent = -(theta - difficulty_b)
    # Prevent overflow
    if exponent > 30.0:
        return 0.0
    if exponent < -30.0:
        return 1.0
    return 1.0 / (1.0 + math.exp(exponent))


def estimate_latent_ability(
    responses: List[Dict[str, Any]],
    default_difficulty: float = 0.0,
    iterations: int = 15,
    tolerance: float = 1e-4
) -> float:
    """
    Estimates the learner's latent ability theta using Maximum Likelihood / Newton-Raphson.
    Theta is standardized with mean ~0.0 and std ~1.0, bounded within [-3.0, +3.0].

    :param responses: List of dicts with 'is_correct' (bool) and optional 'difficulty' (float).
    :return: Estimated ability parameter theta.
    """
    if not responses:
        return 0.0

    valid_responses = [r for r in responses if r.get('is_correct') is not None]
    if not valid_responses:
        return 0.0

    n_correct = sum(1 for r in valid_responses if r['is_correct'])
    total = len(valid_responses)

    # Edge cases: perfect or zero score (boundary regularization)
    if n_correct == 0:
        return -2.5
    if n_correct == total:
        return 2.5

    # Initial theta guess from logit of proportion correct
    p = n_correct / total
    theta = math.log(p / (1.0 - p))

    # Newton-Raphson optimization
    for _ in range(iterations):
        first_derivative = 0.0
        second_derivative = 0.0

        for r in valid_responses:
            b = float(r.get('difficulty', default_difficulty))
            prob = rasch_probability(theta, b)
            y = 1.0 if r['is_correct'] else 0.0

            first_derivative += (y - prob)
            second_derivative -= prob * (1.0 - prob)

        if abs(second_derivative) < 1e-9:
            break

        delta = first_derivative / second_derivative
        theta = theta - delta

        if abs(delta) < tolerance:
            break

    # Clamp theta to standard psychometric range [-3.0, +3.0]
    return round(max(-3.0, min(3.0, theta)), 4)
