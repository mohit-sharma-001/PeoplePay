from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from employees.models import Employee
from datetime import date


class Command(BaseCommand):
    help = 'Seeds sample Employee records with realistic Indian names and matching User accounts.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Employee seed process..."))

        # Ensure Groups exist
        groups = {
            'Admin': Group.objects.get_or_create(name='Admin')[0],
            'HR Manager': Group.objects.get_or_create(name='HR Manager')[0],
            'HR Payroll Manager': Group.objects.get_or_create(name='HR Payroll Manager')[0],
            'HR Payroll User': Group.objects.get_or_create(name='HR Payroll User')[0],
            'Employee': Group.objects.get_or_create(name='Employee')[0],
        }

        # Create admin superuser account if not exists
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@peoplepay360.com',
                'first_name': 'System',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()
        admin_user.groups.add(groups['Admin'])

        sample_data = [
            {
                'username': 'rajesh.sharma',
                'first_name': 'Rajesh',
                'last_name': 'Sharma',
                'email': 'rajesh.sharma@peoplepay360.com',
                'department': Employee.Department.ENGINEERING,
                'job_position': 'Engineering Director',
                'date_joined': date(2022, 1, 15),
                'role': 'Admin',
                'manager': None,
            },
            {
                'username': 'priya.patel',
                'first_name': 'Priya',
                'last_name': 'Patel',
                'email': 'priya.patel@peoplepay360.com',
                'department': Employee.Department.HR,
                'job_position': 'HR Lead Manager',
                'date_joined': date(2022, 4, 1),
                'role': 'HR Manager',
                'manager': None,
            },
            {
                'username': 'amit.verma',
                'first_name': 'Amit',
                'last_name': 'Verma',
                'email': 'amit.verma@peoplepay360.com',
                'department': Employee.Department.FINANCE,
                'job_position': 'Payroll Specialist',
                'date_joined': date(2023, 2, 10),
                'role': 'HR Payroll Manager',
                'manager': None,
            },
            {
                'username': 'ananya.iyer',
                'first_name': 'Ananya',
                'last_name': 'Iyer',
                'email': 'ananya.iyer@peoplepay360.com',
                'department': Employee.Department.ENGINEERING,
                'job_position': 'Senior Full Stack Engineer',
                'date_joined': date(2023, 6, 1),
                'role': 'Employee',
                'manager': 'rajesh.sharma',
            },
            {
                'username': 'vikram.singh',
                'first_name': 'Vikram',
                'last_name': 'Singh',
                'email': 'vikram.singh@peoplepay360.com',
                'department': Employee.Department.PRODUCT,
                'job_position': 'Lead Product Manager',
                'date_joined': date(2023, 8, 15),
                'role': 'Employee',
                'manager': 'rajesh.sharma',
            },
            {
                'username': 'sneha.gupta',
                'first_name': 'Sneha',
                'last_name': 'Gupta',
                'email': 'sneha.gupta@peoplepay360.com',
                'department': Employee.Department.SALES,
                'job_position': 'Account Executive',
                'date_joined': date(2024, 1, 10),
                'role': 'Employee',
                'manager': None,
            },
        ]

        created_count = 0
        emp_map = {}

        for item in sample_data:
            user, _ = User.objects.get_or_create(
                username=item['username'],
                defaults={
                    'email': item['email'],
                    'first_name': item['first_name'],
                    'last_name': item['last_name'],
                }
            )
            user.set_password('Password123!')
            user.save()

            if item['role'] in groups:
                user.groups.add(groups[item['role']])

            manager_emp = emp_map.get(item['manager']) if item['manager'] else None

            emp, created = Employee.objects.get_or_create(
                email=item['email'],
                defaults={
                    'user': user,
                    'first_name': item['first_name'],
                    'last_name': item['last_name'],
                    'phone': '+91 98765 43210',
                    'department': item['department'],
                    'job_position': item['job_position'],
                    'manager': manager_emp,
                    'date_joined': item['date_joined'],
                    'status': Employee.Status.ACTIVE,
                }
            )
            emp_map[item['username']] = emp
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} new Employee records (Total Employees: {Employee.objects.count()})."))
        self.stdout.write(self.style.NOTICE("Default login password for all seed accounts: Password123!"))
        self.stdout.write(self.style.NOTICE("Superuser account: admin / admin123"))
