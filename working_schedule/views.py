from rest_framework import viewsets, permissions, filters
from working_schedule.models import WorkingSchedule
from working_schedule.serializers import WorkingScheduleSerializer


class WorkingScheduleViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Working Schedules.
    Supports nested lines creation/update.
    """
    queryset = WorkingSchedule.objects.all().prefetch_related('lines').order_by('name')
    serializer_class = WorkingScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
