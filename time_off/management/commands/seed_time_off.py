from django.core.management.base import BaseCommand
from datetime import date
from django.utils import timezone
from employees.models import Employee
from time_off.models import TimeOffType, TimeOffAllocation, TimeOffRequest


class Command(BaseCommand):
    help = 'Seeds sample time off types, allocations, and requests.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Time Off data...")

        # 1. Create Time Off Types
        pto_type, _ = TimeOffType.objects.get_or_create(
            name="Paid Time Off",
            defaults={
                "unit": TimeOffType.Unit.DAYS,
                "requires_allocation": True,
                "is_paid": True,
                "requires_approval": True,
            }
        )

        sick_type, _ = TimeOffType.objects.get_or_create(
            name="Sick Leave",
            defaults={
                "unit": TimeOffType.Unit.DAYS,
                "requires_allocation": True,
                "is_paid": True,
                "requires_approval": True,
            }
        )

        unpaid_type, _ = TimeOffType.objects.get_or_create(
            name="Unpaid Leave",
            defaults={
                "unit": TimeOffType.Unit.DAYS,
                "requires_allocation": False,
                "is_paid": False,
                "requires_approval": True,
            }
        )

        self.stdout.write(self.style.SUCCESS("Time Off Types created."))

        # 2. Get Employees
        employees = list(Employee.objects.all().order_by('id'))
        if not employees:
            self.stdout.write(self.style.WARNING("No employees found. Please run seed_employees first."))
            return

        current_year = date.today().year
        start_of_year = date(current_year, 1, 1)
        end_of_year = date(current_year, 12, 31)

        manager_emp = employees[0]

        # 3. Create Allocations for Employees
        allocations_map = {}
        for emp in employees:
            pto_alloc, _ = TimeOffAllocation.objects.get_or_create(
                employee=emp,
                time_off_type=pto_type,
                valid_from=start_of_year,
                defaults={
                    "allocated_amount": 20.00,
                    "valid_until": end_of_year,
                    "state": TimeOffAllocation.State.CONFIRMED,
                }
            )
            allocations_map[(emp.id, pto_type.id)] = pto_alloc

            sick_alloc, _ = TimeOffAllocation.objects.get_or_create(
                employee=emp,
                time_off_type=sick_type,
                valid_from=start_of_year,
                defaults={
                    "allocated_amount": 10.00,
                    "valid_until": end_of_year,
                    "state": TimeOffAllocation.State.CONFIRMED,
                }
            )
            allocations_map[(emp.id, sick_type.id)] = sick_alloc

        self.stdout.write(self.style.SUCCESS(f"Allocations created for {len(employees)} employees."))

        # 4. Create Sample Requests
        # Request 1: Approved PTO for Employee 1 (3 days)
        emp1 = employees[0]
        emp1_pto_alloc = allocations_map.get((emp1.id, pto_type.id))
        TimeOffRequest.objects.get_or_create(
            employee=emp1,
            time_off_type=pto_type,
            date_from=date(current_year, 3, 10),
            date_to=date(current_year, 3, 12),
            defaults={
                "allocation": emp1_pto_alloc,
                "status": TimeOffRequest.Status.APPROVED,
                "reason": "Spring Family Vacation",
                "approved_by": manager_emp,
                "approved_at": timezone.now(),
            }
        )

        # Request 2: Approved Sick Leave for Employee 1 (2 days)
        emp1_sick_alloc = allocations_map.get((emp1.id, sick_type.id))
        TimeOffRequest.objects.get_or_create(
            employee=emp1,
            time_off_type=sick_type,
            date_from=date(current_year, 4, 14),
            date_to=date(current_year, 4, 15),
            defaults={
                "allocation": emp1_sick_alloc,
                "status": TimeOffRequest.Status.APPROVED,
                "reason": "Flu and fever rest",
                "approved_by": manager_emp,
                "approved_at": timezone.now(),
            }
        )

        # Request 3: Submitted (Pending) PTO for Employee 2 if exists, or Employee 1 (4 days)
        emp2 = employees[1] if len(employees) > 1 else emp1
        emp2_pto_alloc = allocations_map.get((emp2.id, pto_type.id))
        TimeOffRequest.objects.get_or_create(
            employee=emp2,
            time_off_type=pto_type,
            date_from=date(current_year, 7, 1),
            date_to=date(current_year, 7, 4),
            defaults={
                "allocation": emp2_pto_alloc,
                "status": TimeOffRequest.Status.SUBMITTED,
                "reason": "Summer break getaway",
            }
        )

        # Request 4: Refused PTO for Employee 2 if exists, or Employee 1 (5 days)
        TimeOffRequest.objects.get_or_create(
            employee=emp2,
            time_off_type=pto_type,
            date_from=date(current_year, 12, 24),
            date_to=date(current_year, 12, 28),
            defaults={
                "allocation": emp2_pto_alloc,
                "status": TimeOffRequest.Status.REFUSED,
                "reason": "Year-end holiday travel",
            }
        )

        # Request 5: Unpaid Leave (requires_allocation=False) for Employee 1 (2 days)
        TimeOffRequest.objects.get_or_create(
            employee=emp1,
            time_off_type=unpaid_type,
            date_from=date(current_year, 5, 20),
            date_to=date(current_year, 5, 21),
            defaults={
                "allocation": None,
                "status": TimeOffRequest.Status.APPROVED,
                "reason": "Personal errand days",
                "approved_by": manager_emp,
                "approved_at": timezone.now(),
            }
        )

        self.stdout.write(self.style.SUCCESS("Sample Time Off Requests successfully seeded."))
