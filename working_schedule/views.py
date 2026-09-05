from rest_framework import viewsets, permissions, filters
from core.permissions import HasRole
from working_schedule.models import WorkingSchedule
from working_schedule.serializers import WorkingScheduleSerializer


class WorkingScheduleViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Working Schedules.
    Restricted to Admin and HR Manager roles.
    Supports nested lines creation/update.
    """
    queryset = WorkingSchedule.objects.all().prefetch_related('lines').order_by('name')
    serializer_class = WorkingScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'],
        'retrieve': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'],
        'create': ['Admin', 'HR Manager', 'HR Payroll User'],
        'update': ['Admin', 'HR Manager', 'HR Payroll User'],
        'partial_update': ['Admin', 'HR Manager', 'HR Payroll User'],
        'destroy': ['Admin', 'HR Manager', 'HR Payroll User'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
