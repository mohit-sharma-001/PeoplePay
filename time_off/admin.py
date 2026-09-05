from django.contrib import admin
from time_off.models import TimeOffType, TimeOffAllocation, TimeOffRequest


@admin.register(TimeOffType)
class TimeOffTypeAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'unit',
        'requires_allocation',
        'is_paid',
        'requires_approval',
        'created_at',
    )
    list_filter = ('unit', 'requires_allocation', 'is_paid', 'requires_approval')
    search_fields = ('name',)


@admin.register(TimeOffAllocation)
class TimeOffAllocationAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'time_off_type',
        'allocated_amount',
        'used_amount',
        'remaining_amount',
        'valid_from',
        'valid_until',
        'state',
    )
    list_filter = ('state', 'time_off_type', 'valid_from')
    search_fields = (
        'employee__first_name',
        'employee__last_name',
        'employee__employee_code',
        'time_off_type__name',
    )
    raw_id_fields = ('employee', 'time_off_type')


@admin.register(TimeOffRequest)
class TimeOffRequestAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'time_off_type',
        'date_from',
        'date_to',
        'duration',
        'paid_duration',
        'unpaid_duration',
        'status',
        'approved_by',
        'approved_at',
    )
    list_filter = ('status', 'time_off_type', 'date_from')
    search_fields = (
        'employee__first_name',
        'employee__last_name',
        'employee__employee_code',
        'time_off_type__name',
        'reason',
    )
    raw_id_fields = ('employee', 'time_off_type', 'allocation', 'approved_by', 'overflow_unpaid_request')
