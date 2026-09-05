from rest_framework import viewsets, permissions, filters
from core.permissions import HasRole
from payroll.models import SalaryStructure, SalaryRule
from payroll.serializers import SalaryStructureSerializer, SalaryRuleSerializer


class SalaryStructureViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Salary Structures.
    Full CRUD restricted to Admin and HR Payroll Manager.
    Read-only (GET) additionally allowed for HR Payroll User.
    """
    queryset = SalaryStructure.objects.all().prefetch_related('rules').order_by('name')
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'retrieve': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'create': ['Admin', 'HR Payroll Manager'],
        'update': ['Admin', 'HR Payroll Manager'],
        'partial_update': ['Admin', 'HR Payroll Manager'],
        'destroy': ['Admin', 'HR Payroll Manager'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']


class SalaryRuleViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Salary Rules.
    Full CRUD restricted to Admin and HR Payroll Manager.
    Read-only (GET) additionally allowed for HR Payroll User.
    """
    queryset = SalaryRule.objects.all().select_related('structure').order_by('category', 'name')
    serializer_class = SalaryRuleSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'retrieve': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'create': ['Admin', 'HR Payroll Manager'],
        'update': ['Admin', 'HR Payroll Manager'],
        'partial_update': ['Admin', 'HR Payroll Manager'],
        'destroy': ['Admin', 'HR Payroll Manager'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'category']
    ordering_fields = ['category', 'name', 'amount', 'created_at']
