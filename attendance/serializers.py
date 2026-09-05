from rest_framework import serializers
from attendance.models import Attendance
from django.core.exceptions import ValidationError as DjangoValidationError


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField(read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    worked_hours = serializers.FloatField(read_only=True)
    raw_hours = serializers.FloatField(read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'employee',
            'employee_code',
            'employee_name',
            'check_in',
            'check_out',
            'worked_hours',
            'raw_hours',
            'status',
            'is_manual_correction',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'worked_hours', 'raw_hours', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return None

    def validate(self, data):
        """
        Ensures check_out is after check_in and runs model clean() validation.
        """
        check_in = data.get('check_in', getattr(self.instance, 'check_in', None))
        check_out = data.get('check_out', getattr(self.instance, 'check_out', None))

        if check_in and check_out and check_out < check_in:
            raise serializers.ValidationError({
                'check_out': 'Check-out time cannot be earlier than check-in time.'
            })

        if self.instance:
            instance = self.instance
            for attr, value in data.items():
                setattr(instance, attr, value)
        else:
            instance = Attendance(**data)

        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)

        return data
