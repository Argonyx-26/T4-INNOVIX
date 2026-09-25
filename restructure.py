"""
restructure.py
Monorepo Restructuring Script for LearnLens (Team Innovix).

Reorganizes the flat root workspace into an isolated multi-package monorepo:
- apps/student-fe/   (FE1: Next.js Student Adaptive Learning UI)
- apps/teacher-fe/   (FE2: Next.js Teacher Dashboard & Triage Kanban)
- apps/django-api/   (BE1: Django REST Framework, core settings, math_engine)
- packages/ai-engine/ (BE2: Local ML classifier & Gemini generative pipelines)
"""
import os
import shutil
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

# Target monorepo directories
STUDENT_FE_DIR = ROOT_DIR / "apps" / "student-fe"
TEACHER_FE_DIR = ROOT_DIR / "apps" / "teacher-fe"
DJANGO_API_DIR = ROOT_DIR / "apps" / "django-api"
AI_ENGINE_PKG_DIR = ROOT_DIR / "packages" / "ai-engine"

DJANGO_ITEMS_TO_MOVE = [
    "core",
    "api",
    "math_engine",
    "manage.py",
    "db.sqlite3",
    "Procfile",
    "render.yaml",
]

AI_ITEMS_TO_MOVE = [
    "ai_engine",
]


def create_monorepo_directories():
    """Step 1: Create target monorepo directory layout."""
    print("=== Step 1: Creating Monorepo Directories ===")
    for directory in [STUDENT_FE_DIR, TEACHER_FE_DIR, DJANGO_API_DIR, AI_ENGINE_PKG_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"  [CREATED] {directory.relative_to(ROOT_DIR)}")


def move_django_backend_items():
    """Step 2: Move Django backend components into apps/django-api."""
    print("\n=== Step 2: Moving Django Backend to apps/django-api ===")
    for item_name in DJANGO_ITEMS_TO_MOVE:
        src = ROOT_DIR / item_name
        dest = DJANGO_API_DIR / item_name
        if src.exists():
            if dest.exists():
                if dest.is_dir():
                    shutil.rmtree(dest)
                else:
                    dest.unlink()
            shutil.move(str(src), str(dest))
            print(f"  [MOVED] {item_name} -> apps/django-api/{item_name}")
        else:
            print(f"  [SKIPPED] {item_name} (not found in root)")


def move_ai_engine_package():
    """Step 3: Move AI engine components into packages/ai-engine."""
    print("\n=== Step 3: Moving AI Engine to packages/ai-engine ===")
    for item_name in AI_ITEMS_TO_MOVE:
        src = ROOT_DIR / item_name
        dest = AI_ENGINE_PKG_DIR / item_name
        if src.exists():
            if dest.exists():
                if dest.is_dir():
                    shutil.rmtree(dest)
                else:
                    dest.unlink()
            shutil.move(str(src), str(dest))
            print(f"  [MOVED] {item_name} -> packages/ai-engine/{item_name}")
        else:
            print(f"  [SKIPPED] {item_name} (not found in root)")


def configure_cross_package_imports():
    """
    Step 4: Ensure apps/django-api can import packages/ai-engine cleanly.
    Configures manage.py and core/settings.py in apps/django-api to include
    the packages/ai-engine directory in sys.path.
    """
    print("\n=== Step 4: Configuring Cross-Package Import Resolution ===")
    manage_py = DJANGO_API_DIR / "manage.py"
    if manage_py.exists():
        content = manage_py.read_text(encoding="utf-8")
        import_hook = (
            "\n# Monorepo resolution: add packages directory to sys.path\n"
            "BASE_DIR = os.path.dirname(os.path.abspath(__file__))\n"
            "PACKAGES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'packages', 'ai-engine'))\n"
            "if PACKAGES_DIR not in sys.path:\n"
            "    sys.path.insert(0, PACKAGES_DIR)\n"
        )
        if "PACKAGES_DIR" not in content:
            # Insert hook right inside main() before execute_from_command_line
            content = content.replace(
                "def main():\n    \"\"\"Run administrative tasks.\"\"\"",
                "def main():\n    \"\"\"Run administrative tasks.\"\"\"" + import_hook
            )
            manage_py.write_text(content, encoding="utf-8")
            print("  [CONFIGURED] Added sys.path resolution hook to apps/django-api/manage.py")

    settings_py = DJANGO_API_DIR / "core" / "settings.py"
    if settings_py.exists():
        content = settings_py.read_text(encoding="utf-8")
        settings_hook = (
            "\n# Monorepo package resolution\n"
            "PACKAGES_DIR = BASE_DIR.parent.parent / 'packages' / 'ai-engine'\n"
            "if str(PACKAGES_DIR) not in sys.path:\n"
            "    sys.path.insert(0, str(PACKAGES_DIR))\n"
        )
        if "PACKAGES_DIR" not in content:
            content = content.replace(
                "BASE_DIR = Path(__file__).resolve().parent.parent",
                "BASE_DIR = Path(__file__).resolve().parent.parent" + settings_hook
            )
            settings_py.write_text(content, encoding="utf-8")
            print("  [CONFIGURED] Added sys.path resolution hook to apps/django-api/core/settings.py")


def copy_mock_frontend_payload():
    """Step 5: Distribute mock_diagnostic_response.json to frontend apps."""
    print("\n=== Step 5: Distributing Mock Payload to Frontend ===")
    mock_src = ROOT_DIR / "mock_diagnostic_response.json"
    if mock_src.exists():
        fe_dest = STUDENT_FE_DIR / "mock_diagnostic_response.json"
        shutil.copy2(str(mock_src), str(fe_dest))
        print(f"  [COPIED] mock_diagnostic_response.json -> apps/student-fe/mock_diagnostic_response.json")


def main():
    print("Starting LearnLens monorepo restructuring...")
    create_monorepo_directories()
    move_django_backend_items()
    move_ai_engine_package()
    configure_cross_package_imports()
    copy_mock_frontend_payload()
    print("\n=== Monorepo restructuring complete! ===")


if __name__ == "__main__":
    main()
