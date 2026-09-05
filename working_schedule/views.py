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
        'list': ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'],
        'retrieve': ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'],
        'create': ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'],
        'update': ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'],
        'partial_update': ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'],
        'destroy': ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
