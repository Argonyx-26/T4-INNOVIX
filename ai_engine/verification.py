"""
Verification Question Generator for LearnLens.
Takes a diagnosed misconception and generates a structurally different follow-up question
targeting the exact same cognitive skill, with distractors diagnosing the misconception.
"""
import json
import logging
from typing import Dict, Any, List, Optional

from .client import get_openai_client
from .exceptions import QuestionGenerationError

logger = logging.getLogger("learnlens.ai_engine")

VERIFICATION_SYSTEM_PROMPT = """You are an expert psychometric assessment author and cognitive test designer.
Your objective is to generate a structurally distinct follow-up verification question based on a student's diagnosed misconception.

Guidelines:
1. The new question must test the EXACT same underlying cognitive skill/concept, but MUST use completely different surface features, context, scenario, or numbers to prevent rote recall.
2. Provide 4 distinct options (A, B, C, D) with exactly ONE correct answer.
3. Crucially, at least one incorrect distractor MUST be specifically engineered to be selected by a student who still holds the diagnosed misconception.
4. Return ONLY a valid JSON object matching this schema:
{
  "target_misconception": "string repeating the diagnosed misconception",
  "cognitive_skill": "string naming the core cognitive skill tested",
  "question_text": "string of the problem prompt",
  "options": [
    {
      "id": "A",
      "text": "option text",
      "is_correct": false,
      "diagnoses_misconception": true
    },
    {
      "id": "B",
      "text": "option text",
      "is_correct": true,
      "diagnoses_misconception": false
    },
    {
      "id": "C",
      "text": "option text",
      "is_correct": false,
      "diagnoses_misconception": false
    },
    {
      "id": "D",
      "text": "option text",
      "is_correct": false,
      "diagnoses_misconception": false
    }
  ],
  "correct_option_id": "B",
  "explanation": "concise explanation of why the correct answer is right and how the distractor captures the misconception"
}

Do not include markdown codeblocks. Return raw JSON.
"""


def _validate_question_schema(data: Dict[str, Any], default_misconception: str) -> Dict[str, Any]:
    """Validates structural integrity of the generated verification question."""
    if not isinstance(data, dict):
        raise QuestionGenerationError("Output must be a JSON object dictionary.")

    question_text = data.get("question_text")
    if not question_text or not isinstance(question_text, str):
        raise QuestionGenerationError("Missing or invalid 'question_text'.")

    options = data.get("options")
    if not isinstance(options, list) or len(options) < 2:
        raise QuestionGenerationError("'options' must be a list containing at least 2 choices.")

    correct_id = data.get("correct_option_id")
    has_correct = False
    sanitized_options: List[Dict[str, Any]] = []

    for opt in options:
        if not isinstance(opt, dict):
            raise QuestionGenerationError("Option item must be a dictionary.")
        opt_id = str(opt.get("id", ""))
        is_corr = bool(opt.get("is_correct", False))
        if is_corr:
            has_correct = True
        sanitized_options.append({
            "id": opt_id,
            "text": str(opt.get("text", "")),
            "is_correct": is_corr,
            "diagnoses_misconception": bool(opt.get("diagnoses_misconception", False))
        })

    if not has_correct and sanitized_options:
        sanitized_options[0]["is_correct"] = True
        correct_id = sanitized_options[0]["id"]

    return {
        "target_misconception": str(data.get("target_misconception") or default_misconception),
        "cognitive_skill": str(data.get("cognitive_skill", "Targeted Concept Application")),
        "question_text": str(question_text).strip(),
        "options": sanitized_options,
        "correct_option_id": str(correct_id or (sanitized_options[0]["id"] if sanitized_options else "A")),
        "explanation": str(data.get("explanation", "Verification question targeting diagnosed cognitive misconception."))
    }


def _generate_mock_verification_question(
    diagnosed_misconception: str,
    concept_context: str
) -> Dict[str, Any]:
    """Generates a deterministic verification question for development/test mode."""
    return {
        "target_misconception": diagnosed_misconception.strip(),
        "cognitive_skill": f"Correct execution of {concept_context.strip().title()}",
        "question_text": (
            f"A learner encounters a novel scenario in {concept_context}. "
            "Which of the following actions reflects correct application rather than "
            f"assuming '{diagnosed_misconception}'?"
        ),
        "options": [
            {
                "id": "A",
                "text": f"Apply the rule while assuming: {diagnosed_misconception}",
                "is_correct": False,
                "diagnoses_misconception": True
            },
            {
                "id": "B",
                "text": "Apply the mathematically/conceptually rigorous definition with proper constraints.",
                "is_correct": True,
                "diagnoses_misconception": False
            },
            {
                "id": "C",
                "text": "Disregard the underlying boundary conditions entirely.",
                "is_correct": False,
                "diagnoses_misconception": False
            },
            {
                "id": "D",
                "text": "Invert the operation without checking sign consistency.",
                "is_correct": False,
                "diagnoses_misconception": False
            }
        ],
        "correct_option_id": "B",
        "explanation": (
            f"Option B validates the proper cognitive model. "
            f"Option A captures the misconception: '{diagnosed_misconception}'."
        )
    }


def generate_verification_question(
    diagnosed_misconception: str,
    concept_context: str,
    original_question: str = ""
) -> Dict[str, Any]:
    """
    Generates a structurally novel follow-up question testing the exact same skill
    to confirm or falsify the diagnosed misconception.

    :param diagnosed_misconception: The specific misconception identified previously.
    :param concept_context: Domain or concept topic.
    :param original_question: Optional text of previous question for structural differentiation.
    :return: Formatted dictionary with question, options, answer key, and distractor diagnostic flags.
    :raises ValueError: If required parameters are empty.
    :raises QuestionGenerationError: If generation fails or output schema is invalid.
    """
    if not isinstance(diagnosed_misconception, str) or not diagnosed_misconception.strip():
        raise ValueError("diagnosed_misconception must be a non-empty string.")
    if not isinstance(concept_context, str) or not concept_context.strip():
        raise ValueError("concept_context must be a non-empty string.")

    client = get_openai_client()

    # Development fallback
    if client is None:
        logger.warning("Operating in dev mode: generating deterministic verification question.")
        return _validate_question_schema(
            _generate_mock_verification_question(diagnosed_misconception, concept_context),
            diagnosed_misconception
        )

    try:
        user_message = (
            f"CONCEPT CONTEXT: {concept_context.strip()}\n"
            f"DIAGNOSED MISCONCEPTION: {diagnosed_misconception.strip()}\n"
            f"{f'ORIGINAL QUESTION: {original_question.strip()}' if original_question else ''}\n\n"
            "Generate a structurally distinct verification question with a misconception-targeted distractor."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": VERIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        content = response.choices[0].message.content
        if not content:
            raise QuestionGenerationError("OpenAI returned an empty response for verification question.")

        raw_data = json.loads(content)
        return _validate_question_schema(raw_data, diagnosed_misconception)

    except json.JSONDecodeError as exc:
        raise QuestionGenerationError(f"Failed to parse verification question as JSON: {exc}") from exc
    except QuestionGenerationError:
        raise
    except Exception as exc:
        raise QuestionGenerationError(f"Verification question generation failed: {exc}") from exc
