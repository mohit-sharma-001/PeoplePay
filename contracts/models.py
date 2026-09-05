from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from core.models import TimeStampedModel
from employees.models import Employee


class Contract(TimeStampedModel):
    """
    Employment Contract model representing period-based wage contracts.
    """
    class State(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        RUNNING = 'running', 'Running'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'

    MANUAL_STATE_CHOICES = [
        (State.DRAFT.value, State.DRAFT.label),
        (State.RUNNING.value, State.RUNNING.label),
        (State.CANCELLED.value, State.CANCELLED.label),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='contracts'
    )
    wage = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Base monthly wage amount"
    )
    date_start = models.DateField()
    date_end = models.DateField(
        null=True,
        blank=True,
        help_text="Leave blank if contract is open-ended"
    )
    state = models.CharField(
        max_length=20,
        choices=State.choices,
        default=State.DRAFT
    )

    department = models.CharField(
        max_length=50,
        choices=Employee.Department.choices
    )
    job_position = models.CharField(max_length=100)
    salary_structure_placeholder = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Temporary text note indicating intended salary structure name. Will be replaced by real ForeignKey when payroll app is created."
    )
    working_schedule = models.ForeignKey(
        'working_schedule.WorkingSchedule',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contracts',
        help_text="Optional shift schedule for expected working hours"
    )

    class Meta:
        ordering = ['-date_start']
        verbose_name = 'Contract'
        verbose_name_plural = 'Contracts'

    def __str__(self):
        return f"{self.employee.employee_code} - Contract ({self.effective_state}) - {self.wage}"

    @property
    def effective_state(self):
        """
        Derived contract status:
        - If state == 'cancelled' -> 'cancelled'
        - Elif state == 'draft' -> 'draft'
        - Elif date_end is set AND date_end < today -> 'expired'
        - Else -> 'running'
        """
        if self.state == self.State.CANCELLED:
            return self.State.CANCELLED
        elif self.state == self.State.DRAFT:
            return self.State.DRAFT
        elif self.date_end and self.date_end < date.today():
            return self.State.EXPIRED
        else:
            return self.State.RUNNING

    def clean(self):
        super().clean()
        if self.date_end and self.date_start and self.date_end < self.date_start:
            raise ValidationError({'date_end': 'End date cannot be prior to start date.'})

        emp_id = self.employee_id or (self.employee.id if getattr(self, 'employee', None) else None)

        # Overlap check for active 'running' contracts
        if self.effective_state == self.State.RUNNING and emp_id:
            qs = Contract.objects.filter(
                employee_id=emp_id
            ).exclude(state__in=[self.State.CANCELLED, self.State.DRAFT])

            if self.pk:
                qs = qs.exclude(pk=self.pk)

            new_start = self.date_start
            new_end = self.date_end or date.max

            for existing in qs:
                if existing.effective_state == self.State.RUNNING:
                    existing_start = existing.date_start
                    existing_end = existing.date_end or date.max

                    # Overlap condition: new_start <= existing_end AND new_end >= existing_start
                    if new_start <= existing_end and new_end >= existing_start:
                        raise ValidationError({
                            'date_start': f"Employee already has an active running contract for period {existing_start} to {existing.date_end or 'Open-ended'}."
                        })


    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def is_active_for_period(self, date_from, date_to):
        """
        Returns True if this contract is effectively running and covers the given date period.
        """
        if self.effective_state != self.State.RUNNING:
            return False

        end_check = self.date_end or date.max
        return self.date_start <= date_to and end_check >= date_from

