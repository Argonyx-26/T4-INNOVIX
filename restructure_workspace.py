"""
restructure_workspace.py
Monorepo Restructuring Script for LearnLens (Team Innovix).

Reorganizes the workspace into the official 4-part decoupled monorepo:
1. apps/student-fe   (FE1: Next.js Focus Mode & Diagnostic Modal)
2. apps/teacher-fe   (FE2: Next.js Real-time Triage Kanban)
3. apps/django-api   (BE1: Django settings, API routing, Math Engine)
4. packages/ai-engine (BE2: Local ML classifiers & Gemini AI pipelines)

Leaves shared_types.json in the root directory as the shared contract.
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

DJANGO_FOLDERS = ["core", "api", "math_engine"]
DJANGO_ROOT_FILES = ["manage.py", "db.sqlite3", "Procfile", "render.yaml"]
AI_FOLDERS = ["ai_engine"]


def create_monorepo_directories():
    """1. Create directories: apps/student-fe, apps/teacher-fe, apps/django-api, packages/ai-engine."""
    print("=== Step 1: Creating Monorepo Directories ===")
    for directory in [STUDENT_FE_DIR, TEACHER_FE_DIR, DJANGO_API_DIR, AI_ENGINE_PKG_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"  [CONFIRMED] {directory.relative_to(ROOT_DIR)}")


def move_django_folders():
    """2. Move the existing Django folders (core, api, math_engine) into apps/django-api."""
    print("\n=== Step 2: Moving Django Folders into apps/django-api ===")
    for folder in DJANGO_FOLDERS:
        src = ROOT_DIR / folder
        dest = DJANGO_API_DIR / folder
        if src.exists():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.move(str(src), str(dest))
            print(f"  [MOVED] {folder} -> apps/django-api/{folder}")
        elif dest.exists():
            print(f"  [PRESENT] {folder} already located at apps/django-api/{folder}")
        else:
            print(f"  [WARNING] {folder} not found in root or destination")

    # Also move root Django execution files if present
    for fname in DJANGO_ROOT_FILES:
        src = ROOT_DIR / fname
        dest = DJANGO_API_DIR / fname
        if src.exists():
            if dest.exists():
                dest.unlink()
            shutil.move(str(src), str(dest))
            print(f"  [MOVED] {fname} -> apps/django-api/{fname}")


def move_ai_engine_folder():
    """3. Move the ai_engine folder into packages/ai-engine."""
    print("\n=== Step 3: Moving ai_engine into packages/ai-engine ===")
    for folder in AI_FOLDERS:
        src = ROOT_DIR / folder
        dest = AI_ENGINE_PKG_DIR / folder
        if src.exists():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.move(str(src), str(dest))
            print(f"  [MOVED] {folder} -> packages/ai-engine/{folder}")
        elif dest.exists():
            print(f"  [PRESENT] {folder} already located at packages/ai-engine/{folder}")
        else:
            print(f"  [WARNING] {folder} not found in root or destination")


def verify_root_contract():
    """4. Leave shared_types.json in the root directory."""
    print("\n=== Step 4: Verifying shared_types.json Contract ===")
    contract = ROOT_DIR / "shared_types.json"
    if contract.exists():
        print(f"  [VERIFIED] shared_types.json resides securely in root directory: {contract.name}")
    else:
        print(f"  [ERROR] shared_types.json is missing from root directory!")


def configure_cross_package_imports():
    """Ensure apps/django-api can import packages/ai-engine without PYTHONPATH friction."""
    print("\n=== Step 5: Configuring Import Resolution ===")
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
            print("  [CONFIGURED] Added package resolution hook to apps/django-api/core/settings.py")
        else:
            print("  [CONFIRMED] Import resolution already configured in core/settings.py")


def main():
    print("Executing LearnLens Monorepo Restructuring (restructure_workspace.py)...")
    create_monorepo_directories()
    move_django_folders()
    move_ai_engine_folder()
    verify_root_contract()
    configure_cross_package_imports()
    print("\n=== Monorepo restructuring complete! ===")


if __name__ == "__main__":
    main()
