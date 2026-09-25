"""
Serializers for LearnLens API.
Defines strict validation for assessment submissions, diagnostic responses,
and psychometric metrics.
"""

from rest_framework import serializers


class AssessmentSubmissionRequestSerializer(serializers.Serializer):
    """
    Strict validation for assessment submission requests (POST /api/assessments/submit/).
    Enforces student identity, concept identifier, submission timing, and attempts.
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


class LearningGapSerializer(serializers.Serializer):
    topic_id = serializers.CharField(max_length=128)
    gap_description = serializers.CharField()
    priority_rank = serializers.IntegerField(min_value=1)


class RecommendedInterventionSerializer(serializers.Serializer):
    action_type = serializers.ChoiceField(
        choices=["micro_lesson", "targeted_practice", "concept_map_review", "worked_example_study"]
    )
    target_topic = serializers.CharField(max_length=128)
    description = serializers.CharField()
    estimated_time_minutes = serializers.IntegerField(min_value=1)


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
