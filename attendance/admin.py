from django.contrib import admin
from attendance.models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'employee',
        'check_in',
        'check_out',
        'get_worked_hours',
        'status',
        'is_manual_correction',
    )
    list_filter = ('status', 'is_manual_correction', 'check_in')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code', 'notes')
    ordering = ('-check_in',)

    def get_worked_hours(self, obj):
        hours = obj.worked_hours
        return f"{hours} hrs" if hours is not None else "Ongoing"
    get_worked_hours.short_description = 'Worked Hours'
