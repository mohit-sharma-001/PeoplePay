from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from employees.models import Employee
from time_off.models import TimeOffType, TimeOffAllocation, TimeOffRequest


class TimeOffModuleTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.emp_group, _ = Group.objects.get_or_create(name='Employee')

        self.user = User.objects.create_superuser(
            username='admin',
            email='admin@peoplepay.com',
            password='password123'
        )
        self.user.groups.add(self.admin_group)
        self.client.force_authenticate(user=self.user)

        self.employee = Employee.objects.create(
            user=self.user,
            first_name='Alice',
            last_name='Smith',
            email='alice@peoplepay.com',
            department='Engineering',
            job_position='Senior Dev',
            date_joined=date(2025, 1, 1)
        )

        self.pto_type = TimeOffType.objects.create(
            name='Paid Time Off',
            unit=TimeOffType.Unit.DAYS,
            requires_allocation=True,
            is_paid=True
        )

        self.unpaid_type = TimeOffType.objects.create(
            name='Unpaid Leave',
            unit=TimeOffType.Unit.DAYS,
            requires_allocation=False,
            is_paid=False
        )

        self.pto_alloc = TimeOffAllocation.objects.create(
            employee=self.employee,
            time_off_type=self.pto_type,
            allocated_amount=10.00,
            valid_from=date(2026, 1, 1),
            valid_until=date(2026, 12, 31),
            state=TimeOffAllocation.State.CONFIRMED
        )

    def test_time_off_type_crud(self):
        response = self.client.get('/api/time-off/types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_allocation_computed_fields(self):
        self.assertEqual(self.pto_alloc.used_amount, 0.0)
        self.assertEqual(self.pto_alloc.remaining_amount, 10.0)

    def test_create_request_within_balance_success(self):
        response = self.client.post('/api/time-off/requests/', {
            'employee': self.employee.id,
            'time_off_type': self.pto_type.id,
            'allocation': self.pto_alloc.id,
            'date_from': '2026-06-01',
            'date_to': '2026-06-03',
            'reason': 'Vacation'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['duration'], 3)
        self.assertEqual(float(response.data['paid_duration']), 3.0)
        self.assertEqual(float(response.data['unpaid_duration']), 0.0)
        self.assertIsNone(response.data['warning_message'])

    def test_over_limit_request_auto_splits_and_warns(self):
        response = self.client.post('/api/time-off/requests/', {
            'employee': self.employee.id,
            'time_off_type': self.pto_type.id,
            'allocation': self.pto_alloc.id,
            'date_from': '2026-06-01',
            'date_to': '2026-06-15',
            'reason': 'Long international trip'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['duration'], 15)
        self.assertEqual(float(response.data['paid_duration']), 10.0)
        self.assertEqual(float(response.data['unpaid_duration']), 5.0)
        self.assertIsNotNone(response.data['warning_message'])
        self.assertIn("10.0 day(s) will be covered by Paid Time Off", response.data['warning_message'])

    def test_approve_over_limit_request_creates_unpaid_overflow(self):
        response = self.client.post('/api/time-off/requests/', {
            'employee': self.employee.id,
            'time_off_type': self.pto_type.id,
            'allocation': self.pto_alloc.id,
            'date_from': '2026-06-01',
            'date_to': '2026-06-15',
            'reason': 'Extended leave'
        }, format='json')
        req_id = response.data['id']

        approve_resp = self.client.post(f'/api/time-off/requests/{req_id}/approve/')
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)

        req = TimeOffRequest.objects.get(id=req_id)
        self.assertEqual(req.status, TimeOffRequest.Status.APPROVED)
        self.assertIsNotNone(req.overflow_unpaid_request)
        self.assertEqual(req.overflow_unpaid_request.status, TimeOffRequest.Status.APPROVED)
        self.assertEqual(float(req.overflow_unpaid_request.unpaid_duration), 5.0)

        self.pto_alloc.refresh_from_db()
        self.assertEqual(self.pto_alloc.used_amount, 10.0)
        self.assertEqual(self.pto_alloc.remaining_amount, 0.0)

    def test_refuse_time_off_request(self):
        req = TimeOffRequest.objects.create(
            employee=self.employee,
            time_off_type=self.pto_type,
            allocation=self.pto_alloc,
            date_from=date(2026, 6, 1),
            date_to=date(2026, 6, 2),
            paid_duration=2.0,
            status=TimeOffRequest.Status.SUBMITTED
        )

        response = self.client.post(f'/api/time-off/requests/{req.id}/refuse/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, TimeOffRequest.Status.REFUSED)

        self.pto_alloc.refresh_from_db()
        self.assertEqual(self.pto_alloc.used_amount, 0.0)

    def test_unpaid_leave_without_allocation_succeeds(self):
        response = self.client.post('/api/time-off/requests/', {
            'employee': self.employee.id,
            'time_off_type': self.unpaid_type.id,
            'date_from': '2026-07-01',
            'date_to': '2026-07-05',
            'reason': 'Personal'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['duration'], 5)

    def test_employee_role_cannot_approve_request_returns_403(self):
        emp_user = User.objects.create_user(username='timeoff_emp', password='Password123!')
        emp_user.groups.add(self.emp_group)
        self.client.force_authenticate(user=emp_user)

        req = TimeOffRequest.objects.create(
            employee=self.employee,
            time_off_type=self.pto_type,
            allocation=self.pto_alloc,
            date_from=date(2026, 8, 1),
            date_to=date(2026, 8, 2),
            paid_duration=2.0,
            status=TimeOffRequest.Status.SUBMITTED
        )
        res = self.client.post(f'/api/time-off/requests/{req.id}/approve/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_role_cannot_create_time_off_type_returns_403(self):
        emp_user = User.objects.create_user(username='timeoff_emp2', password='Password123!')
        emp_user.groups.add(self.emp_group)
        self.client.force_authenticate(user=emp_user)

        res = self.client.post('/api/time-off/types/', {'name': 'Illegal Type'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
