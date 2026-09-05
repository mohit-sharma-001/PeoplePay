from django.contrib import admin
from payroll.models import SalaryStructure, SalaryRule, Payrun, Payslip


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'company_name', 'created_at')
    search_fields = ('name', 'code')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SalaryRule)
class SalaryRuleAdmin(admin.ModelAdmin):
    list_display = ('id', 'structure', 'name', 'code', 'category', 'amount_type', 'amount')
    list_filter = ('category', 'amount_type', 'structure')
    search_fields = ('name', 'code')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Payrun)
class PayrunAdmin(admin.ModelAdmin):
    list_display = ('id', 'reference', 'structure', 'date_from', 'date_to', 'status', 'created_at')
    list_filter = ('status', 'structure')
    search_fields = ('reference',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ('id', 'payrun', 'employee', 'basic', 'gross', 'net', 'status', 'is_excluded')
    list_filter = ('status', 'is_excluded', 'payrun')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

