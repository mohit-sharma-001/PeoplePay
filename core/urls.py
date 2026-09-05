from django.urls import path
from core.views import api_root_health

app_name = 'core'

urlpatterns = [
    path('', api_root_health, name='api-health'),
]
