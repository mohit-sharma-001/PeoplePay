from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from employees.models import Employee
from contracts.models import Contract
from attendance.models import Attendance
from time_off.models import TimeOffRequest, TimeOffAllocation


class Command(BaseCommand):
    help = 'Destructive command to delete all Employee records and non-admin Users while preserving configuration models.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--yes',
            action='store_true',
            help='Bypass the interactive confirmation prompt.',
        )

    def handle(self, *args, **options):
        if not options['yes']:
            confirm = input("Are you sure? This will delete all employee data. Type 'yes' to confirm: ")
            if confirm.strip().lower() != 'yes':
                self.stdout.write(self.style.WARNING("Data reset cancelled."))
                return

        self.stdout.write("Starting dummy data reset...")

        # 1. Count records prior to deletion
        emp_count = Employee.objects.count()
        contract_count = Contract.objects.count()
        attendance_count = Attendance.objects.count()
        request_count = TimeOffRequest.objects.count()
        allocation_count = TimeOffAllocation.objects.count()

        non_admin_users = User.objects.filter(is_superuser=False).exclude(username='admin')
        user_count = non_admin_users.count()

        # 2. Perform Deletions
        # Deleting Employee cascade-deletes linked Contracts, Attendance, TimeOffRequests, TimeOffAllocations
        deleted_emp_info = Employee.objects.all().delete()
        deleted_user_info = non_admin_users.delete()

        # 3. Print Output Summary
        self.stdout.write(self.style.SUCCESS("\n--- Data Reset Complete ---"))
        self.stdout.write(f"Employees deleted: {emp_count}")
        self.stdout.write(f"Contracts deleted: {contract_count}")
        self.stdout.write(f"Attendance records deleted: {attendance_count}")
        self.stdout.write(f"Time Off Requests deleted: {request_count}")
        self.stdout.write(f"Time Off Allocations deleted: {allocation_count}")
        self.stdout.write(f"User accounts deleted: {user_count}")
        self.stdout.write(self.style.SUCCESS("Configuration models (TimeOffType, SalaryStructure, SalaryRule, WorkingSchedule) and Superuser 'admin' were preserved.\n"))
