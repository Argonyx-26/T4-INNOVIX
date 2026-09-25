"""
URL routing for LearnLens API app.
"""
from django.urls import path
from api.views import AssessmentSubmitView, HealthCheckView

app_name = 'api'

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('assessments/submit/', AssessmentSubmitView.as_view(), name='assessment-submit'),
]
