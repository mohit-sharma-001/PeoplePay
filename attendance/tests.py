from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, date
from employees.models import Employee
from attendance.models import Attendance


class AttendanceAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='attuser', password='Password123!')
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
        # 1. Test live check-in
        res_in = self.client.post('/api/attendance/check-in/')
        self.assertEqual(res_in.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_in.data['data']['status'], 'present')
        self.assertIsNone(res_in.data['data']['check_out'])

        # 2. Test duplicate check-in when open check-in exists -> 400 Error
        res_dup = self.client.post('/api/attendance/check-in/')
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Test live check-out
        res_out = self.client.post('/api/attendance/check-out/')
        self.assertEqual(res_out.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res_out.data['data']['check_out'])

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
        # 20 hours shift without manual correction
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
        self.assertEqual(att.worked_hours, 12.0)  # Capped at 12.0 until Manager approval

    def test_manager_approve_correction_action(self):
        now = timezone.now()
        att = Attendance.objects.create(
            employee=self.employee,
            check_in=now - timedelta(hours=16),
            check_out=now,
            status=Attendance.Status.PRESENT,
            is_manual_correction=False
        )
        # Initially capped at 12.0
        self.assertEqual(att.worked_hours, 12.0)

        # Manager approves overtime
        res = self.client.post(f'/api/attendance/{att.id}/approve-correction/', {
            'notes': 'Approved 16h overnight release shift'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['worked_hours'], 16.0)  # Full 16.0 hours approved!
        self.assertTrue(res.data['data']['is_manual_correction'])

