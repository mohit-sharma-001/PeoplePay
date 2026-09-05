from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel


class Employee(TimeStampedModel):
    """
    Employee domain model representing staff records in PeoplePay 360.
    """
    class Department(models.TextChoices):
        ENGINEERING = 'Engineering', 'Engineering'
        PRODUCT = 'Product', 'Product'
        HR = 'HR', 'HR'
        FINANCE = 'Finance', 'Finance'
        SALES = 'Sales', 'Sales'
        OPERATIONS = 'Operations', 'Operations'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        TERMINATED = 'terminated', 'Terminated'

    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_profile',
        help_text="Optional link to Django User account for authentication"
    )
    employee_code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        help_text="Auto-generated unique code (e.g. EMP0001)"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(
        max_length=50,
        choices=Department.choices,
        default=Department.ENGINEERING
    )
    job_position = models.CharField(max_length=100)
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinates',
        help_text="Direct manager of the employee"
    )
    date_joined = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    working_schedule = models.ForeignKey(
        'working_schedule.WorkingSchedule',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees',
        help_text="Assigned shift schedule for expected working hours"
    )
    termination_reason = models.TextField(blank=True, null=True)
    terminated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['employee_code']
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def __str__(self):
        return f"{self.employee_code} - {self.first_name} {self.last_name} ({self.department})"

    def save(self, *args, **kwargs):
        if not self.employee_code:
            last_emp = Employee.objects.all().order_by('id').last()
            if last_emp and last_emp.id:
                new_id = last_emp.id + 1
            else:
                new_id = 1
            self.employee_code = f"EMP{new_id:04d}"
        super().save(*args, **kwargs)
