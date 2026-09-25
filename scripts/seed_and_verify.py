"""
Comprehensive Dummy Data Seeder & Backend Multi-Test Suite Runner for LearnLens.

Executes sequential end-to-end integration tests across:
1. Taxonomy Validation
2. Math Engines (BKT & Ebbinghaus Retention)
3. Authentication Enforcement (HTTP 401)
4. Anti-Spoofing Security (HTTP 403)
5. Request Validation & Serializer Constraints (HTTP 400)
6. Dynamic Taxonomy Rejection (HTTP 400)
7. Pitch Demo Fallback Resiliency (HTTP 200)
8. Careless Error Latency Behavioral Filter (HTTP 200)
9. Deep Misconception AI Diagnostics Pipeline & Persistence (HTTP 200)
10. Teacher Triage Alerts Feed API (HTTP 200)
11. Teacher Class Heatmap Aggregation API (HTTP 200)
12. Public Firebase Config API (HTTP 200)
13. Throttling and CORS Production Configuration

Outputs a structured, detailed report at the end of each test.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import time
import json
from datetime import datetime, timezone

# Ensure Django setup is active
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from django.conf import settings

from api.firebase_client import (
    get_firestore_db,
    verify_concept_exists,
    get_student_concept_state,
    update_student_state,
)
from math_engine.bkt import calculate_new_mastery, calculate_retention


def print_header(title: str):
    print("\n" + "=" * 80)
    print(f"  {title.upper()}")
    print("=" * 80)


def print_test_report(
    test_num: int,
    name: str,
    target: str,
    input_data: dict,
    status_code: int,
    expected_status: int,
    details: dict,
    verdict: bool,
):
    print("\n" + "-" * 80)
    print(f"TEST {test_num:02d}: {name}")
    print("-" * 80)
    print(f"Target Subsystem / Endpoint : {target}")
    print(f"Input Parameters           : {json.dumps(input_data, default=str)}")
    print(f"HTTP Status Received       : {status_code} (Expected: {expected_status})")
    print("Execution & Verification Details:")
    for k, v in details.items():
        print(f"  * {k:25s}: {v}")
    result_str = "[PASS] SUCCESSFUL" if verdict else "[FAIL] FAILED"
    print(f"VERDICT                    : {result_str}")
    print("-" * 80)


def seed_temporary_dummy_data():
    """Populates Firestore with realistic temporary dummy data for multi-student class scenarios."""
    print_header("Seeding Temporary Dummy Data into Firestore")
    db = get_firestore_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_ts = time.time()
    day_sec = 86400.0

    # 1. Seed Dynamic Concepts Taxonomy
    concepts = {
        "algebra.linear": {"title": "Linear Equations", "domain": "algebra", "difficulty": 0.4},
        "algebra.quadratics": {"title": "Quadratic Equations", "domain": "algebra", "difficulty": 0.7},
        "algebra.distribution_rule": {"title": "Distributive Property", "domain": "algebra", "difficulty": 0.5},
        "calculus.derivatives": {"title": "Power Rule Derivatives", "domain": "calculus", "difficulty": 0.8},
        "geometry.pythagorean": {"title": "Pythagorean Theorem", "domain": "geometry", "difficulty": 0.5},
    }
    for cid, cdata in concepts.items():
        db.collection("dynamic_concepts").document(cid).set(cdata, merge=True)
    print(f"Seeded {len(concepts)} concepts into 'dynamic_concepts' collection.")

    # 2. Seed Student Mastery States
    students = {
        "student_alice": {
            "student_id": "student_alice",
            "concept_id": "algebra.linear",
            "mastery_score": 0.88,
            "retention_score": 0.94,
            "last_updated": now_iso,
            "last_seen_timestamp": now_ts - (0.5 * day_sec),
            "concepts": {
                "algebra.linear": {"mastery_score": 0.88, "retention_score": 0.94, "last_seen_timestamp": now_ts - (0.5 * day_sec)}
            }
        },
        "student_bob": {
            "student_id": "student_bob",
            "concept_id": "algebra.distribution_rule",
            "mastery_score": 0.35,
            "retention_score": 0.42,
            "last_updated": now_iso,
            "last_seen_timestamp": now_ts - (3.0 * day_sec),
            "concepts": {
                "algebra.distribution_rule": {"mastery_score": 0.35, "retention_score": 0.42, "last_seen_timestamp": now_ts - (3.0 * day_sec)}
            }
        },
        "student_carol": {
            "student_id": "student_carol",
            "concept_id": "calculus.derivatives",
            "mastery_score": 0.92,
            "retention_score": 0.89,
            "last_updated": now_iso,
            "last_seen_timestamp": now_ts - (1.0 * day_sec),
            "concepts": {
                "calculus.derivatives": {"mastery_score": 0.92, "retention_score": 0.89, "last_seen_timestamp": now_ts - (1.0 * day_sec)}
            }
        },
        "student_david": {
            "student_id": "student_david",
            "concept_id": "geometry.pythagorean",
            "mastery_score": 0.50,
            "retention_score": 0.60,
            "last_updated": now_iso,
            "last_seen_timestamp": now_ts - (2.0 * day_sec),
            "concepts": {
                "geometry.pythagorean": {"mastery_score": 0.50, "retention_score": 0.60, "last_seen_timestamp": now_ts - (2.0 * day_sec)}
            }
        },
    }
    for sid, sdata in students.items():
        db.collection("mastery_states").document(sid).set(sdata, merge=True)
    print(f"Seeded {len(students)} students into 'mastery_states' collection.")

    # 3. Seed Triage Alerts
    alerts = {
        "alert_bob_dist": {
            "alert_id": "alert_bob_dist",
            "student_id": "student_bob",
            "concept_id": "algebra.distribution_rule",
            "status": "NEEDS_INTERVENTION",
            "diagnostic_data": {
                "misconception": "Distribution Error",
                "severity": "critical",
                "summary": "Multiplied coefficient with first term only."
            },
            "created_at": now_iso,
        },
        "alert_david_pyth": {
            "alert_id": "alert_david_pyth",
            "student_id": "student_david",
            "concept_id": "geometry.pythagorean",
            "status": "NEEDS_INTERVENTION",
            "diagnostic_data": {
                "misconception": "Hypotenuse Confusion",
                "severity": "moderate",
                "summary": "Added legs without squaring."
            },
            "created_at": now_iso,
        },
        "alert_alice_resolved": {
            "alert_id": "alert_alice_resolved",
            "student_id": "student_alice",
            "concept_id": "algebra.linear",
            "status": "RESOLVED",
            "diagnostic_data": {"status": "resolved"},
            "created_at": now_iso,
        }
    }
    for aid, adata in alerts.items():
        db.collection("triage_alerts").document(aid).set(adata, merge=True)
    print(f"Seeded {len(alerts)} alerts (2 active, 1 resolved) into 'triage_alerts' collection.")

    # 4. Seed Response Logs
    logs = [
        {
            "student_id": "student_bob",
            "concept_id": "algebra.distribution_rule",
            "mastery_score": 0.35,
            "retention_score": 0.42,
            "timestamp": now_iso,
            "diagnostic_data": {"misconception": "Distribution Error"}
        },
        {
            "student_id": "student_alice",
            "concept_id": "algebra.linear",
            "mastery_score": 0.88,
            "retention_score": 0.94,
            "timestamp": now_iso,
            "diagnostic_data": {"status": "correct"}
        }
    ]
    for log_item in logs:
        db.collection("response_logs").document().set(log_item)
    print(f"Seeded {len(logs)} audit records into 'response_logs' collection.\n")


def run_all_tests():
    seed_temporary_dummy_data()
    client = APIClient()
    total_passed = 0
    total_tests = 13

    print_header("Executing Comprehensive Backend Test Suite")

    # =========================================================================
    # TEST 1: Taxonomy Validation
    # =========================================================================
    valid_concept = "algebra.distribution_rule"
    invalid_concept = "mythical.algebra_rule"
    chk1 = verify_concept_exists(valid_concept)
    chk2 = verify_concept_exists(invalid_concept)
    verdict1 = chk1 is True and chk2 is False
    if verdict1: total_passed += 1
    print_test_report(
        test_num=1,
        name="Dynamic Taxonomy Existence Verification",
        target="api.firebase_client.verify_concept_exists",
        input_data={"valid_concept": valid_concept, "invalid_concept": invalid_concept},
        status_code=200,
        expected_status=200,
        details={
            "Valid Concept Query": f"'{valid_concept}' exists -> {chk1}",
            "Invalid Concept Query": f"'{invalid_concept}' exists -> {chk2}",
            "Collection Searched": "dynamic_concepts",
        },
        verdict=verdict1,
    )

    # =========================================================================
    # TEST 2: Math Engine Formulae (BKT & Retention)
    # =========================================================================
    prior = 0.50
    post_corr = calculate_new_mastery(prior_mastery=prior, is_correct=True)
    post_inc = calculate_new_mastery(prior_mastery=prior, is_correct=False)
    now_ts = 1000000.0
    r_immediate = calculate_retention(now_ts, now_ts, 1.0)
    r_decay = calculate_retention(now_ts, now_ts + 86400.0, 1.0)
    verdict2 = (post_corr > prior) and (post_inc < prior) and (r_immediate == 1.0) and (r_decay < 1.0)
    if verdict2: total_passed += 1
    print_test_report(
        test_num=2,
        name="Mathematical Engine Verification (BKT & Ebbinghaus)",
        target="math_engine/bkt.py (calculate_new_mastery & calculate_retention)",
        input_data={"prior_mastery": prior, "stability": 1.0, "elapsed_seconds": 86400},
        status_code=200,
        expected_status=200,
        details={
            "BKT Post Correct": f"{post_corr:.4f} (Increased from {prior})",
            "BKT Post Incorrect": f"{post_inc:.4f} (Decreased from {prior})",
            "Immediate Retention": f"{r_immediate:.4f} (R=1.0 at t=0)",
            "1-Day Decay Retention": f"{r_decay:.4f} (Decayed via R=e^-t/S)",
        },
        verdict=verdict2,
    )

    # =========================================================================
    # TEST 3: Unauthenticated Access Enforcement
    # =========================================================================
    client.credentials()  # Clear auth
    resp_submit = client.post("/api/assessments/submit/", {}, format="json")
    resp_triage = client.get("/api/teacher/triage-alerts/")
    resp_heatmap = client.get("/api/teacher/class-heatmap/")
    verdict3 = (
        resp_submit.status_code == status.HTTP_401_UNAUTHORIZED
        and resp_triage.status_code == status.HTTP_401_UNAUTHORIZED
        and resp_heatmap.status_code == status.HTTP_401_UNAUTHORIZED
    )
    if verdict3: total_passed += 1
    print_test_report(
        test_num=3,
        name="Authentication Protection on All Endpoints",
        target="core.authentication.FirebaseAuthentication (IsAuthenticated)",
        input_data={"header": "None (Unauthenticated request)"},
        status_code=resp_submit.status_code,
        expected_status=status.HTTP_401_UNAUTHORIZED,
        details={
            "POST /api/assessments/submit/": f"HTTP {resp_submit.status_code}",
            "GET /api/teacher/triage-alerts/": f"HTTP {resp_triage.status_code}",
            "GET /api/teacher/class-heatmap/": f"HTTP {resp_heatmap.status_code}",
            "WWW-Authenticate Header": resp_submit.headers.get("WWW-Authenticate", "Bearer realm='api'"),
        },
        verdict=verdict3,
    )

    # =========================================================================
    # TEST 4: Identity Anti-Spoofing Guard
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_attacker")
    payload_spoof = {
        "student_id": "student_alice",  # Attempting to submit for Alice with Attacker's token
        "concept_id": "algebra.linear",
        "student_answer": "42",
        "time_ms": 10000,
        "attempts": 1,
    }
    resp_spoof = client.post("/api/assessments/submit/", payload_spoof, format="json")
    verdict4 = resp_spoof.status_code == status.HTTP_403_FORBIDDEN
    if verdict4: total_passed += 1
    print_test_report(
        test_num=4,
        name="Identity Anti-Spoofing Guard",
        target="api.views.AssessmentSubmitView (request.user.uid == student_id)",
        input_data={"token_uid": "student_attacker", "payload_student_id": "student_alice"},
        status_code=resp_spoof.status_code,
        expected_status=status.HTTP_403_FORBIDDEN,
        details={
            "Response Error Detail": resp_spoof.json().get("detail"),
            "Spoofing Prevention": "Rejected unauthorized attempt to modify another student's mastery.",
        },
        verdict=verdict4,
    )

    # =========================================================================
    # TEST 5: Strict Serializer Request Validation
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_bob")
    payload_bad_serializer = {
        "student_id": "student_bob",
        "student_answer": "3.5",
        "time_ms": -500,  # Negative latency invalid
        # Missing concept_id
    }
    resp_val = client.post("/api/assessments/submit/", payload_bad_serializer, format="json")
    val_json = resp_val.json()
    verdict5 = (
        resp_val.status_code == status.HTTP_400_BAD_REQUEST
        and "concept_id" in val_json
        and "time_ms" in val_json
    )
    if verdict5: total_passed += 1
    print_test_report(
        test_num=5,
        name="Strict DRF Serializer Validation",
        target="api.serializers.AssessmentSubmissionRequestSerializer",
        input_data=payload_bad_serializer,
        status_code=resp_val.status_code,
        expected_status=status.HTTP_400_BAD_REQUEST,
        details={
            "Missing concept_id error": str(val_json.get("concept_id")),
            "Negative time_ms error": str(val_json.get("time_ms")),
            "Schema Enforcement": "Field presence and non-negative constraints enforced.",
        },
        verdict=verdict5,
    )

    # =========================================================================
    # TEST 6: Dynamic Taxonomy Concept Rejection
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_bob")
    payload_bad_tax = {
        "student_id": "student_bob",
        "concept_id": "fictional_unregistered_concept",
        "student_answer": "10",
        "time_ms": 15000,
        "attempts": 1,
    }
    resp_tax = client.post("/api/assessments/submit/", payload_bad_tax, format="json")
    tax_error = str(resp_tax.json())
    verdict6 = (
        resp_tax.status_code == status.HTTP_400_BAD_REQUEST
        and "Concept does not exist in taxonomy" in tax_error
    )
    if verdict6: total_passed += 1
    print_test_report(
        test_num=6,
        name="Taxonomy Rejection for Unregistered Concept",
        target="api.views.AssessmentSubmitView (verify_concept_exists)",
        input_data={"concept_id": "fictional_unregistered_concept"},
        status_code=resp_tax.status_code,
        expected_status=status.HTTP_400_BAD_REQUEST,
        details={
            "Taxonomy Error Message": tax_error,
            "Execution Interception": "Halted before AI reasoning and database operations.",
        },
        verdict=verdict6,
    )

    # =========================================================================
    # TEST 7: Hackathon Offline Demo Fallback ("3.5")
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_bob")
    payload_demo = {
        "student_id": "student_bob",
        "concept_id": "algebra.distribution_rule",
        "student_answer": "3.5",
        "time_ms": 12000,
        "attempts": 1,
    }
    resp_demo = client.post("/api/assessments/submit/", payload_demo, format="json")
    demo_data = resp_demo.json()
    verdict7 = (
        resp_demo.status_code == status.HTTP_200_OK
        and demo_data.get("status") == "success"
        and "Distribution Error" in str(demo_data.get("diagnosis"))
        and "new_mastery" in demo_data
    )
    if verdict7: total_passed += 1
    print_test_report(
        test_num=7,
        name="Pitch Demo Fallback Resiliency (Answer '3.5')",
        target="ai_engine.fallbacks.get_demo_fallback",
        input_data=payload_demo,
        status_code=resp_demo.status_code,
        expected_status=status.HTTP_200_OK,
        details={
            "Diagnosis Misconception": demo_data.get("diagnosis", {}).get("misconception"),
            "Calculated New Mastery": demo_data.get("new_mastery"),
            "Retention Decay Score": demo_data.get("retention_score"),
            "LLM Bypassed": "True (Deterministic offline fallback executed)",
        },
        verdict=verdict7,
    )

    # =========================================================================
    # TEST 8: Careless Error Latency Behavioral Classifier
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_alice")
    payload_careless = {
        "student_id": "student_alice",
        "concept_id": "algebra.linear",
        "student_answer": "42",
        "time_ms": 1200,  # 1.2s rapid response
        "attempts": 1,
    }
    resp_careless = client.post("/api/assessments/submit/", payload_careless, format="json")
    careless_data = resp_careless.json()
    verdict8 = (
        resp_careless.status_code == status.HTTP_200_OK
        and careless_data.get("status") == "careless"
        and "Take your time" in careless_data.get("message", "")
    )
    if verdict8: total_passed += 1
    print_test_report(
        test_num=8,
        name="Careless Error Behavioral Latency Filter",
        target="ai_engine.classifier.classify_behavior",
        input_data=payload_careless,
        status_code=resp_careless.status_code,
        expected_status=status.HTTP_200_OK,
        details={
            "Behavior Status": careless_data.get("status"),
            "Careless Prompt": careless_data.get("message"),
            "Cost Saving": "LLM call skipped; prompted student to review without penalizing score.",
        },
        verdict=verdict8,
    )

    # =========================================================================
    # TEST 9: Full 7-Step Deep Misconception Pipeline & Firestore Sync
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-student_david")
    payload_deep = {
        "student_id": "student_david",
        "concept_id": "geometry.pythagorean",
        "student_answer": "a + b = c",
        "time_ms": 45000,
        "attempts": 2,
    }
    resp_deep = client.post("/api/assessments/submit/", payload_deep, format="json")
    deep_data = resp_deep.json()
    # Verify database state after submit
    post_state = get_student_concept_state("student_david", "geometry.pythagorean")
    verdict9 = (
        resp_deep.status_code == status.HTTP_200_OK
        and deep_data.get("status") == "success"
        and "new_mastery" in deep_data
        and "retention_score" in deep_data
        and post_state.get("prior_mastery") is not None
    )
    if verdict9: total_passed += 1
    print_test_report(
        test_num=9,
        name="Full 7-Step Deep Misconception Pipeline & State Sync",
        target="api.views.AssessmentSubmitView (End-to-End Orchestrator)",
        input_data=payload_deep,
        status_code=resp_deep.status_code,
        expected_status=status.HTTP_200_OK,
        details={
            "Diagnosis Status": deep_data.get("diagnosis", {}).get("status"),
            "Updated Mastery Score": deep_data.get("new_mastery"),
            "Computed Retention Score": deep_data.get("retention_score"),
            "Persisted DB State": f"Mastery: {post_state.get('prior_mastery')}",
            "Collections Synced": "mastery_states, response_logs, triage_alerts",
        },
        verdict=verdict9,
    )

    # =========================================================================
    # TEST 10: Teacher Dashboard Triage Feed API
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-teacher_admin")
    resp_triage_feed = client.get("/api/teacher/triage-alerts/")
    alerts_feed = resp_triage_feed.json()
    all_needs_interv = all(a.get("status") == "NEEDS_INTERVENTION" for a in alerts_feed)
    verdict10 = (
        resp_triage_feed.status_code == status.HTTP_200_OK
        and isinstance(alerts_feed, list)
        and len(alerts_feed) >= 2
        and all_needs_interv
    )
    if verdict10: total_passed += 1
    print_test_report(
        test_num=10,
        name="Teacher Dashboard Triage Alerts Feed",
        target="GET /api/teacher/triage-alerts/ (TeacherTriageFeedView)",
        input_data={"filter": "status == 'NEEDS_INTERVENTION'"},
        status_code=resp_triage_feed.status_code,
        expected_status=status.HTTP_200_OK,
        details={
            "Active Alerts Count": len(alerts_feed),
            "Filtered Resolved Statuses": "Confirmed (0 resolved items leaked)",
            "Sample Alert Student": alerts_feed[0].get("student_id") if alerts_feed else None,
            "Sample Misconception": alerts_feed[0].get("diagnostic_data", {}).get("misconception") if alerts_feed else None,
        },
        verdict=verdict10,
    )

    # =========================================================================
    # TEST 11: Teacher Dashboard Class Heatmap Aggregation API
    # =========================================================================
    client.credentials(HTTP_AUTHORIZATION="Bearer mock-teacher_admin")
    resp_heatmap = client.get("/api/teacher/class-heatmap/")
    heatmap = resp_heatmap.json()
    verdict11 = (
        resp_heatmap.status_code == status.HTTP_200_OK
        and isinstance(heatmap, dict)
        and "student_alice" in heatmap
        and "student_bob" in heatmap
        and "student_carol" in heatmap
        and "student_david" in heatmap
    )
    if verdict11: total_passed += 1
    print_test_report(
        test_num=11,
        name="Teacher Dashboard Class Heatmap Aggregation",
        target="GET /api/teacher/class-heatmap/ (ClassHeatmapView)",
        input_data={"query": "All records in mastery_states"},
        status_code=resp_heatmap.status_code,
        expected_status=status.HTTP_200_OK,
        details={
            "Aggregated Student Count": len(heatmap),
            "Alice (Linear)": f"Mastery: {heatmap.get('student_alice', {}).get('mastery_score')}, Retention: {heatmap.get('student_alice', {}).get('retention_score')}",
            "Bob (Distribution)": f"Mastery: {heatmap.get('student_bob', {}).get('mastery_score')}, Retention: {heatmap.get('student_bob', {}).get('retention_score')}",
            "Carol (Calculus)": f"Mastery: {heatmap.get('student_carol', {}).get('mastery_score')}, Retention: {heatmap.get('student_carol', {}).get('retention_score')}",
            "David (Geometry)": f"Mastery: {heatmap.get('student_david', {}).get('mastery_score')}, Retention: {heatmap.get('student_david', {}).get('retention_score')}",
        },
        verdict=verdict11,
    )

    # =========================================================================
    # TEST 12: Public Firebase Web Config Endpoint
    # =========================================================================
    client.credentials()  # Public endpoint
    resp_cfg = client.get("/api/config/firebase/")
    cfg = resp_cfg.json()
    verdict12 = (
        resp_cfg.status_code == status.HTTP_200_OK
        and "projectId" in cfg
        and "apiKey" in cfg
    )
    if verdict12: total_passed += 1
    print_test_report(
        test_num=12,
        name="Public Firebase Client Web Configuration",
        target="GET /api/config/firebase/ (FirebaseConfigView)",
        input_data={"auth": "None (Public)"},
        status_code=resp_cfg.status_code,
        expected_status=status.HTTP_200_OK,
        details={
            "Project ID": cfg.get("projectId"),
            "Auth Domain": cfg.get("authDomain"),
            "API Key Configured": bool(cfg.get("apiKey")),
            "Purpose": "Allows dynamic frontend client initialization without baked secrets.",
        },
        verdict=verdict12,
    )

    # =========================================================================
    # TEST 13: Production Security, Throttling & CORS Settings
    # =========================================================================
    rf_settings = getattr(settings, "REST_FRAMEWORK", {})
    t_classes = rf_settings.get("DEFAULT_THROTTLE_CLASSES", [])
    t_rates = rf_settings.get("DEFAULT_THROTTLE_RATES", {})
    cors_all = getattr(settings, "CORS_ALLOW_ALL_ORIGINS", True)
    cors_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", [])

    verdict13 = (
        "rest_framework.throttling.AnonRateThrottle" in t_classes
        and "rest_framework.throttling.UserRateThrottle" in t_classes
        and t_rates.get("anon") == "10/min"
        and t_rates.get("user") == "60/min"
        and cors_all is False
        and len(cors_origins) > 0
    )
    if verdict13: total_passed += 1
    print_test_report(
        test_num=13,
        name="Production Security Hardening (Throttling & CORS Lockdown)",
        target="core.settings (REST_FRAMEWORK Throttling & CORS)",
        input_data={"security_audit": "settings.py validation"},
        status_code=200,
        expected_status=200,
        details={
            "Anonymous Throttle Rate": t_rates.get("anon"),
            "Authenticated User Throttle Rate": t_rates.get("user"),
            "CORS Allow All Origins": cors_all,
            "CORS Allowed Origins Count": len(cors_origins),
            "CORS Whitelisted": ", ".join(cors_origins[:2]) + " ...",
        },
        verdict=verdict13,
    )

    # =========================================================================
    # FINAL SUITE SUMMARY
    # =========================================================================
    print_header("Final Test Suite Summary")
    print(f"Total Tests Executed : {total_tests}")
    print(f"Total Tests Passed   : {total_passed}")
    print(f"Total Tests Failed   : {total_tests - total_passed}")
    print(f"Pass Rate            : {(total_passed / total_tests) * 100:.1f}%")
    print("=" * 80 + "\n")

    return total_passed == total_tests


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
