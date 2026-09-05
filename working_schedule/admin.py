from django.contrib import admin
from working_schedule.models import WorkingSchedule, WorkingScheduleLine


class WorkingScheduleLineInline(admin.TabularInline):
    model = WorkingScheduleLine
    extra = 5


@admin.register(WorkingSchedule)
class WorkingScheduleAdmin(admin.ModelAdmin):
    list_display = ('name', 'schedule_type', 'company_name', 'get_total_hours', 'created_at')
    list_filter = ('schedule_type', 'company_name')
    search_fields = ('name', 'company_name')
    inlines = [WorkingScheduleLineInline]

    def get_total_hours(self, obj):
        return f"{obj.total_weekly_hours} hrs"
    get_total_hours.short_description = 'Total Weekly Hours'
