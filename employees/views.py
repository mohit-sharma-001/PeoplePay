from rest_framework import viewsets, filters, permissions
from employees.models import Employee
from employees.serializers import EmployeeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Employees.
    Supports search via ?search= and filtering via ?department= & ?status=.
    """
    queryset = Employee.objects.all().select_related('manager', 'user').order_by('employee_code')
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'employee_code', 'email', 'job_position']
    ordering_fields = ['employee_code', 'date_joined', 'first_name', 'last_name']
    ordering = ['employee_code']

    def get_queryset(self):
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        status = self.request.query_params.get('status')

        if department:
            queryset = queryset.filter(department__iexact=department)
        if status:
            queryset = queryset.filter(status__iexact=status)

        return queryset
