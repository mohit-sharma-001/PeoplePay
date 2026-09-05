from rest_framework.decorators import api_view
from core.utils import api_response


@api_view(['GET'])
def payroll_index(request):
    return api_response(data=[], message="Payroll module API skeleton (Salary Structure, Salary Rule, Payrun, Payslip)")
