from rest_framework import serializers
from time_off.models import TimeOffType, TimeOffAllocation, TimeOffRequest
from employees.models import Employee


class TimeOffTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for TimeOffType domain model.
    """
    class Meta:
        model = TimeOffType
        fields = [
            'id',
            'name',
            'unit',
            'requires_allocation',
            'is_paid',
            'requires_approval',
            'created_at',
            'updated_at',
        ]


class TimeOffAllocationSerializer(serializers.ModelSerializer):
    """
    Serializer for TimeOffAllocation model exposing computed balance fields.
    """
    employee_name = serializers.SerializerMethodField()
    time_off_type_name = serializers.ReadOnlyField(source='time_off_type.name')
    used_amount = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()

    class Meta:
        model = TimeOffAllocation
        fields = [
            'id',
            'employee',
            'employee_name',
            'time_off_type',
            'time_off_type_name',
            'allocated_amount',
            'used_amount',
            'remaining_amount',
            'valid_from',
            'valid_until',
            'state',
            'created_at',
            'updated_at',
        ]

    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return ""

    def validate(self, attrs):
        valid_from = attrs.get('valid_from', getattr(self.instance, 'valid_from', None))
        valid_until = attrs.get('valid_until', getattr(self.instance, 'valid_until', None))

        if valid_until and valid_from and valid_until < valid_from:
            raise serializers.ValidationError({
                "valid_until": "Valid until date cannot be prior to valid from date."
            })
        return attrs


class TimeOffRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for TimeOffRequest model supporting auto-split for over-limit requests.
    """
    employee_name = serializers.SerializerMethodField()
    time_off_type_name = serializers.ReadOnlyField(source='time_off_type.name')
    approved_by_name = serializers.SerializerMethodField()
    duration = serializers.ReadOnlyField()
    paid_duration = serializers.ReadOnlyField()
    unpaid_duration = serializers.ReadOnlyField()
    warning_message = serializers.ReadOnlyField()

    class Meta:
        model = TimeOffRequest
        fields = [
            'id',
            'employee',
            'employee_name',
            'time_off_type',
            'time_off_type_name',
            'allocation',
            'date_from',
            'date_to',
            'duration',
            'paid_duration',
            'unpaid_duration',
            'warning_message',
            'status',
            'reason',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'overflow_unpaid_request',
            'created_at',
            'updated_at',
        ]

    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return ""

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}"
        return None

    def validate(self, attrs):
        employee = attrs.get('employee', getattr(self.instance, 'employee', None))
        time_off_type = attrs.get('time_off_type', getattr(self.instance, 'time_off_type', None))
        date_from = attrs.get('date_from', getattr(self.instance, 'date_from', None))
        date_to = attrs.get('date_to', getattr(self.instance, 'date_to', None))
        allocation = attrs.get('allocation', getattr(self.instance, 'allocation', None))

        if date_from and date_to and date_to < date_from:
            raise serializers.ValidationError({
                "date_to": "End date cannot be prior to start date."
            })

        requested_duration = (date_to - date_from).days + 1 if (date_from and date_to and date_to >= date_from) else 0

        if time_off_type and time_off_type.requires_allocation:
            if not allocation:
                matching_alloc = TimeOffAllocation.objects.filter(
                    employee=employee,
                    time_off_type=time_off_type,
                    state=TimeOffAllocation.State.CONFIRMED,
                    valid_from__lte=date_from
                ).filter(
                    models_q_until(date_to)
                ).first()

                if matching_alloc:
                    allocation = matching_alloc
                    attrs['allocation'] = matching_alloc
                else:
                    raise serializers.ValidationError({
                        "allocation": f"Time off type '{time_off_type.name}' requires an active confirmed allocation, but none was provided or found for this employee."
                    })

            if allocation.employee != employee:
                raise serializers.ValidationError({
                    "allocation": "Selected allocation belongs to a different employee."
                })
            if allocation.time_off_type != time_off_type:
                raise serializers.ValidationError({
                    "allocation": f"Selected allocation is for '{allocation.time_off_type.name}', not '{time_off_type.name}'."
                })
            if allocation.state != TimeOffAllocation.State.CONFIRMED:
                raise serializers.ValidationError({
                    "allocation": "Selected allocation is in 'draft' status and cannot be drawn from until confirmed."
                })

            available_balance = allocation.remaining_amount
            if self.instance and self.instance.status == TimeOffRequest.Status.APPROVED and self.instance.allocation_id == allocation.id:
                curr_paid = float(self.instance.paid_duration) if self.instance.paid_duration > 0 else float(self.instance.duration)
                available_balance += curr_paid

            # Auto-split calculation: paid duration is covered up to available balance
            paid_days = min(float(requested_duration), max(0.0, available_balance))
            unpaid_days = max(0.0, float(requested_duration) - paid_days)

            attrs['paid_duration'] = paid_days
            attrs['unpaid_duration'] = unpaid_days
        else:
            # Type does not require allocation (e.g. Unpaid Leave)
            attrs['paid_duration'] = 0.0
            attrs['unpaid_duration'] = 0.0

        return attrs


def models_q_until(date_to):
    from django.db.models import Q
    return Q(valid_until__isnull=True) | Q(valid_until__gte=date_to)
