"""
OpenAI SDK Client Wrapper for LearnLens.
Handles API key resolution and provides development mock capability.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger("learnlens.ai_engine")


def get_openai_client():
    """
    Instantiates OpenAI client if OPENAI_API_KEY is available in the environment.
    Returns None if missing to allow graceful development fallback.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("sk-placeholder"):
        logger.warning(
            "OPENAI_API_KEY is not configured or is a placeholder. "
            "ai_engine will utilize mock diagnostic generator."
        )
        return None

    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key)
    except Exception as exc:
        logger.error("Failed to initialize OpenAI client: %s", exc)
        return None
