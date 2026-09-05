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
        # Mon Jun 1 to Mon Jun 15 includes 11 working days (excluding Sat/Sun Jun 6-7, 13-14)
        self.assertEqual(response.data['duration'], 11)
        self.assertEqual(float(response.data['paid_duration']), 10.0)
        self.assertEqual(float(response.data['unpaid_duration']), 1.0)
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
        self.assertEqual(float(req.overflow_unpaid_request.unpaid_duration), 1.0)

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
        # 2026-07-01 (Wed) to 2026-07-05 (Sun) has 3 working days (Wed, Thu, Fri)
        self.assertEqual(response.data['duration'], 3)

    def test_friday_to_monday_counts_as_2_days(self):
        # 2026-06-05 is Friday, 2026-06-08 is Monday
        response = self.client.post('/api/time-off/requests/', {
            'employee': self.employee.id,
            'time_off_type': self.unpaid_type.id,
            'date_from': '2026-06-05',
            'date_to': '2026-06-08',
            'reason': 'Weekend bridge'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['duration'], 2)

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

    def test_hr_payroll_manager_cannot_approve_or_refuse_request_returns_403(self):
        payroll_mgr_group, _ = Group.objects.get_or_create(name='HR Payroll Manager')
        pm_user = User.objects.create_user(username='hr_pm_user', password='Password123!')
        pm_user.groups.add(payroll_mgr_group)
        self.client.force_authenticate(user=pm_user)

        req = TimeOffRequest.objects.create(
            employee=self.employee,
            time_off_type=self.pto_type,
            allocation=self.pto_alloc,
            date_from=date(2026, 8, 1),
            date_to=date(2026, 8, 2),
            paid_duration=2.0,
            status=TimeOffRequest.Status.SUBMITTED
        )

        approve_res = self.client.post(f'/api/time-off/requests/{req.id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_403_FORBIDDEN)

        refuse_res = self.client.post(f'/api/time-off/requests/{req.id}/refuse/')
        self.assertEqual(refuse_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_allocate_leave_type(self):
        # Create second employee Bob who has no allocation yet
        emp2 = Employee.objects.create(
            first_name='Bob',
            last_name='Jones',
            email='bob@peoplepay.com',
            department='Sales',
            job_position='Account Exec',
            date_joined=date(2025, 1, 1),
            status=Employee.Status.ACTIVE
        )

        res = self.client.post(f'/api/time-off/types/{self.pto_type.id}/bulk-allocate/', {
            'allocated_amount': 12,
            'valid_from': '2026-01-01',
            'valid_until': '2026-12-31'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # self.employee (Alice) already has pto_alloc for 2026 (skipped=1), emp2 (Bob) gets created (created=1)
        self.assertEqual(res.data['data']['created'], 1)
        self.assertEqual(res.data['data']['skipped'], 1)

        bob_alloc = TimeOffAllocation.objects.filter(employee=emp2, time_off_type=self.pto_type).first()
        self.assertIsNotNone(bob_alloc)
        self.assertEqual(float(bob_alloc.allocated_amount), 12.0)

    def test_bulk_allocate_non_admin_returns_403(self):
        emp_user = User.objects.create_user(username='bulk_emp', password='Password123!')
        emp_user.groups.add(self.emp_group)
        self.client.force_authenticate(user=emp_user)

        res = self.client.post(f'/api/time-off/types/{self.pto_type.id}/bulk-allocate/', {
            'allocated_amount': 12,
            'valid_from': '2026-01-01',
            'valid_until': '2026-12-31'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
