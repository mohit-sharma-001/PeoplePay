from rest_framework import serializers
from payroll.models import SalaryStructure, SalaryRule


class SalaryRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryRule
        fields = ['id', 'structure', 'name', 'code', 'category', 'amount_type', 'amount', 'created_at', 'updated_at']


class SalaryStructureSerializer(serializers.ModelSerializer):
    rules = SalaryRuleSerializer(many=True, read_only=True)

    class Meta:
        model = SalaryStructure
        fields = ['id', 'name', 'code', 'company_name', 'rules', 'created_at', 'updated_at']
