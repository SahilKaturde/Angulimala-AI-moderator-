from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.analyze_text, name='analyze_text'),
    path('health/', views.health_check, name='health_check'),
    path("respond/", views.respond_to_reflection, name="respond_to_reflection"),
]