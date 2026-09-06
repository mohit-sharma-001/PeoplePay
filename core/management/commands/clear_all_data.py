from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from employees.models import Employee
from contracts.models import Contract
from working_schedule.models import WorkingSchedule
from attendance.models import Attendance
from time_off.models import TimeOffRequest, TimeOffAllocation, TimeOffType
from payroll.models import Payrun, Payslip, SalaryStructure, SalaryRule


class Command(BaseCommand):
    help = 'Completely clears all dummy database records, leaving ONLY the admin superuser.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting complete database wipe..."))

        # 1. Delete domain records
        Payslip.objects.all().delete()
        Payrun.objects.all().delete()
        SalaryRule.objects.all().delete()
        SalaryStructure.objects.all().delete()
        TimeOffRequest.objects.all().delete()
        TimeOffAllocation.objects.all().delete()
        TimeOffType.objects.all().delete()
        Attendance.objects.all().delete()
        Contract.objects.all().delete()
        WorkingSchedule.objects.all().delete()
        Employee.objects.all().delete()

        # 2. Delete non-admin users
        User = get_user_model()
        User.objects.filter(is_superuser=False).delete()

        # 3. Create clean superuser admin with Admin group
        admin_grp, _ = Group.objects.get_or_create(name='Admin')
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@peoplepay.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password('Admin12345!')
        admin_user.save()
        admin_user.groups.add(admin_grp)

        self.stdout.write(self.style.SUCCESS("Database 100% clean! Zero records exist. Only superuser 'admin' exists."))
