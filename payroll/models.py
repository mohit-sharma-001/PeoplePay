from django.db import models
from core.models import TimeStampedModel


class SalaryStructure(TimeStampedModel):
    """
    Salary Structure model representing standard pay packages.
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    company_name = models.CharField(max_length=100, default='My Company')

    class Meta:
        ordering = ['name']
        verbose_name = 'Salary Structure'
        verbose_name_plural = 'Salary Structures'

    def __str__(self):
        return f"{self.name} ({self.code})"


class SalaryRule(TimeStampedModel):
    """
    Individual salary component/rule (basic wage, allowances, deductions).
    """
    class Category(models.TextChoices):
        BASIC = 'basic', 'Basic'
        ALLOWANCE = 'allowance', 'Allowance'
        DEDUCTION = 'deduction', 'Deduction'
        GROSS = 'gross', 'Gross'
        NET = 'net', 'Net'

    class AmountType(models.TextChoices):
        FIXED = 'fixed', 'Fixed'
        PERCENTAGE = 'percentage', 'Percentage'
        FORMULA = 'formula', 'Formula'

    structure = models.ForeignKey(
        SalaryStructure,
        on_delete=models.CASCADE,
        related_name='rules'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.BASIC
    )
    amount_type = models.CharField(
        max_length=20,
        choices=AmountType.choices,
        default=AmountType.FIXED
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    percentage_basis_code = models.CharField(max_length=50, blank=True, null=True)
    formula = models.TextField(blank=True, null=True)

    sequence = models.IntegerField(default=10)

    class Meta:
        ordering = ['sequence', 'id']
        verbose_name = 'Salary Rule'
        verbose_name_plural = 'Salary Rules'

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.category}"


from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=SalaryRule)
def renormalize_salary_rules_on_delete(sender, instance, **kwargs):
    structure = instance.structure
    remaining_rules = SalaryRule.objects.filter(structure=structure).order_by('sequence', 'id')
    for idx, rule in enumerate(remaining_rules, start=1):
        expected_seq = idx * 10
        if rule.sequence != expected_seq:
            SalaryRule.objects.filter(id=rule.id).update(sequence=expected_seq)


class Payrun(TimeStampedModel):
    """
    Payrun model representing a payroll run for a period.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        COMPUTED = 'computed', 'Computed'
        VALIDATED = 'validated', 'Validated'
        PAID = 'paid', 'Paid'

    reference = models.CharField(max_length=50, unique=True, blank=True)
    structure = models.ForeignKey(
        SalaryStructure,
        on_delete=models.CASCADE,
        related_name='payruns'
    )
    date_from = models.DateField()
    date_to = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    created_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payruns'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payrun'
        verbose_name_plural = 'Payruns'

    def __str__(self):
        return f"{self.reference} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.reference:
            yr_m = self.date_from.strftime('%Y-%m') if self.date_from else '2026-09'
            prefix = f"PR-{yr_m}-"
            count = Payrun.objects.filter(reference__startswith=prefix).count() + 1
            self.reference = f"{prefix}{count:03d}"
        super().save(*args, **kwargs)


class Payslip(TimeStampedModel):
    """
    Individual Payslip model representing computed salary details for an employee in a payrun.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        COMPUTED = 'computed', 'Computed'
        VALIDATED = 'validated', 'Validated'
        PAID = 'paid', 'Paid'

    payrun = models.ForeignKey(
        Payrun,
        on_delete=models.CASCADE,
        related_name='payslips'
    )
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='payslips'
    )
    contract = models.ForeignKey(
        'contracts.Contract',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payslips'
    )
    basic = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gross = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    line_items = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    warning = models.TextField(blank=True, default='')
    is_excluded = models.BooleanField(default=False)
    expected_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    worked_percentage = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)

    class Meta:
        ordering = ['employee__first_name', 'employee__last_name']
        verbose_name = 'Payslip'
        verbose_name_plural = 'Payslips'

    def recalculate_net(self):
        from decimal import Decimal
        base_net = Decimal(str(self.line_items.get('NET', 0))) if self.line_items else Decimal('0.00')
        adj_total = sum((adj.amount for adj in PayslipAdjustment.objects.filter(payslip=self)), Decimal('0.00'))
        self.net = base_net + adj_total
        self.save(update_fields=['net'])


class PayslipAdjustment(TimeStampedModel):
    """
    Ad-hoc payslip adjustments (overtime, festival incentives, special deductions).
    """
    payslip = models.ForeignKey(
        Payslip,
        on_delete=models.CASCADE,
        related_name='adjustments'
    )
    label = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    added_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payslip_adjustments'
    )

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Payslip Adjustment'
        verbose_name_plural = 'Payslip Adjustments'

    def __str__(self):
        return f"{self.label}: {self.amount} ({self.payslip})"


