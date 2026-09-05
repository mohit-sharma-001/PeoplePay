from django.urls import path, include
from rest_framework.routers import DefaultRouter
from employees.views import EmployeeViewSet

app_name = 'employees'

router = DefaultRouter()
router.register(r'', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
]
