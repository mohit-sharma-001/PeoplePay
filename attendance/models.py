from django.db import models
from django.core.exceptions import ValidationError
from core.models import TimeStampedModel
from employees.models import Employee


class Attendance(TimeStampedModel):
    """
    Attendance domain model tracking daily check-in/check-out timestamps and working hours.
    """
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        LATE = 'late', 'Late'
        ABSENT = 'absent', 'Absent'
        HALF_DAY = 'half_day', 'Half Day'
        ON_LEAVE = 'on_leave', 'On Leave'

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Leave blank if employee has not checked out yet"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PRESENT
    )
    is_manual_correction = models.BooleanField(
        default=False,
        help_text="Flags whether this record was manually created or corrected by an authorized user"
    )
    notes = models.TextField(
        blank=True,
        help_text="Optional comments or explanation for manual corrections"
    )

    class Meta:
        ordering = ['-check_in']
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        check_out_str = self.check_out.strftime('%H:%M') if self.check_out else 'Ongoing'
        return f"{self.employee.employee_code} - {self.check_in.strftime('%Y-%m-%d %H:%M')} to {check_out_str} ({self.status})"

    @property
    def raw_hours(self):
        """
        Calculates exact un-capped hours between check_in and check_out.
        """
        if not self.check_in or not self.check_out:
            return 0.0
        delta = self.check_out - self.check_in
        hours = delta.total_seconds() / 3600.0
        return max(round(hours, 2), 0.0)

    @property
    def worked_hours(self):
        """
        Dynamically calculates worked hours between check_in and check_out.
        If check-out exceeds 14 hours and is NOT approved/manually corrected,
        hours are capped at 12.0 for safety to prevent forgotten check-out inflation.
        If is_manual_correction is True (Manager approved overtime), full actual hours are preserved.
        """
        hours = self.raw_hours
        if hours > 14.0 and not self.is_manual_correction:
            return 12.0
        return hours

    def clean(self):
        super().clean()
        if self.check_in and self.check_out and self.check_out < self.check_in:
            raise ValidationError({'check_out': 'Check-out time cannot be earlier than check-in time.'})

    def save(self, *args, **kwargs):
        # Auto-note records where check-out > 14 hours if not yet manually corrected/approved
        if self.check_in and self.check_out:
            delta_hours = (self.check_out - self.check_in).total_seconds() / 3600.0
            if delta_hours > 14.0 and not self.is_manual_correction:
                if not self.notes:
                    self.notes = f"Auto-flagged: Check-out exceeded 14 hours ({round(delta_hours, 1)}h). Capped at 12h pending Manager overtime approval."

        self.full_clean()
        super().save(*args, **kwargs)
