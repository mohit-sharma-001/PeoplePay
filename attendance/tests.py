from django.test import TestCase
from django.contrib.auth.models import User, Group
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, date
from employees.models import Employee
from attendance.models import Attendance


class AttendanceAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.emp_group, _ = Group.objects.get_or_create(name='Employee')

        self.user = User.objects.create_user(username='attuser', password='Password123!')
        self.user.groups.add(self.admin_group)
        self.client.force_authenticate(user=self.user)

        self.employee = Employee.objects.create(
            user=self.user,
            first_name='Ananya',
            last_name='Iyer',
            email='ananya@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Senior Engineer',
            date_joined=date(2024, 1, 1)
        )

    def test_worked_hours_property(self):
        now = timezone.now()
        att = Attendance.objects.create(
            employee=self.employee,
            check_in=now - timedelta(hours=8),
            check_out=now,
            status=Attendance.Status.PRESENT
        )
        self.assertEqual(att.worked_hours, 8.0)

    def test_invalid_checkout_before_checkin_returns_400(self):
        now = timezone.now()
        payload = {
            "employee": self.employee.id,
            "check_in": now.isoformat(),
            "check_out": (now - timedelta(hours=2)).isoformat(),
            "status": "present"
        }
        response = self.client.post('/api/attendance/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('check_out', response.data)

    def test_live_check_in_and_check_out_actions(self):
        res_in = self.client.post('/api/attendance/check-in/')
        self.assertEqual(res_in.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_in.data['data']['status'], 'present')
        self.assertIsNone(res_in.data['data']['check_out'])

        res_dup = self.client.post('/api/attendance/check-in/')
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

        res_out = self.client.post('/api/attendance/check-out/')
        self.assertEqual(res_out.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res_out.data['data']['check_out'])

    def test_my_status_with_and_without_open_checkin(self):
        # 1. No open checkin initially
        res_initial = self.client.get('/api/attendance/my-status/')
        self.assertEqual(res_initial.status_code, status.HTTP_200_OK)
        self.assertFalse(res_initial.data['data']['has_open_checkin'])
        self.assertIsNone(res_initial.data['data']['attendance'])

        # 2. After checking in
        self.client.post('/api/attendance/check-in/')
        res_open = self.client.get('/api/attendance/my-status/')
        self.assertEqual(res_open.status_code, status.HTTP_200_OK)
        self.assertTrue(res_open.data['data']['has_open_checkin'])
        self.assertIsNotNone(res_open.data['data']['attendance'])
        self.assertEqual(res_open.data['data']['attendance']['employee'], self.employee.id)

        # 3. After checking out
        self.client.post('/api/attendance/check-out/')
        res_closed = self.client.get('/api/attendance/my-status/')
        self.assertEqual(res_closed.status_code, status.HTTP_200_OK)
        self.assertFalse(res_closed.data['data']['has_open_checkin'])
        self.assertIsNone(res_closed.data['data']['attendance'])

    def test_my_status_user_without_employee(self):
        no_emp_user = User.objects.create_user(username='noempuser', password='Password123!')
        no_emp_user.groups.add(self.emp_group)
        self.client.force_authenticate(user=no_emp_user)
        res = self.client.get('/api/attendance/my-status/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['data']['has_open_checkin'])
        self.assertIsNone(res.data['data']['attendance'])

    def test_date_range_filtering(self):
        now = timezone.now()
        Attendance.objects.create(
            employee=self.employee,
            check_in=now - timedelta(days=10),
            check_out=now - timedelta(days=10, hours=-8),
            status=Attendance.Status.PRESENT
        )
        Attendance.objects.create(
            employee=self.employee,
            check_in=now - timedelta(days=2),
            check_out=now - timedelta(days=2, hours=-8),
            status=Attendance.Status.PRESENT
        )

        date_from = (now - timedelta(days=3)).strftime('%Y-%m-%d')
        date_to = now.strftime('%Y-%m-%d')

        response = self.client.get(f'/api/attendance/?date_from={date_from}&date_to={date_to}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_auto_flagging_and_capping_over_14_hours(self):
        now = timezone.now()
        att = Attendance.objects.create(
            employee=self.employee,
            check_in=now - timedelta(hours=20),
            check_out=now,
            status=Attendance.Status.PRESENT,
            is_manual_correction=False
        )
        self.assertFalse(att.is_manual_correction)
        self.assertIn("Auto-flagged", att.notes)
        self.assertEqual(att.raw_hours, 20.0)
        self.assertEqual(att.worked_hours, 12.0)

    def test_manager_approve_correction_action(self):
        now = timezone.now()
        att = Attendance.objects.create(
            employee=self.employee,
            check_in=now - timedelta(hours=16),
            check_out=now,
            status=Attendance.Status.PRESENT,
            is_manual_correction=False
        )
        self.assertEqual(att.worked_hours, 12.0)

        res = self.client.post(f'/api/attendance/{att.id}/approve-correction/', {
            'notes': 'Approved 16h overnight release shift'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['worked_hours'], 16.0)
        self.assertTrue(res.data['data']['is_manual_correction'])

    def test_employee_role_cannot_approve_correction_returns_403(self):
        emp_user = User.objects.create_user(username='att_emp', password='Password123!')
        emp_user.groups.add(self.emp_group)
        self.client.force_authenticate(user=emp_user)

        now = timezone.now()
        att = Attendance.objects.create(
            employee=self.employee,
            check_in=now - timedelta(hours=10),
            check_out=now,
            status=Attendance.Status.PRESENT
        )
        res = self.client.post(f'/api/attendance/{att.id}/approve-correction/', {'notes': 'Hack'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
