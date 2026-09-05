from django.urls import path, include
from rest_framework.routers import DefaultRouter
from payroll.views import SalaryStructureViewSet, SalaryRuleViewSet

app_name = 'payroll'

router = DefaultRouter()
router.register(r'structures', SalaryStructureViewSet, basename='salary-structures')
router.register(r'rules', SalaryRuleViewSet, basename='salary-rules')

urlpatterns = [
    path('', include(router.urls)),
]
