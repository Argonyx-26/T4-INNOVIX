"""
DRF Serializers for LearnLens Diagnostic Engine.
Adheres strictly to shared_types.json specifications.
"""
from rest_framework import serializers


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
    concept_id = serializers.CharField(max_length=255)
    concept_name = serializers.CharField(max_length=255)
    severity = serializers.ChoiceField(choices=["critical", "moderate", "minor"])
    description = serializers.CharField()
    evidence_item_ids = serializers.ListField(child=serializers.CharField())


class MisconceptionSerializer(serializers.Serializer):
    """Cognitive fallacy or persistent flawed mental model."""
    concept_id = serializers.CharField(max_length=255)
    identified_misconception = serializers.CharField(max_length=255)
    explanation = serializers.CharField()
    detected_in_items = serializers.ListField(child=serializers.CharField())


class RecommendedInterventionSerializer(serializers.Serializer):
    """Actionable pedagogical intervention."""
    intervention_id = serializers.CharField(max_length=255)
    title = serializers.CharField(max_length=255)
    type = serializers.ChoiceField(
        choices=["remedial_lesson", "practice_drill", "conceptual_reframing", "scaffolded_walkthrough"]
    )
    priority = serializers.ChoiceField(choices=["high", "medium", "low"])
    actionable_steps = serializers.ListField(child=serializers.CharField())


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
    learning_gaps = serializers.ListField(child=LearningGapSerializer())
    misconceptions = serializers.ListField(child=MisconceptionSerializer())
    recommended_interventions = serializers.ListField(child=RecommendedInterventionSerializer())
    summary_narrative = serializers.CharField()
