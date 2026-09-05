from django.contrib import admin
from payroll.models import SalaryStructure, SalaryRule


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
