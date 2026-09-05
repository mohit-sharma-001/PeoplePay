from django.core.management.base import BaseCommand
from datetime import date
from contracts.models import Contract
from employees.models import Employee


class Command(BaseCommand):
    help = 'Seeds sample Contract records (active running and historical expired contracts) per employee.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Contracts seed process..."))

        employees = Employee.objects.all()
        if not employees.exists():
            self.stdout.write(self.style.WARNING("No employees found. Please run seed_employees first."))
            return

        created_count = 0
        wages = [85000.00, 95000.00, 110000.00, 70000.00, 125000.00, 60000.00]

        for idx, emp in enumerate(employees):
            if Contract.objects.filter(employee=emp).exists():
                continue

            base_wage = wages[idx % len(wages)]

            try:
                # 1. Historical Expired Contract
                expired_contract, created_exp = Contract.objects.get_or_create(
                    employee=emp,
                    date_start=date(2023, 1, 1),
                    date_end=date(2023, 12, 31),
                    defaults={
                        'wage': base_wage - 10000,
                        'state': Contract.State.EXPIRED,
                        'department': emp.department,
                        'job_position': emp.job_position,
                        'salary_structure_placeholder': 'Standard Regular Structure'
                    }
                )
                if created_exp:
                    created_count += 1

                # 2. Current Active Running Contract
                running_contract, created_run = Contract.objects.get_or_create(
                    employee=emp,
                    date_start=date(2024, 1, 1),
                    defaults={
                        'date_end': None,
                        'wage': base_wage,
                        'state': Contract.State.RUNNING,
                        'department': emp.department,
                        'job_position': emp.job_position,
                        'salary_structure_placeholder': 'Executive Structure' if idx % 2 == 0 else 'Standard Regular Structure'
                    }
                )
                if created_run:
                    created_count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Skipped seeding contract for {emp.first_name} {emp.last_name}: {e}"))


        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} new Contract records (Total Contracts: {Contract.objects.count()})."))
