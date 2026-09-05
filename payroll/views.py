from rest_framework import viewsets, permissions, filters
from payroll.models import SalaryStructure, SalaryRule
from payroll.serializers import SalaryStructureSerializer, SalaryRuleSerializer


class SalaryStructureViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Salary Structures.
    """
    queryset = SalaryStructure.objects.all().prefetch_related('rules').order_by('name')
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']


class SalaryRuleViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Salary Rules.
    """
    queryset = SalaryRule.objects.all().select_related('structure').order_by('category', 'name')
    serializer_class = SalaryRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'category']
    ordering_fields = ['category', 'name', 'amount', 'created_at']
