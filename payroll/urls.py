from django.urls import path, include
from rest_framework.routers import DefaultRouter
from payroll.views import SalaryStructureViewSet, SalaryRuleViewSet, PayrunViewSet, PayslipViewSet

app_name = 'payroll'

router = DefaultRouter()
router.register(r'structures', SalaryStructureViewSet, basename='salary-structures')
router.register(r'rules', SalaryRuleViewSet, basename='salary-rules')
router.register(r'payruns', PayrunViewSet, basename='payruns')
router.register(r'payslips', PayslipViewSet, basename='payslips')

urlpatterns = [
    path('', include(router.urls)),
]

