from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from django.utils import timezone
from core.utils import api_response
from time_off.models import TimeOffType, TimeOffAllocation, TimeOffRequest
from time_off.serializers import (
    TimeOffTypeSerializer,
    TimeOffAllocationSerializer,
    TimeOffRequestSerializer,
)


class TimeOffTypeViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for managing leave categories/types.
    """
    queryset = TimeOffType.objects.all().order_by('name')
    serializer_class = TimeOffTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']


class TimeOffAllocationViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for managing leave allocations granted to employees.
    Supports filtering by ?employee=, ?time_off_type=, and ?state=.
    """
    queryset = TimeOffAllocation.objects.all().select_related('employee', 'time_off_type').order_by('-valid_from')
    serializer_class = TimeOffAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_code', 'time_off_type__name']
    ordering_fields = ['valid_from', 'valid_until', 'allocated_amount', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee')
        type_id = self.request.query_params.get('time_off_type')
        state_param = self.request.query_params.get('state')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if type_id:
            queryset = queryset.filter(time_off_type_id=type_id)
        if state_param:
            queryset = queryset.filter(state__iexact=state_param)

        return queryset


class TimeOffRequestViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for managing time off requests.
    Supports filtering by ?employee=, ?status=, and ?time_off_type=.
    Provides custom actions: POST /api/time-off/requests/{id}/approve/ and POST /api/time-off/requests/{id}/refuse/.
    """
    queryset = TimeOffRequest.objects.all().select_related(
        'employee', 'time_off_type', 'allocation', 'approved_by', 'overflow_unpaid_request'
    ).order_by('-date_from')
    serializer_class = TimeOffRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_code', 'time_off_type__name', 'reason']
    ordering_fields = ['date_from', 'date_to', 'status', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee')
        status_param = self.request.query_params.get('status')
        type_id = self.request.query_params.get('time_off_type')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        if type_id:
            queryset = queryset.filter(time_off_type_id=type_id)

        return queryset

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """
        Approve time off request.
        If request exceeds paid leave balance (unpaid_duration > 0), approves paid portion
        and automatically creates an approved Unpaid Leave record for the excess days.
        """
        time_off_req = self.get_object()

        if time_off_req.status == TimeOffRequest.Status.APPROVED:
            return api_response(
                message="Time off request is already approved.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors={"status": "Request is already in approved state."}
            )

        approver = None
        user = request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            approver = user.employee_profile

        # If request has unpaid_duration > 0, auto-create approved Unpaid Leave overflow record
        if float(time_off_req.unpaid_duration) > 0 and not time_off_req.overflow_unpaid_request:
            unpaid_type = TimeOffType.objects.filter(requires_allocation=False, is_paid=False).first()
            if not unpaid_type:
                unpaid_type = TimeOffType.objects.create(
                    name="Unpaid Leave",
                    unit=TimeOffType.Unit.DAYS,
                    requires_allocation=False,
                    is_paid=False,
                    requires_approval=True
                )

            overflow_req = TimeOffRequest.objects.create(
                employee=time_off_req.employee,
                time_off_type=unpaid_type,
                allocation=None,
                date_from=time_off_req.date_from,
                date_to=time_off_req.date_to,
                paid_duration=0.0,
                unpaid_duration=time_off_req.unpaid_duration,
                status=TimeOffRequest.Status.APPROVED,
                reason=f"Auto-generated Unpaid Leave overflow for request #{time_off_req.id}: {time_off_req.reason}".strip(),
                approved_by=approver,
                approved_at=timezone.now()
            )
            time_off_req.overflow_unpaid_request = overflow_req

        time_off_req.status = TimeOffRequest.Status.APPROVED
        time_off_req.approved_at = timezone.now()
        time_off_req.approved_by = approver
        time_off_req.save()

        serializer = self.get_serializer(time_off_req)
        msg = "Time off request approved successfully."
        if float(time_off_req.unpaid_duration) > 0:
            msg += f" ({time_off_req.paid_duration} days paid PTO + {time_off_req.unpaid_duration} days auto-converted to Unpaid Leave)."

        return api_response(
            data=serializer.data,
            message=msg
        )

    @action(detail=True, methods=['post'], url_path='refuse')
    def refuse(self, request, pk=None):
        """
        Refuse time off request. Does not touch allocation balance.
        """
        time_off_req = self.get_object()
        time_off_req.status = TimeOffRequest.Status.REFUSED
        time_off_req.save()

        serializer = self.get_serializer(time_off_req)
        return api_response(
            data=serializer.data,
            message="Time off request refused successfully."
        )
