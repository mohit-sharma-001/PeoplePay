from django.urls import path
from payroll.report_views import payroll_cost_report, leave_liability_report, full_ledger_report

urlpatterns = [
    path('payroll-cost/', payroll_cost_report, name='payroll-cost-report'),
    path('leave-liability/', leave_liability_report, name='leave-liability-report'),
    path('full-ledger/', full_ledger_report, name='full-ledger-report'),
]
