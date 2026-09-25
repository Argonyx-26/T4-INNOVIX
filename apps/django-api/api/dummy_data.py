"""
Temporary Dummy Data Suite for LearnLens Backend Testing and Verification.

Contains realistic student assessment submission payloads across multiple
learning profiles (Careless slip, Deep misconception, Mastered learner,
Pitch demo scenario, and Multi-domain).
"""
import uuid
from typing import Dict, Any, List


DUMMY_STUDENT_CARELESS_SLIP: Dict[str, Any] = {
    "assessment_id": "11111111-1111-4111-8111-111111111111",
    "student_id": "student_careless_001",
    "domain": "algebraic_equations",
    "timestamp": "2026-09-25T10:00:00Z",
    "responses": [
        {
            "item_id": "alg_item_01",
            "user_answer": "x = 5",
            "is_correct": True,
            "time_spent_seconds": 2.1,
            "hints_used": 0,
            "confidence_level": "high"
        },
        {
            "item_id": "alg_item_02",
            "user_answer": "3.5",
            "is_correct": False,
            "time_spent_seconds": 1.8,
            "hints_used": 0,
            "confidence_level": "high"
        }
    ],
    "metadata": {
        "profile": "fast_paced_careless_slip",
        "grade_level": "Grade 9"
    }
}


DUMMY_STUDENT_DEEP_MISCONCEPTION: Dict[str, Any] = {
    "assessment_id": "22222222-2222-4222-8222-222222222222",
    "student_id": "student_misconception_002",
    "domain": "algebraic_equations",
    "timestamp": "2026-09-25T10:05:00Z",
    "responses": [
        {
            "item_id": "alg_item_10",
            "user_answer": "x = 1",
            "is_correct": False,
            "time_spent_seconds": 38.4,
            "hints_used": 2,
            "confidence_level": "low"
        },
        {
            "item_id": "alg_item_11",
            "user_answer": "x = -7",
            "is_correct": False,
            "time_spent_seconds": 45.0,
            "hints_used": 3,
            "confidence_level": "low"
        },
        {
            "item_id": "alg_item_12",
            "user_answer": "x = 4",
            "is_correct": True,
            "time_spent_seconds": 22.0,
            "hints_used": 1,
            "confidence_level": "medium"
        }
    ],
    "metadata": {
        "profile": "struggling_deep_misconception",
        "grade_level": "Grade 9"
    }
}


DUMMY_STUDENT_MASTERED: Dict[str, Any] = {
    "assessment_id": "33333333-3333-4333-8333-333333333333",
    "student_id": "student_mastery_003",
    "domain": "algebraic_equations",
    "timestamp": "2026-09-25T10:10:00Z",
    "responses": [
        {
            "item_id": "alg_item_20",
            "user_answer": "x = 4",
            "is_correct": True,
            "time_spent_seconds": 8.0,
            "hints_used": 0,
            "confidence_level": "high"
        },
        {
            "item_id": "alg_item_21",
            "user_answer": "x = -3",
            "is_correct": True,
            "time_spent_seconds": 10.5,
            "hints_used": 0,
            "confidence_level": "high"
        },
        {
            "item_id": "alg_item_22",
            "user_answer": "x = 12",
            "is_correct": True,
            "time_spent_seconds": 9.2,
            "hints_used": 0,
            "confidence_level": "high"
        }
    ],
    "metadata": {
        "profile": "high_achiever_mastered",
        "grade_level": "Grade 9"
    }
}


DUMMY_STUDENT_BIOLOGY_DOMAIN: Dict[str, Any] = {
    "assessment_id": "44444444-4444-4444-8444-444444444444",
    "student_id": "student_bio_004",
    "domain": "cellular_biology",
    "timestamp": "2026-09-25T10:15:00Z",
    "responses": [
        {
            "item_id": "bio_item_01",
            "user_answer": "Mitochondria generates ATP through oxidative phosphorylation",
            "is_correct": True,
            "time_spent_seconds": 15.0,
            "hints_used": 0,
            "confidence_level": "high"
        },
        {
            "item_id": "bio_item_02",
            "user_answer": "Active transport moves molecules down their concentration gradient without energy",
            "is_correct": False,
            "time_spent_seconds": 28.0,
            "hints_used": 1,
            "confidence_level": "medium"
        }
    ],
    "metadata": {
        "profile": "cross_domain_biology",
        "grade_level": "Grade 11"
    }
}


DUMMY_PITCH_DEMO: Dict[str, Any] = {
    "assessment_id": "55555555-5555-4555-8555-555555555555",
    "student_id": "student_hackathon_pitch",
    "domain": "algebraic_equations",
    "timestamp": "2026-09-25T10:20:00Z",
    "responses": [
        {
            "item_id": "demo_item_distribution",
            "user_answer": "3.5",
            "is_correct": False,
            "time_spent_seconds": 2.5,
            "hints_used": 0,
            "confidence_level": "high"
        }
    ],
    "metadata": {
        "profile": "live_pitch_demo_3.5_shortcut",
        "target_equation": "2(x + 3) = 10"
    }
}


ALL_DUMMY_SUBMISSIONS: Dict[str, Dict[str, Any]] = {
    "careless_slip": DUMMY_STUDENT_CARELESS_SLIP,
    "deep_misconception": DUMMY_STUDENT_DEEP_MISCONCEPTION,
    "mastered": DUMMY_STUDENT_MASTERED,
    "cellular_biology": DUMMY_STUDENT_BIOLOGY_DOMAIN,
    "pitch_demo": DUMMY_PITCH_DEMO,
}


def get_dummy_submission(key: str) -> Dict[str, Any]:
    """Retrieve dummy submission by profile key."""
    if key not in ALL_DUMMY_SUBMISSIONS:
        raise KeyError(f"Unknown dummy submission key: {key}. Available: {list(ALL_DUMMY_SUBMISSIONS.keys())}")
    return ALL_DUMMY_SUBMISSIONS[key]


def get_all_dummy_submissions() -> Dict[str, Dict[str, Any]]:
    """Return dictionary of all available dummy test submissions."""
    return ALL_DUMMY_SUBMISSIONS
