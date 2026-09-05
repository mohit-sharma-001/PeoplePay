from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import time
from working_schedule.models import WorkingSchedule, WorkingScheduleLine


class WorkingScheduleAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='scheduser', password='Password123!')
        self.client.force_authenticate(user=self.user)

    def test_total_weekly_hours_computation(self):
        sched = WorkingSchedule.objects.create(name='Test 40h', schedule_type='fixed')
        # 5 days, 9am to 5pm (8 hrs) with 0 break = 40.0 hours
        for day in range(5):
            WorkingScheduleLine.objects.create(
                schedule=sched,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                break_minutes=0
            )
        self.assertEqual(sched.total_weekly_hours, 40.0)

    def test_working_schedule_api_nested_create(self):
        payload = {
            "name": "API Flex Shift",
            "schedule_type": "flexible",
            "company_name": "Acme Corp",
            "lines": [
                {
                    "day_of_week": 0,
                    "start_time": "09:00:00",
                    "end_time": "17:00:00",
                    "break_minutes": 60
                },
                {
                    "day_of_week": 1,
                    "start_time": "09:00:00",
                    "end_time": "17:00:00",
                    "break_minutes": 60
                }
            ]
        }
        response = self.client.post('/api/working-schedule/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "API Flex Shift")
        self.assertEqual(len(response.data['lines']), 2)
        self.assertEqual(response.data['total_weekly_hours'], 14.0)
