from rest_framework import viewsets, permissions, filters
from core.permissions import HasRole
from contracts.models import Contract
from contracts.serializers import ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Employment Contracts.
    Restricted to Admin and HR Manager roles.
    Supports filtering by ?employee=, ?state=, ?department= and ordering by date_start.
    """
    queryset = Contract.objects.all().select_related('employee').order_by('-date_start')
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    allowed_roles = ['Admin', 'HR Manager']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_code', 'job_position']
    ordering_fields = ['date_start', 'wage', 'state', 'created_at']
    ordering = ['-date_start']

    def get_queryset(self):
        queryset = super().get_queryset()
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
