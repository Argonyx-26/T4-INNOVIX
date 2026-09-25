"""
URL routing for LearnLens API.
"""

from django.urls import path
from api.views import (
    AssessmentSubmitView,
    ClassHeatmapView,
    ContractSchemaView,
    FirebaseConfigView,
    TeacherTriageFeedView,
)

urlpatterns = [
    path("assessments/submit/", AssessmentSubmitView.as_view(), name="assessment-submit"),
    path("assessments/contract/", ContractSchemaView.as_view(), name="assessment-contract"),
    path("config/firebase/", FirebaseConfigView.as_view(), name="firebase-config"),
    path("teacher/triage-alerts/", TeacherTriageFeedView.as_view(), name="teacher-triage-alerts"),
    path("teacher/class-heatmap/", ClassHeatmapView.as_view(), name="teacher-class-heatmap"),
]
