from rest_framework import serializers
from payroll.models import SalaryStructure, SalaryRule, Payrun, Payslip, PayslipAdjustment


class SalaryRuleSerializer(serializers.ModelSerializer):
    sequence = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = SalaryRule
        fields = [
            'id', 'structure', 'sequence', 'name', 'code', 'category', 'amount_type',
            'amount', 'percentage_basis_code', 'formula', 'created_at', 'updated_at'
        ]


class SalaryStructureSerializer(serializers.ModelSerializer):
    rules = SalaryRuleSerializer(many=True, read_only=True)

    class Meta:
        model = SalaryStructure
        fields = ['id', 'name', 'code', 'company_name', 'rules', 'created_at', 'updated_at']


class PayslipAdjustmentSerializer(serializers.ModelSerializer):
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PayslipAdjustment
        fields = ['id', 'payslip', 'label', 'amount', 'added_by', 'added_by_name', 'created_at', 'updated_at']
        read_only_fields = ['payslip', 'added_by']

    def get_added_by_name(self, obj):
        if obj.added_by:
            return obj.added_by.get_full_name() or obj.added_by.username
        return ""


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()
    adjustments = PayslipAdjustmentSerializer(many=True, read_only=True)
    payrun_reference = serializers.ReadOnlyField(source='payrun.reference')

    class Meta:
        model = Payslip
        fields = [
            'id', 'payrun', 'payrun_reference', 'employee', 'employee_name', 'employee_code', 'contract',
            'basic', 'gross', 'total_deductions', 'net', 'line_items', 'adjustments',
            'status', 'warning', 'is_excluded', 'expected_hours', 'actual_hours', 'worked_percentage',
            'created_at', 'updated_at'
        ]

    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}".strip()
        return ""

    def get_employee_code(self, obj):
        if obj.employee:
            return obj.employee.employee_code
        return ""


class PayrunSerializer(serializers.ModelSerializer):
    payslips = PayslipSerializer(many=True, read_only=True)
    structure_name = serializers.ReadOnlyField(source='structure.name')
    employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Payrun
        fields = [
            'id', 'reference', 'structure', 'structure_name', 'date_from', 'date_to',
            'status', 'created_by', 'payslips', 'employee_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reference', 'status', 'created_by']


