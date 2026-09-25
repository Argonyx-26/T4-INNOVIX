"""
Master Backend Test Runner & Verification Suite for LearnLens.

Executes all backend test suites across:
1. Django REST API & Contract Validation (apps/django-api/api/tests.py)
2. Math Engine IRT & Psychometrics (apps/django-api/math_engine/test_math.py)
3. AI Engine Phase 1 Diagnostics (packages/ai-engine/ai_engine/test_engine.py)
4. AI Engine Phase 2/3 Hackathon Pipelines (packages/ai-engine/ai_engine/test_hackathon_engine.py)
5. Live Dummy Data Payload Processing (5 distinct learner personas)

Generates a unified test execution report.
"""
import os
import io
import sys
import time
import json
import unittest
from pathlib import Path

# Setup paths for monorepo imports
ROOT_DIR = Path(__file__).resolve().parent
DJANGO_API_DIR = ROOT_DIR / "apps" / "django-api"
AI_ENGINE_DIR = ROOT_DIR / "packages" / "ai-engine"

for p in [str(DJANGO_API_DIR), str(AI_ENGINE_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Configure Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django
django.setup()

from django.test.utils import get_runner
from django.conf import settings
from rest_framework.test import APIClient
from api.dummy_data import ALL_DUMMY_SUBMISSIONS


def run_django_suite() -> dict:
    """Run Django API test suite using Django's DiscoverRunner."""
    start_time = time.time()
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=0, interactive=False)
    
    # Run test suite
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
    
    try:
        failures = test_runner.run_tests(["api.tests"])
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
    elapsed = time.time() - start_time
    
    # Load test details from test case
    from api import tests as api_tests
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(api_tests)
    test_details = _extract_tests_recursive(suite)
    for t in test_details:
        t["status"] = "PASS" if failures == 0 else "CHECK"
    
    return {
        "suite_name": "1. Django API & Contract Suite",
        "total_tests": len(test_details),
        "passed": len(test_details) - failures,
        "failed": failures,
        "errors": 0,
        "elapsed_seconds": round(elapsed, 4),
        "details": test_details,
        "success": failures == 0
    }


def _extract_tests_recursive(suite_obj):
    tests = []
    try:
        for item in suite_obj:
            if isinstance(item, unittest.TestSuite):
                tests.extend(_extract_tests_recursive(item))
            elif hasattr(item, "id"):
                test_id = item.id().split(".")[-1]
                doc = item.shortDescription() or test_id
                tests.append({"name": test_id, "description": doc, "status": "PASS"})
    except Exception:
        pass
    return tests


def run_unit_suite(suite_name: str, test_module) -> dict:
    """Run a standard unittest test case module and collect results."""
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(test_module)
    test_details = _extract_tests_recursive(suite)
    
    start_time = time.time()
    stream = io.StringIO()
    runner = unittest.TextTestRunner(stream=stream, verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    # Check for failures or errors
    for failure in result.failures:
        test_id = failure[0].id().split(".")[-1]
        for t in test_details:
            if t["name"] == test_id:
                t["status"] = "FAIL"
                t["error"] = failure[1]

    for error in result.errors:
        test_id = error[0].id().split(".")[-1]
        for t in test_details:
            if t["name"] == test_id:
                t["status"] = "ERROR"
                t["error"] = error[1]

    return {
        "suite_name": suite_name,
        "total_tests": result.testsRun,
        "passed": result.testsRun - len(result.failures) - len(result.errors),
        "failed": len(result.failures),
        "errors": len(result.errors),
        "elapsed_seconds": round(elapsed, 4),
        "details": test_details,
        "success": result.wasSuccessful()
    }


def run_dummy_data_e2e() -> dict:
    """Execute end-to-end API tests against all temporary dummy data profiles."""
    client = APIClient()
    results = []
    all_passed = True
    start_total = time.time()

    for profile_name, payload in ALL_DUMMY_SUBMISSIONS.items():
        t0 = time.time()
        response = client.post('/api/assessments/submit/', data=payload, format='json')
        t_elapsed = (time.time() - t0) * 1000 # ms
        
        status_ok = response.status_code == 200
        data = response.json() if status_ok else {}

        # Basic contract check
        has_required = all(
            k in data for k in [
                "assessment_id", "student_id", "domain",
                "mastery_score", "latent_ability_theta",
                "learning_gaps", "misconceptions",
                "recommended_interventions", "summary_narrative"
            ]
        )

        test_passed = status_ok and has_required
        if not test_passed:
            all_passed = False

        results.append({
            "profile": profile_name,
            "student_id": payload["student_id"],
            "domain": payload["domain"],
            "status_code": response.status_code,
            "latency_ms": round(t_elapsed, 2),
            "mastery_score": data.get("mastery_score"),
            "latent_theta": data.get("latent_ability_theta"),
            "misconceptions_count": len(data.get("misconceptions", [])),
            "interventions_count": len(data.get("recommended_interventions", [])),
            "passed": test_passed
        })

    return {
        "total_profiles": len(ALL_DUMMY_SUBMISSIONS),
        "passed": sum(1 for r in results if r["passed"]),
        "failed": sum(1 for r in results if not r["passed"]),
        "elapsed_seconds": round(time.time() - start_total, 4),
        "success": all_passed,
        "profiles": results
    }


def main():
    print("=" * 80)
    print("         LEARNLENS BACKEND - MASTER TEST RUNNER & HEALTH VERIFICATION")
    print("=" * 80)
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python: {sys.version.split()[0]} | Workspace: {ROOT_DIR}\n")

    suite_reports = []
    overall_passed = True

    # 1. Django API & Contract Suite
    print("[*] Running 1. Django API & Contract Suite...")
    django_report = run_django_suite()
    suite_reports.append(django_report)
    django_tag = "[PASS]" if django_report["success"] else "[FAIL]"
    print(f"    -> {django_tag} {django_report['passed']}/{django_report['total_tests']} tests passed in {django_report['elapsed_seconds']}s")
    if not django_report["success"]:
        overall_passed = False

    # 2. Math Engine Suite
    from math_engine import test_math
    print("[*] Running 2. Math Engine (IRT & Mastery) Suite...")
    math_report = run_unit_suite("2. Math Engine (IRT & Mastery) Suite", test_math)
    suite_reports.append(math_report)
    math_tag = "[PASS]" if math_report["success"] else "[FAIL]"
    print(f"    -> {math_tag} {math_report['passed']}/{math_report['total_tests']} tests passed in {math_report['elapsed_seconds']}s")
    if not math_report["success"]:
        overall_passed = False

    # 3. AI Engine Phase 1 Suite
    from ai_engine import test_engine
    print("[*] Running 3. AI Engine Phase 1 Test Suite...")
    ai_p1_report = run_unit_suite("3. AI Engine Phase 1 Test Suite", test_engine)
    suite_reports.append(ai_p1_report)
    ai_p1_tag = "[PASS]" if ai_p1_report["success"] else "[FAIL]"
    print(f"    -> {ai_p1_tag} {ai_p1_report['passed']}/{ai_p1_report['total_tests']} tests passed in {ai_p1_report['elapsed_seconds']}s")
    if not ai_p1_report["success"]:
        overall_passed = False

    # 4. AI Engine Phase 2/3 Granular Suite
    from ai_engine import test_hackathon_engine
    print("[*] Running 4. AI Engine Phase 2/3 Granular Suite...")
    ai_p2_report = run_unit_suite("4. AI Engine Phase 2/3 Granular Suite", test_hackathon_engine)
    suite_reports.append(ai_p2_report)
    ai_p2_tag = "[PASS]" if ai_p2_report["success"] else "[FAIL]"
    print(f"    -> {ai_p2_tag} {ai_p2_report['passed']}/{ai_p2_report['total_tests']} tests passed in {ai_p2_report['elapsed_seconds']}s")
    if not ai_p2_report["success"]:
        overall_passed = False

    # 5. Dummy Data E2E Ingestion Test
    print("\n[*] Running 5. Temporary Dummy Data E2E Ingestion Test...")
    dummy_report = run_dummy_data_e2e()
    dummy_tag = "[PASS]" if dummy_report["success"] else "[FAIL]"
    print(f"    -> {dummy_tag} {dummy_report['passed']}/{dummy_report['total_profiles']} profiles processed in {dummy_report['elapsed_seconds']}s")
    if not dummy_report["success"]:
        overall_passed = False

    total_tests_count = sum(r["total_tests"] for r in suite_reports) + dummy_report["total_profiles"]
    total_passed_count = sum(r["passed"] for r in suite_reports) + dummy_report["passed"]
    total_failed_count = sum(r["failed"] + r["errors"] for r in suite_reports) + dummy_report["failed"]

    # Save detailed JSON summary
    summary_data = {
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "overall_status": "PASS" if overall_passed else "FAIL",
        "total_tests": total_tests_count,
        "total_passed": total_passed_count,
        "total_failed": total_failed_count,
        "suites": suite_reports,
        "dummy_data_e2e": dummy_report
    }

    report_path = ROOT_DIR / "backend_test_report.json"
    with open(report_path, "w") as f:
        json.dump(summary_data, f, indent=2)

    print("\n" + "=" * 80)
    print("                           FINAL VERIFICATION SUMMARY")
    print("=" * 80)
    print(f"Total Tests Executed : {total_tests_count}")
    print(f"Total Passed         : {total_passed_count}")
    print(f"Total Failed         : {total_failed_count}")
    print(f"Overall Result       : {'ALL TESTS PASSED [100% OK]' if overall_passed else 'FAILURES DETECTED'}")
    print(f"Detailed Report Path : {report_path}")
    print("=" * 80)

    # Print granular breakdown
    print("\nGranular Test Breakdown:")
    for report in suite_reports:
        print(f"\n--- {report['suite_name']} ({report['passed']}/{report['total_tests']} passed) ---")
        for t in report["details"]:
            print(f"  [{t['status']}] {t['name']}: {t['description']}")

    print("\n--- Dummy Data E2E Ingestion Breakdown ---")
    for p in dummy_report["profiles"]:
        print(f"  [{'PASS' if p['passed'] else 'FAIL'}] Profile: {p['profile']:<20} | Mastery: {p['mastery_score']} | Theta: {p['latent_theta']:>5} | Misconceptions: {p['misconceptions_count']} | Latency: {p['latency_ms']}ms")

    return 0 if overall_passed else 1


if __name__ == "__main__":
    sys.exit(main())
