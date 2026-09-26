"""
URL routing for LearnLens API app.
"""
from django.urls import path
from api.views import (
    AssessmentSubmitView,
    HealthCheckView,
    ClassHeatmapView,
    ContractSchemaView,
    FirebaseConfigView,
    TeacherTriageFeedView,
    LibrarySearchView,
    CartesiaTTSProxyView,
)
from api.tutor import TutorChatView, TutorTestGenerateView, TutorTestAnalyzeView
from api.tutor_open import OpenProblemGenerateView, OpenProblemEvaluateView
from api.teacher_insights import TeacherInsightsAskView
from api.voice import VoiceTranscribeView

app_name = "api"

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("assessments/submit/", AssessmentSubmitView.as_view(), name="assessment-submit"),
    path("assessments/contract/", ContractSchemaView.as_view(), name="assessment-contract"),
    path("config/firebase/", FirebaseConfigView.as_view(), name="firebase-config"),
    path("teacher/triage-alerts/", TeacherTriageFeedView.as_view(), name="teacher-triage-alerts"),
    path("teacher/class-heatmap/", ClassHeatmapView.as_view(), name="teacher-class-heatmap"),
    path("library/search/", LibrarySearchView.as_view(), name="library-search"),
    path("tts/speak/", CartesiaTTSProxyView.as_view(), name="cartesia-tts"),
    path("tutor/chat/", TutorChatView.as_view(), name="tutor-chat"),
    path("tutor/test/generate/", TutorTestGenerateView.as_view(), name="tutor-test-generate"),
    path("tutor/test/analyze/", TutorTestAnalyzeView.as_view(), name="tutor-test-analyze"),
    path("tutor/open/generate/", OpenProblemGenerateView.as_view(), name="tutor-open-generate"),
    path("tutor/open/evaluate/", OpenProblemEvaluateView.as_view(), name="tutor-open-evaluate"),
    path("teacher/insights/ask/", TeacherInsightsAskView.as_view(), name="teacher-insights-ask"),
    path("voice/transcribe/", VoiceTranscribeView.as_view(), name="voice-transcribe"),
]
