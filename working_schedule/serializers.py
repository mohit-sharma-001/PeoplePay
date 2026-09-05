from rest_framework import serializers
from working_schedule.models import WorkingSchedule, WorkingScheduleLine


class WorkingScheduleLineSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    daily_hours = serializers.FloatField(read_only=True)

    class Meta:
        model = WorkingScheduleLine
        fields = [
            'id',
            'day_of_week',
            'day_name',
            'start_time',
            'end_time',
            'break_minutes',
            'daily_hours',
        ]


class WorkingScheduleSerializer(serializers.ModelSerializer):
    lines = WorkingScheduleLineSerializer(many=True, required=False)
    total_weekly_hours = serializers.FloatField(read_only=True)

    class Meta:
        model = WorkingSchedule
        fields = [
            'id',
            'name',
            'schedule_type',
            'company_name',
            'total_weekly_hours',
            'lines',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'total_weekly_hours', 'created_at', 'updated_at']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        schedule = WorkingSchedule.objects.create(**validated_data)
        for line_data in lines_data:
            WorkingScheduleLine.objects.create(schedule=schedule, **line_data)
        return schedule

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        instance.name = validated_data.get('name', instance.name)
        instance.schedule_type = validated_data.get('schedule_type', instance.schedule_type)
        instance.company_name = validated_data.get('company_name', instance.company_name)
        instance.save()

        if lines_data is not None:
            # Replace existing lines if new lines list provided
            instance.lines.all().delete()
            for line_data in lines_data:
                WorkingScheduleLine.objects.create(schedule=instance, **line_data)

        return instance
