from rest_framework import viewsets, permissions, filters
from core.permissions import HasRole, is_employee_only
from contracts.models import Contract
from contracts.serializers import ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Employment Contracts.
    Supports filtering by ?employee=, ?state=, ?department= and ordering by date_start.
    """
    queryset = Contract.objects.all().select_related('employee').order_by('-date_start')
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'retrieve': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'create': ['Admin', 'HR Manager', 'HR Payroll User'],
        'update': ['Admin', 'HR Manager', 'HR Payroll User'],
        'partial_update': ['Admin', 'HR Manager', 'HR Payroll User'],
        'destroy': ['Admin', 'HR Manager', 'HR Payroll User'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_code', 'job_position']
    ordering_fields = ['date_start', 'wage', 'state', 'created_at']
    ordering = ['-date_start']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if is_employee_only(user):
            if hasattr(user, 'employee_profile') and user.employee_profile:
                queryset = queryset.filter(employee=user.employee_profile)
            else:
                queryset = queryset.none()

        employee_id = self.request.query_params.get('employee')
        state = self.request.query_params.get('state')
        department = self.request.query_params.get('department')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if state:
            queryset = queryset.filter(state__iexact=state)
        if department:
            queryset = queryset.filter(department__iexact=department)

        return queryset
