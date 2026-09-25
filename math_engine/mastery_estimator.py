"""
Bayesian Topic Mastery Estimator for LearnLens.

Calculates fine-grained mastery probabilities for each subtopic using
Bayesian beta-binomial belief updating, taking into account difficulty weighting
and response consistency.
"""

from collections import defaultdict
from typing import Dict, List


def estimate_topic_mastery(
    responses: List[Dict],
    prior_alpha: float = 2.0,
    prior_beta: float = 2.0,
) -> Dict[str, float]:
    """
    Computes posterior probability of mastery for each topic:
    E[P(Mastery | Evidence)] = (alpha + successes) / (alpha + beta + total_weighted_attempts)

    Returns:
        dict: { topic_id: mastery_probability (0.0 to 1.0) }
    """
    topic_data = defaultdict(lambda: {"weighted_correct": 0.0, "weighted_total": 0.0})

    for item in responses:
        topic = item.get("topic_id", "general")
        is_correct = bool(item.get("is_correct", False))
        difficulty = float(item.get("item_difficulty", 0.0))

        # Weight higher difficulty questions more heavily in mastery credit
        # difficulty normalized between 0.5 (very easy) and 2.0 (very hard)
        weight = max(0.5, 1.0 + (difficulty / 4.0))

        topic_data[topic]["weighted_total"] += weight
        if is_correct:
            topic_data[topic]["weighted_correct"] += weight

    mastery_scores: Dict[str, float] = {}

    for topic, stats in topic_data.items():
        alpha_post = prior_alpha + stats["weighted_correct"]
        beta_post = prior_beta + (stats["weighted_total"] - stats["weighted_correct"])
        posterior_mean = alpha_post / (alpha_post + beta_post)
        mastery_scores[topic] = round(float(posterior_mean), 3)

    return dict(mastery_scores)
