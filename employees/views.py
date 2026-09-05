from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User, Group
from core.permissions import HasRole, is_employee_only
from employees.models import Employee
from employees.serializers import EmployeeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Employees.
    Supports search via ?search= and filtering via ?department= & ?status=.
    Restricts create/update/delete to Admin and HR Manager.
    Filters queryset for Employee role to see only their own record.
    """
    queryset = Employee.objects.all().select_related('manager', 'user', 'working_schedule').order_by('employee_code')
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'retrieve': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'create': ['Admin', 'HR Manager'],
        'update': ['Admin', 'HR Manager'],
        'partial_update': ['Admin', 'HR Manager'],
        'destroy': ['Admin', 'HR Manager'],
        'create_login': ['Admin', 'HR Manager'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'employee_code', 'email', 'job_position']
    ordering_fields = ['employee_code', 'date_joined', 'first_name', 'last_name']
    ordering = ['employee_code']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if is_employee_only(user):
            if hasattr(user, 'employee_profile') and user.employee_profile:
                queryset = queryset.filter(id=user.employee_profile.id)
            else:
                queryset = queryset.none()

        department = self.request.query_params.get('department')
        status = self.request.query_params.get('status')

        if department:
            queryset = queryset.filter(department__iexact=department)
        if status:
            queryset = queryset.filter(status__iexact=status)

        return queryset

    @action(detail=True, methods=['post'], url_path='create-login')
    def create_login(self, request, pk=None):
        """
        Create a login User account for an Employee and link it via employee.user.
        Restricted to Admin and HR Manager. Handles optional roles assignment for Admin.
        """
        employee = self.get_object()

        if employee.user:
            return Response(
                {"detail": "This employee already has a login account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"detail": "Both username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"username": ["A user with that username already exists."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Role handling & validation
        valid_roles = ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee']
        requested_roles = request.data.get('roles')

        user_is_admin = request.user.is_superuser or request.user.groups.filter(name='Admin').exists()

        if requested_roles is not None:
            if not isinstance(requested_roles, list):
                return Response(
                    {"roles": ["roles must be a list of role names."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            invalid_roles = [r for r in requested_roles if r not in valid_roles]
            if invalid_roles:
                return Response(
                    {"roles": [f"Invalid role(s): {', '.join(invalid_roles)}. Valid choices are: {', '.join(valid_roles)}."]},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if user_is_admin and requested_roles:
            target_roles = requested_roles
        else:
            # HR Manager or omitted roles defaults to ['Employee']
            target_roles = ['Employee']

        user = User.objects.create_user(
            username=username,
            password=password,
            email=employee.email,
            first_name=employee.first_name,
            last_name=employee.last_name
        )
        employee.user = user
        employee.save(update_fields=['user'])

        groups = []
        for role_name in target_roles:
            grp, _ = Group.objects.get_or_create(name=role_name)
            groups.append(grp)

        user.groups.set(groups)

        roles = list(user.groups.values_list('name', flat=True))
        return Response({
            "id": user.id,
            "username": user.username,
            "roles": roles,
        }, status=status.HTTP_201_CREATED)


