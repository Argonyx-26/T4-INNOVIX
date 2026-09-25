"""
DRF Serializers for LearnLens Diagnostic Engine.
Adheres strictly to shared_types.json specifications and supports both
holistic multi-item assessment submissions and granular single-item diagnostics.
"""
from rest_framework import serializers


# ==============================================================================
# 1. Multi-Item Assessment Serializers (Conforming to shared_types.json)
# ==============================================================================

class ItemResponseSerializer(serializers.Serializer):
    """Serializer for individual item responses within an assessment."""
    item_id = serializers.CharField(max_length=255)
    user_answer = serializers.JSONField(
        help_text="User's answer (string, number, boolean, or array)"
    )
    is_correct = serializers.BooleanField(required=False, allow_null=True, default=None)
    time_spent_seconds = serializers.FloatField(min_value=0.0)
    hints_used = serializers.IntegerField(default=0, min_value=0, required=False)
    confidence_level = serializers.ChoiceField(
        choices=["low", "medium", "high"],
        required=False,
        default="medium"
    )


class AssessmentSubmissionSerializer(serializers.Serializer):
    """
    Serializer validating incoming POST /api/assessments/submit/ payload.
    Contract defined in shared_types.json -> AssessmentSubmissionPayload.
    """
    assessment_id = serializers.UUIDField()
    student_id = serializers.CharField(max_length=255)
    domain = serializers.CharField(max_length=255)
    timestamp = serializers.DateTimeField(required=False)
    responses = serializers.ListField(
        child=ItemResponseSerializer(),
        allow_empty=False
    )
    metadata = serializers.DictField(required=False, default=dict)


class LearningGapSerializer(serializers.Serializer):
    """Detailed conceptual deficiency identified in learner."""
    concept_id = serializers.CharField(max_length=255, required=False)
    topic_id = serializers.CharField(max_length=255, required=False)
    concept_name = serializers.CharField(max_length=255, required=False)
    severity = serializers.ChoiceField(choices=["critical", "moderate", "minor"], required=False, default="moderate")
    description = serializers.CharField(required=False)
    gap_description = serializers.CharField(required=False)
    evidence_item_ids = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    priority_rank = serializers.IntegerField(min_value=1, required=False, default=1)


class MisconceptionSerializer(serializers.Serializer):
    """Cognitive fallacy or persistent flawed mental model."""
    concept_id = serializers.CharField(max_length=255, required=False)
    identified_misconception = serializers.CharField(max_length=255, required=False)
    explanation = serializers.CharField(required=False)
    detected_in_items = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class RecommendedInterventionSerializer(serializers.Serializer):
    """Actionable pedagogical intervention."""
    intervention_id = serializers.CharField(max_length=255, required=False)
    title = serializers.CharField(max_length=255, required=False)
    type = serializers.ChoiceField(
        choices=["remedial_lesson", "practice_drill", "conceptual_reframing", "scaffolded_walkthrough", "micro_lesson", "targeted_practice", "concept_map_review", "worked_example_study"],
        required=False,
        default="conceptual_reframing"
    )
    priority = serializers.ChoiceField(choices=["high", "medium", "low"], required=False, default="medium")
    actionable_steps = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    action_type = serializers.CharField(required=False)
    target_topic = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False)
    estimated_time_minutes = serializers.IntegerField(min_value=1, required=False)


class LLMDiagnosticResponseSerializer(serializers.Serializer):
    """
    Serializer validating outgoing/LLM-generated diagnostic payload.
    Contract defined in shared_types.json -> LLMDiagnosticResponse.
    """
    assessment_id = serializers.UUIDField()
    student_id = serializers.CharField(max_length=255)
    domain = serializers.CharField(max_length=255)
    mastery_score = serializers.FloatField(min_value=0.0, max_value=1.0)
    latent_ability_theta = serializers.FloatField()
    learning_gaps = serializers.ListField(child=LearningGapSerializer(), default=list)
    misconceptions = serializers.ListField(child=MisconceptionSerializer(), default=list)
    recommended_interventions = serializers.ListField(child=RecommendedInterventionSerializer(), default=list)
    summary_narrative = serializers.CharField()


# ==============================================================================
# 2. Granular Single-Item & BKT / Ebbinghaus Serializers (BE1 Specification)
# ==============================================================================

class AssessmentSubmissionRequestSerializer(serializers.Serializer):
    """
    Validation for single-concept assessment submission requests.
    Used for BKT Bayesian updates, Ebbinghaus decay, and Firestore state sync.
    """
    student_id = serializers.CharField(
        max_length=128,
        required=True,
        error_messages={"required": "student_id is required."}
    )
    concept_id = serializers.CharField(
        max_length=128,
        required=True,
        error_messages={"required": "concept_id is required."}
    )
    student_answer = serializers.CharField(
        required=True,
        allow_blank=True,
        allow_null=True,
        error_messages={"required": "student_answer is required."}
    )
    time_ms = serializers.IntegerField(
        min_value=0,
        required=True,
        error_messages={
            "required": "time_ms is required.",
            "min_value": "time_ms cannot be negative."
        }
    )
    attempts = serializers.IntegerField(
        min_value=1,
        default=1,
        required=False,
        error_messages={"min_value": "attempts must be at least 1."}
    )
    prior_mastery = serializers.FloatField(
        min_value=0.0,
        max_value=1.0,
        required=False,
        allow_null=True
    )


class AssessmentResponseItemSerializer(serializers.Serializer):
    question_id = serializers.CharField(max_length=128)
    topic_id = serializers.CharField(max_length=128)
    item_difficulty = serializers.FloatField(min_value=-4.0, max_value=4.0)
    item_discrimination = serializers.FloatField(min_value=0.0, default=1.0)
    selected_option_id = serializers.CharField(max_length=128, required=False, allow_null=True)
    free_text_answer = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_correct = serializers.BooleanField()
    response_time_ms = serializers.IntegerField(min_value=0)
    attempt_count = serializers.IntegerField(min_value=1, default=1)
    confidence_score = serializers.FloatField(min_value=1.0, max_value=5.0, required=False, allow_null=True)


class IdentifiedMisconceptionSerializer(serializers.Serializer):
    topic_id = serializers.CharField(max_length=128)
    misconception_name = serializers.CharField(max_length=256)
    severity = serializers.ChoiceField(choices=["critical", "moderate", "minor"])
    evidence_question_ids = serializers.ListField(child=serializers.CharField(), default=list)
    detailed_rationale = serializers.CharField()


class LLMDiagnosticSerializer(serializers.Serializer):
    diagnostic_summary = serializers.CharField()
    proficiency_level = serializers.ChoiceField(
        choices=["novice", "emerging", "proficient", "advanced", "master"]
    )
    identified_misconceptions = serializers.ListField(
        child=IdentifiedMisconceptionSerializer(),
        default=list
    )
    cognitive_strengths = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )
    learning_gaps = serializers.ListField(
        child=LearningGapSerializer(),
        default=list
    )
    recommended_interventions = serializers.ListField(
        child=RecommendedInterventionSerializer(),
        default=list
    )
    confidence_index = serializers.FloatField(min_value=0.0, max_value=1.0)


class MathMetricsSerializer(serializers.Serializer):
    theta_score = serializers.FloatField()
    standard_error = serializers.FloatField()
    percentile_rank = serializers.FloatField(min_value=0.0, max_value=100.0)
    raw_score = serializers.IntegerField()
    total_items = serializers.IntegerField()
    topic_mastery = serializers.DictField(
        child=serializers.FloatField(min_value=0.0, max_value=1.0)
    )


class AssessmentSubmissionResponseSerializer(serializers.Serializer):
    submission_id = serializers.UUIDField()
    assessment_id = serializers.UUIDField()
    user_id = serializers.CharField(max_length=128)
    status = serializers.ChoiceField(choices=["completed", "processing", "failed"])
    processed_at = serializers.DateTimeField()
    math_metrics = MathMetricsSerializer()
    ai_diagnostic = LLMDiagnosticSerializer()
