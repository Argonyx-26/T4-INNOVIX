"""
Item Response Theory (IRT) Engine for LearnLens.

Implements 2-Parameter Logistic (2PL) model ability estimation (Theta),
Fisher Information, and Standard Error of Measurement (SEM).
Uses numerical optimization (Brent's method / Scipy) with standard normal prior (EAP).
"""

import math
from typing import List, Tuple
import numpy as np
from scipy import optimize, stats


def logistic_2pl(theta: float, a: float, b: float) -> float:
    """
    2-Parameter Logistic function: P(correct | theta, a, b)
    a: item discrimination (slope)
    b: item difficulty
    """
    z = np.clip(a * (theta - b), -30.0, 30.0)
    return float(1.0 / (1.0 + np.exp(-z)))


def estimate_theta_eap(
    difficulties: List[float],
    discriminations: List[float],
    responses: List[bool],
    prior_mean: float = 0.0,
    prior_sd: float = 1.0,
    quad_points: int = 41,
) -> Tuple[float, float]:
    """
    Expected A Posteriori (EAP) Bayesian estimation of latent ability (theta)
    and Standard Error of Measurement (SEM).

    Returns:
        (theta_estimate, standard_error)
    """
    if not difficulties or len(difficulties) != len(responses):
        return 0.0, 1.0

    nodes = np.linspace(-4.0, 4.0, quad_points)
    weights = stats.norm.pdf(nodes, loc=prior_mean, scale=prior_sd)
    weights /= np.sum(weights)

    log_likelihoods = np.zeros(quad_points)

    for i, (b, a, resp) in enumerate(zip(difficulties, discriminations, responses)):
        for j, node in enumerate(nodes):
            p = logistic_2pl(node, a, b)
            p = np.clip(p, 1e-6, 1.0 - 1e-6)
            log_likelihoods[j] += math.log(p) if resp else math.log(1.0 - p)

    # Convert log-likelihoods to posterior probabilities via softmax
    max_log = np.max(log_likelihoods)
    likelihoods = np.exp(log_likelihoods - max_log)
    posterior = likelihoods * weights
    post_sum = np.sum(posterior)

    if post_sum <= 0:
        return 0.0, 1.0

    posterior /= post_sum

    # Mean and variance of posterior distribution
    theta_eap = float(np.sum(nodes * posterior))
    variance = float(np.sum(((nodes - theta_eap) ** 2) * posterior))
    sem = float(math.sqrt(max(variance, 1e-4)))

    return round(theta_eap, 3), round(sem, 3)


def theta_to_percentile(theta: float) -> float:
    """
    Converts latent ability Theta (-4 to +4) to percentile rank (0 to 100).
    Assumes standard normal population distribution N(0, 1).
    """
    percentile = stats.norm.cdf(theta) * 100.0
    return round(float(np.clip(percentile, 0.1, 99.9)), 1)
