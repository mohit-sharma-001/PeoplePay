from django.contrib import admin
from employees.models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'employee_code',
        'first_name',
        'last_name',
        'email',
        'department',
        'job_position',
        'status',
        'date_joined',
    )
    list_filter = ('department', 'status', 'date_joined')
    search_fields = ('employee_code', 'first_name', 'last_name', 'email', 'job_position')
    ordering = ('employee_code',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
