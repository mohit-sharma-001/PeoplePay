from rest_framework import serializers
from contracts.models import Contract
from django.core.exceptions import ValidationError as DjangoValidationError


class ContractSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField(read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    working_schedule_name = serializers.ReadOnlyField(source='working_schedule.name')

    class Meta:
        model = Contract
        fields = [
            'id',
            'employee',
            'employee_code',
            'employee_name',
            'wage',
            'date_start',
            'date_end',
            'state',
            'effective_state',
            'department',
            'job_position',
            'salary_structure_placeholder',
            'working_schedule',
            'working_schedule_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'effective_state', 'created_at', 'updated_at']


    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return None

    def validate(self, data):
        """
        Runs model-level clean() validation to catch overlapping running contract errors
        and convert Django ValidationError into DRF serializers.ValidationError (HTTP 400).
        """
        # Auto-populate department/job_position from employee if missing
        employee = data.get('employee', getattr(self.instance, 'employee', None))
        if employee:
            if not data.get('department') and not getattr(self.instance, 'department', None):
                data['department'] = employee.department
            if not data.get('job_position') and not getattr(self.instance, 'job_position', None):
                data['job_position'] = employee.job_position

        # Instantiate temporary Contract instance for validation
        if self.instance:
            instance = self.instance
            for attr, value in data.items():
                setattr(instance, attr, value)
        else:
            instance = Contract(**data)

        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)

        return data
