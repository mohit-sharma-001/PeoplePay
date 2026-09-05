from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from employees.models import Employee
from contracts.models import Contract


class ContractAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.hr_group, _ = Group.objects.get_or_create(name='HR Manager')
        self.emp_group, _ = Group.objects.get_or_create(name='Employee')

        self.user = User.objects.create_user(username='contractuser', password='Password123!')
        self.user.groups.add(self.admin_group)
        self.client.force_authenticate(user=self.user)

        self.employee = Employee.objects.create(
            first_name='Karan',
            last_name='Mehta',
            email='karan@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Software Engineer',
            date_joined=date(2024, 1, 1)
        )

        self.running_contract = Contract.objects.create(
            employee=self.employee,
            wage=90000.00,
            date_start=date(2024, 1, 1),
            date_end=None,
            state=Contract.State.RUNNING,
            department='Engineering',
            job_position='Software Engineer'
        )

    def test_is_active_for_period(self):
        self.assertTrue(self.running_contract.is_active_for_period(date(2024, 6, 1), date(2024, 6, 30)))
        self.assertFalse(self.running_contract.is_active_for_period(date(2023, 1, 1), date(2023, 12, 31)))

    def test_overlapping_running_contract_post_returns_400(self):
        payload = {
            "employee": self.employee.id,
            "wage": "95000.00",
            "date_start": "2026-01-01",
            "date_end": "2027-12-31",
            "state": "running",
            "department": "Engineering",
            "job_position": "Senior Engineer"
        }
        response = self.client.post('/api/contracts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date_start', response.data)


    def test_non_overlapping_draft_contract_post_succeeds(self):
        payload = {
            "employee": self.employee.id,
            "wage": "105000.00",
            "date_start": "2026-01-01",
            "date_end": "2026-12-31",
            "state": "draft",
            "department": "Engineering",
            "job_position": "Lead Engineer"
        }
        response = self.client.post('/api/contracts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_role_cannot_create_contract_returns_403(self):
        emp_user = User.objects.create_user(username='plain_emp', password='Password123!')
        emp_user.groups.add(self.emp_group)
        self.client.force_authenticate(user=emp_user)

        payload = {
            "employee": self.employee.id,
            "wage": "60000.00",
            "date_start": "2026-01-01",
            "state": "draft",
            "department": "Engineering",
            "job_position": "Junior Engineer"
        }
        response = self.client.post('/api/contracts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_effective_state_expired_vs_running(self):
        test_emp = Employee.objects.create(
            first_name='Eff',
            last_name='State',
            email='effstate@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Engineer',
            date_joined=date(2020, 1, 1)
        )
        past_contract = Contract.objects.create(
            employee=test_emp,
            wage=70000.00,
            date_start=date(2022, 1, 1),
            date_end=date(2022, 12, 31),
            state=Contract.State.RUNNING,
            department='Engineering',
            job_position='Engineer'
        )
        self.assertEqual(past_contract.effective_state, Contract.State.EXPIRED)
        self.assertEqual(past_contract.state, Contract.State.RUNNING)

        open_contract = Contract.objects.create(
            employee=test_emp,
            wage=85000.00,
            date_start=date(2025, 1, 1),
            date_end=None,
            state=Contract.State.RUNNING,
            department='Engineering',
            job_position='Engineer'
        )
        self.assertEqual(open_contract.effective_state, Contract.State.RUNNING)


    def test_expired_past_contract_does_not_block_new_running_contract(self):
        emp2 = Employee.objects.create(
            first_name='Anil',
            last_name='Kumar',
            email='anil@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Developer',
            date_joined=date(2022, 1, 1)
        )
        Contract.objects.create(
            employee=emp2,
            wage=60000.00,
            date_start=date(2022, 1, 1),
            date_end=date(2022, 12, 31),
            state=Contract.State.RUNNING,
            department='Engineering',
            job_position='Developer'
        )

        payload = {
            "employee": emp2.id,
            "wage": "80000.00",
            "date_start": "2024-01-01",
            "date_end": None,
            "state": "running",
            "department": "Engineering",
            "job_position": "Senior Developer"
        }
        response = self.client.post('/api/contracts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['effective_state'], 'running')

