"""
Dynamic Subject Ontology Generator for LearnLens.
Constructs a structured prerequisite knowledge graph for any arbitrary academic subject
using OpenAI LLM with enforced JSON object response format.
"""
import json
import logging
import re
from typing import Dict, Any, List

from .client import get_openai_client
from .exceptions import OntologyGenerationError

logger = logging.getLogger("learnlens.ai_engine")

ONTOLOGY_SYSTEM_PROMPT = """You are an expert curriculum architect and knowledge graph ontologist.
Given an educational subject, decompose it into a clean prerequisite hierarchy (Directed Acyclic Graph)
representing foundational to advanced cognitive concepts.

You MUST respond ONLY with a valid JSON object adhering strictly to this schema:
{
  "subject": "Subject Name",
  "root_concept_id": "string",
  "concepts": [
    {
      "concept_id": "snake_case_id",
      "name": "Concept Title",
      "description": "Concise pedagogical summary of concept",
      "difficulty_tier": 1,
      "prerequisites": ["prior_concept_id_1", ...]
    }
  ]
}

Guidelines:
1. Every concept_id must be lowercase snake_case (e.g. 'plasma_membrane_transport').
2. Foundational concepts have an empty list [] for prerequisites.
3. Every prerequisite referenced must exist within the 'concepts' list.
4. Return raw JSON without markdown fences.
"""


def _slugify(text: str) -> str:
    """Helper to create snake_case concept IDs."""
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')


def _validate_ontology_schema(data: Dict[str, Any], requested_subject: str) -> Dict[str, Any]:
    """Validates structure and integrity of generated knowledge graph."""
    if not isinstance(data, dict):
        raise OntologyGenerationError("Ontology output must be a JSON object dictionary.")

    subject = data.get("subject") or requested_subject
    concepts = data.get("concepts")
    if not isinstance(concepts, list) or len(concepts) == 0:
        raise OntologyGenerationError("Ontology must contain a non-empty list of 'concepts'.")

    sanitized_concepts: List[Dict[str, Any]] = []
    concept_ids = set()

    for idx, item in enumerate(concepts):
        if not isinstance(item, dict):
            raise OntologyGenerationError(f"Concept item at index {idx} is not an object.")

        name = item.get("name") or f"Concept {idx + 1}"
        cid = item.get("concept_id") or _slugify(name)
        concept_ids.add(cid)

        desc = item.get("description") or f"Foundational curriculum concept for {name}."
        tier = item.get("difficulty_tier", 1)
        prereqs = item.get("prerequisites", [])
        if not isinstance(prereqs, list):
            prereqs = []

        sanitized_concepts.append({
            "concept_id": str(cid),
            "name": str(name),
            "description": str(desc),
            "difficulty_tier": int(tier) if isinstance(tier, (int, float)) else 1,
            "prerequisites": [str(p) for p in prereqs]
        })

    root_id = data.get("root_concept_id") or (sanitized_concepts[0]["concept_id"] if sanitized_concepts else "root")

    return {
        "subject": str(subject),
        "root_concept_id": str(root_id),
        "concepts": sanitized_concepts
    }


def _generate_mock_ontology(subject: str) -> Dict[str, Any]:
    """Generates a deterministic prerequisite graph when running in development mode."""
    slug = _slugify(subject)
    return {
        "subject": subject.strip(),
        "root_concept_id": f"{slug}_foundations",
        "concepts": [
            {
                "concept_id": f"{slug}_foundations",
                "name": f"Foundations of {subject.strip().title()}",
                "description": f"Core principles, terminology, and foundational axioms of {subject}.",
                "difficulty_tier": 1,
                "prerequisites": []
            },
            {
                "concept_id": f"{slug}_intermediate_mechanisms",
                "name": f"{subject.strip().title()} Mechanics & Dynamics",
                "description": f"Dynamic interactions and application of foundational concepts in {subject}.",
                "difficulty_tier": 2,
                "prerequisites": [f"{slug}_foundations"]
            },
            {
                "concept_id": f"{slug}_advanced_synthesis",
                "name": f"Advanced {subject.strip().title()} Problem Solving",
                "description": f"Complex multi-variable analysis and real-world synthesis in {subject}.",
                "difficulty_tier": 3,
                "prerequisites": [f"{slug}_intermediate_mechanisms"]
            }
        ]
    }


def generate_subject_ontology(subject: str) -> Dict[str, Any]:
    """
    Accepts any subject string and produces a structured prerequisite concept tree
    for dynamic knowledge graph population.

    :param subject: Academic subject or topic (e.g. "Cellular Biology", "Linear Algebra").
    :return: Dict containing subject, root_concept_id, and list of prerequisite concepts.
    :raises ValueError: If subject is empty or non-string.
    :raises OntologyGenerationError: If generation fails or output schema is invalid.
    """
    if not isinstance(subject, str) or not subject.strip():
        raise ValueError("subject must be a non-empty string.")

    subject_clean = subject.strip()
    client = get_openai_client()

    # Development fallback
    if client is None:
        logger.warning("Operating in dev mode: generating deterministic subject ontology for '%s'.", subject_clean)
        return _validate_ontology_schema(_generate_mock_ontology(subject_clean), subject_clean)

    try:
        user_message = f"Construct a comprehensive prerequisite ontology for the subject: '{subject_clean}'."

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": ONTOLOGY_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )

        content = response.choices[0].message.content
        if not content:
            raise OntologyGenerationError("OpenAI returned an empty response for ontology generation.")

        raw_data = json.loads(content)
        return _validate_ontology_schema(raw_data, subject_clean)

    except json.JSONDecodeError as exc:
        raise OntologyGenerationError(f"Failed to parse LLM ontology output as JSON: {exc}") from exc
    except OntologyGenerationError:
        raise
    except Exception as exc:
        raise OntologyGenerationError(f"Subject ontology generation failed: {exc}") from exc
