"""
Configuration and Client Factory for LearnLens AI Engine.
Integrates with OpenAI SDK.
"""

import os
import logging
from typing import Optional

logger = logging.getLogger("learnlens.ai_engine")

_openai_client = None


def get_openai_client():
    """
    Returns an initialized OpenAI client or None if OPENAI_API_KEY is omitted.
    """
    global _openai_client
    if _openai_client is not None:
        return _openai_client

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning(
            "[AI Engine] OPENAI_API_KEY is not set. Diagnostic agent will operate in deterministic heuristic mode."
        )
        return None

    try:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=api_key)
        logger.info("[AI Engine] OpenAI client successfully initialized.")
        return _openai_client
    except Exception as exc:
        logger.error(f"[AI Engine] Error initializing OpenAI client: {exc}")
        return None


def get_default_model() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
