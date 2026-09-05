from django.contrib import admin
from contracts.models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'employee',
        'wage',
        'date_start',
        'date_end',
        'state',
        'department',
        'job_position',
    )
    list_filter = ('state', 'department', 'date_start')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code', 'job_position')
    ordering = ('-date_start',)
