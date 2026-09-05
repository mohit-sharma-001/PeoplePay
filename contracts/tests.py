from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from employees.models import Employee
from contracts.models import Contract


class ContractAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='contractuser', password='Password123!')
        self.client.force_authenticate(user=self.user)

        self.employee = Employee.objects.create(
            first_name='Karan',
            last_name='Mehta',
            email='karan@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Software Engineer',
            date_joined=date(2024, 1, 1)
        )

        # Create active running contract
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
        """
        POSTing a second 'running' contract for an employee who already has an active
        running contract in an overlapping period MUST return an HTTP 400 Bad Request.
        """
        payload = {
            "employee": self.employee.id,
            "wage": "95000.00",
            "date_start": "2024-05-01",
            "date_end": "2025-05-01",
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
