from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from core.models import TimeStampedModel
from employees.models import Employee


class TimeOffType(TimeStampedModel):
    """
    Model representing categories of leave (e.g., Paid Time Off, Sick Leave, Unpaid Leave).
    """
    class Unit(models.TextChoices):
        DAYS = 'days', 'Days'
        HOURS = 'hours', 'Hours'

    name = models.CharField(max_length=100)
    unit = models.CharField(
        max_length=10,
        choices=Unit.choices,
        default=Unit.DAYS
    )
    requires_allocation = models.BooleanField(
        default=True,
        help_text="If False, employees can request unlimited time off without pre-allocated balance tracking"
    )
    is_paid = models.BooleanField(
        default=True,
        help_text="Informs future payroll calculation whether this time off is paid or unpaid"
    )
    requires_approval = models.BooleanField(
        default=True,
        help_text="Requires explicit manager/HR approval"
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Time Off Type'
        verbose_name_plural = 'Time Off Types'

    def __str__(self):
        return f"{self.name} ({'Paid' if self.is_paid else 'Unpaid'})"


class TimeOffAllocation(TimeStampedModel):
    """
    Model representing allocated leave balances granted to employees for a specific leave type.
    """
    class State(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        CONFIRMED = 'confirmed', 'Confirmed'

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    time_off_type = models.ForeignKey(
        TimeOffType,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    allocated_amount = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0.00,
        help_text="Total granted leave amount (e.g. 20.00 days)"
    )
    valid_from = models.DateField()
    valid_until = models.DateField(
        null=True,
        blank=True,
        help_text="Expiry date for allocation. Leave blank for no expiry."
    )
    state = models.CharField(
        max_length=20,
        choices=State.choices,
        default=State.DRAFT
    )

    class Meta:
        ordering = ['-valid_from']
        verbose_name = 'Time Off Allocation'
        verbose_name_plural = 'Time Off Allocations'

    def __str__(self):
        return f"{self.employee.employee_code} - {self.time_off_type.name}: {self.remaining_amount}/{self.allocated_amount} ({self.state})"

    @property
    def used_amount(self):
        """
        Dynamically calculates used leave balance by summing duration of approved requests linked to this allocation.
        """
        if not self.pk:
            return 0.0
        approved_requests = self.requests.filter(status='approved')
        total = 0.0
        for req in approved_requests:
            # If request has paid_duration > 0, sum paid_duration; else sum full duration
            if req.paid_duration > 0:
                total += float(req.paid_duration)
            else:
                total += req.duration
        return round(float(total), 2)

    @property
    def remaining_amount(self):
        """
        Dynamically calculates remaining available leave balance (allocated - used).
        """
        return round(float(self.allocated_amount) - self.used_amount, 2)

    def clean(self):
        super().clean()
        if self.valid_until and self.valid_from and self.valid_until < self.valid_from:
            raise ValidationError({'valid_until': 'Valid until date cannot be earlier than valid from date.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class TimeOffRequest(TimeStampedModel):
    """
    Model representing an employee request for leave.
    Supports auto-split for requests exceeding available paid leave balances.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        APPROVED = 'approved', 'Approved'
        REFUSED = 'refused', 'Refused'
        CANCELLED = 'cancelled', 'Cancelled'

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='time_off_requests'
    )
    time_off_type = models.ForeignKey(
        TimeOffType,
        on_delete=models.CASCADE,
        related_name='time_off_requests'
    )
    allocation = models.ForeignKey(
        TimeOffAllocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requests',
        help_text="Allocation drawn from if time off type requires allocation"
    )
    date_from = models.DateField()
    date_to = models.DateField()
    paid_duration = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0.00,
        help_text="Duration covered by paid leave balance"
    )
    unpaid_duration = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0.00,
        help_text="Excess duration automatically routed to unpaid leave"
    )
    overflow_unpaid_request = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='parent_overflow_requests',
        help_text="Auto-created unpaid leave request for excess days"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED
    )
    reason = models.TextField(
        blank=True,
        help_text="Leave note explaining why employee is requesting leave"
    )
    approved_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_requests'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_from']
        verbose_name = 'Time Off Request'
        verbose_name_plural = 'Time Off Requests'

    def __str__(self):
        return f"{self.employee.employee_code} - {self.time_off_type.name} ({self.date_from} to {self.date_to}) [{self.status}]"

    @property
    def duration(self):
        """
        Dynamically calculates request duration in inclusive calendar days.
        """
        if not self.date_from or not self.date_to:
            return 0
        if self.date_to < self.date_from:
            return 0
        return (self.date_to - self.date_from).days + 1

    @property
    def warning_message(self):
        """
        Returns informational warning message if requested days exceed paid balance.
        """
        if float(self.unpaid_duration) > 0:
            type_name = self.time_off_type.name if self.time_off_type else "Paid Leave"
            return (
                f"{float(self.paid_duration)} day(s) will be covered by {type_name}. "
                f"The remaining {float(self.unpaid_duration)} day(s) will automatically convert to Unpaid Leave upon approval."
            )
        return None

    def clean(self):
        super().clean()
        if self.date_from and self.date_to and self.date_to < self.date_from:
            raise ValidationError({'date_to': 'End date cannot be earlier than start date.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
