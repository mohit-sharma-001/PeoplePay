from django.core.management.base import BaseCommand
from payroll.models import SalaryStructure, SalaryRule


class Command(BaseCommand):
    help = 'Seeds sample salary structures and salary rules.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Payroll structures and rules...")

        struct_std, _ = SalaryStructure.objects.get_or_create(
            code="STD_ENG",
            defaults={"name": "Standard Engineering Structure", "company_name": "PeoplePay Corp"}
        )

        struct_exec, _ = SalaryStructure.objects.get_or_create(
            code="EXEC_PAY",
            defaults={"name": "Executive Structure", "company_name": "PeoplePay Corp"}
        )

        # Rules for Standard Engineering
        SalaryRule.objects.get_or_create(
            structure=struct_std,
            code="BASIC",
            defaults={
                "name": "Basic Monthly Salary",
                "category": SalaryRule.Category.BASIC,
                "amount_type": SalaryRule.AmountType.FIXED,
                "amount": 50000.00
            }
        )

        SalaryRule.objects.get_or_create(
            structure=struct_std,
            code="HRA",
            defaults={
                "name": "House Rent Allowance",
                "category": SalaryRule.Category.ALLOWANCE,
                "amount_type": SalaryRule.AmountType.FIXED,
                "amount": 20000.00
            }
        )

        SalaryRule.objects.get_or_create(
            structure=struct_std,
            code="PF_DED",
            defaults={
                "name": "Provident Fund Deduction",
                "category": SalaryRule.Category.DEDUCTION,
                "amount_type": SalaryRule.AmountType.FIXED,
                "amount": 3600.00
            }
        )

        self.stdout.write(self.style.SUCCESS("Payroll structures and rules seeded successfully."))
