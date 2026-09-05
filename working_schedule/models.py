from django.db import models
from datetime import datetime, date, timedelta
from core.models import TimeStampedModel


class WorkingSchedule(TimeStampedModel):
    """
    Working Schedule model representing company shift templates.
    """
    class ScheduleType(models.TextChoices):
        FIXED = 'fixed', 'Fixed'
        FLEXIBLE = 'flexible', 'Flexible'

    name = models.CharField(max_length=100)
    schedule_type = models.CharField(
        max_length=20,
        choices=ScheduleType.choices,
        default=ScheduleType.FIXED
    )
    company_name = models.CharField(max_length=100, default='My Company')

    class Meta:
        ordering = ['name']
        verbose_name = 'Working Schedule'
        verbose_name_plural = 'Working Schedules'

    def __str__(self):
        return f"{self.name} ({self.total_weekly_hours} hrs/week)"

    @property
    def total_weekly_hours(self):
        """
        Dynamically calculates the total weekly expected working hours
        by summing up net daily hours across all schedule lines.
        """
        total = 0.0
        for line in self.lines.all():
            total += line.daily_hours
        return round(total, 2)


class WorkingScheduleLine(models.Model):
    """
    Individual daily line for a Working Schedule defining day shifts.
    """
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, 'Monday'
        TUESDAY = 1, 'Tuesday'
        WEDNESDAY = 2, 'Wednesday'
        THURSDAY = 3, 'Thursday'
        FRIDAY = 4, 'Friday'
        SATURDAY = 5, 'Saturday'
        SUNDAY = 6, 'Sunday'

    schedule = models.ForeignKey(
        WorkingSchedule,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_minutes = models.IntegerField(default=0, help_text="Break duration in minutes")

    class Meta:
        ordering = ['day_of_week', 'start_time']
        unique_together = ('schedule', 'day_of_week')
        verbose_name = 'Working Schedule Line'
        verbose_name_plural = 'Working Schedule Lines'

    def __str__(self):
        return f"{self.get_day_of_week_display()}: {self.start_time} - {self.end_time} ({self.daily_hours} hrs)"

    @property
    def daily_hours(self):
        """
        Calculates net working hours for this day line (end_time - start_time - break_minutes).
        """
        if not self.start_time or not self.end_time:
            return 0.0
        dummy_date = date.today()
        dt_start = datetime.combine(dummy_date, self.start_time)
        dt_end = datetime.combine(dummy_date, self.end_time)
        if dt_end < dt_start:
            # Shift crosses midnight
            dt_end += timedelta(days=1)
        diff_seconds = (dt_end - dt_start).total_seconds()
        net_hours = (diff_seconds / 3600.0) - (self.break_minutes / 60.0)
        return max(round(net_hours, 2), 0.0)
