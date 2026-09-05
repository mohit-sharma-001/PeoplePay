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

    class Meta:
        ordering = ['category', 'name']
        verbose_name = 'Salary Rule'
        verbose_name_plural = 'Salary Rules'

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.category}"
