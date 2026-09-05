from django.urls import path, include
from rest_framework.routers import DefaultRouter
from working_schedule.views import WorkingScheduleViewSet

app_name = 'working_schedule'

router = DefaultRouter()
router.register(r'', WorkingScheduleViewSet, basename='working-schedule')

urlpatterns = [
    path('', include(router.urls)),
]
