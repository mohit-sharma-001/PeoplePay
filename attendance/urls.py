from django.urls import path, include
from rest_framework.routers import DefaultRouter
from attendance.views import AttendanceViewSet

app_name = 'attendance'

router = DefaultRouter()
router.register(r'', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]
