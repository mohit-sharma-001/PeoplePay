from rest_framework import serializers
from employees.models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Employee model with helper read-only display fields.
    """
    full_name = serializers.SerializerMethodField(read_only=True)
    manager_name = serializers.SerializerMethodField(read_only=True)
    working_schedule_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id',
            'employee_code',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'department',
            'job_position',
            'manager',
            'manager_name',
            'working_schedule',
            'working_schedule_name',
            'user',
            'date_joined',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'employee_code', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}"
        return None

    def get_working_schedule_name(self, obj):
        if obj.working_schedule:
            return obj.working_schedule.name
        return None
