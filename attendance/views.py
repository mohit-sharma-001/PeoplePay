from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from django.utils import timezone
from core.permissions import HasRole, is_employee_only
from core.utils import api_response
from attendance.models import Attendance
from attendance.serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Attendance Records.
    Restricts manual create/update/destroy & approve_correction to Admin and HR Manager.
    Filters queryset for Employee role to see only their own attendance records.
    Check-in and Check-out custom actions are open to any authenticated employee.
    """
    queryset = Attendance.objects.all().select_related('employee').order_by('-check_in')
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'retrieve': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'check_in': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'check_out': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'my_status': ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
        'create': ['Admin', 'HR Manager', 'HR Payroll User'],
        'update': ['Admin', 'HR Manager', 'HR Payroll User'],
        'partial_update': ['Admin', 'HR Manager', 'HR Payroll User'],
        'destroy': ['Admin', 'HR Manager', 'HR Payroll User'],
        'approve_correction': ['Admin', 'HR Manager', 'HR Payroll User'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_code', 'notes']
    ordering_fields = ['check_in', 'check_out', 'status', 'created_at']
    ordering = ['-check_in']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if is_employee_only(user):
            if hasattr(user, 'employee_profile') and user.employee_profile:
                queryset = queryset.filter(employee=user.employee_profile)
            else:
                queryset = queryset.none()

        employee_id = self.request.query_params.get('employee')
        status_param = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        if date_from:
            queryset = queryset.filter(check_in__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(check_in__date__lte=date_to)

        return queryset

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        """
        Live Check-In action for the currently authenticated user's linked Employee.
        """
        user = request.user
        if not hasattr(user, 'employee_profile') or not user.employee_profile:
            return api_response(
                message="Your user account is not linked to an Employee record.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors={"user": "No linked employee profile found."}
            )

        employee = user.employee_profile

        open_record = Attendance.objects.filter(employee=employee, check_out__isnull=True).first()
        if open_record:
            return api_response(
                message="An active open check-in record already exists.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors={"check_in": f"Already checked in at {open_record.check_in.strftime('%H:%M:%S')}. Please check out first."}
            )

        record = Attendance.objects.create(
            employee=employee,
            check_in=timezone.now(),
            status=Attendance.Status.PRESENT,
            is_manual_correction=False
        )

        serializer = self.get_serializer(record)
        return api_response(
            data=serializer.data,
            message="Check-in successful.",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'], url_path='check-out')
    def check_out(self, request):
        """
        Live Check-Out action for the currently authenticated user's linked Employee.
        """
        user = request.user
        if not hasattr(user, 'employee_profile') or not user.employee_profile:
            return api_response(
                message="Your user account is not linked to an Employee record.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors={"user": "No linked employee profile found."}
            )

        employee = user.employee_profile

        open_record = Attendance.objects.filter(employee=employee, check_out__isnull=True).order_by('-check_in').first()
        if not open_record:
            return api_response(
                message="No active open check-in record found to check out from.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors={"check_out": "No ongoing check-in session active."}
            )

        open_record.check_out = timezone.now()
        open_record.save()

        serializer = self.get_serializer(open_record)
        return api_response(
            data=serializer.data,
            message="Check-out successful."
        )

    @action(detail=False, methods=['get'], url_path='my-status')
    def my_status(self, request):
        """
        GET /api/attendance/my-status/
        Returns current open attendance record (if any) for the logged-in user's linked employee.
        """
        user = request.user
        if not hasattr(user, 'employee_profile') or not user.employee_profile:
            return api_response(
                data={"has_open_checkin": False, "attendance": None},
                message="No linked employee profile."
            )

        employee = user.employee_profile
        open_record = Attendance.objects.filter(
            employee=employee,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if open_record:
            serializer = self.get_serializer(open_record)
            return api_response(
                data={
                    "has_open_checkin": True,
                    "attendance": serializer.data
                },
                message="Open check-in record found."
            )

        return api_response(
            data={"has_open_checkin": False, "attendance": None},
            message="No open check-in record."
        )

    @action(detail=True, methods=['post'], url_path='approve-correction')
    def approve_correction(self, request, pk=None):
        """
        Manager / Admin endpoint to approve attendance corrections or overtime hours.
        Restricted to Admin and HR Manager roles.
        """
        attendance = self.get_object()
        check_out_val = request.data.get('check_out')
        status_val = request.data.get('status')
        notes_val = request.data.get('notes')

        if check_out_val:
            attendance.check_out = check_out_val
        if status_val:
            attendance.status = status_val

        approval_note = f"Approved by Manager: {notes_val}" if notes_val else "Overtime/Correction Approved by Manager"
        attendance.notes = f"{attendance.notes}\n{approval_note}".strip() if attendance.notes else approval_note

        attendance.is_manual_correction = True
        attendance.save()

        serializer = self.get_serializer(attendance)
        return api_response(
            data=serializer.data,
            message="Attendance correction and overtime approved successfully."
        )
