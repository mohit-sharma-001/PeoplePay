from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status


class CoreAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.user = User.objects.create_user(
            username='coretestuser',
            password='Password123!'
        )
        self.user.groups.add(self.admin_group)

    def test_api_root_health(self):
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], "PeoplePay 360 REST API Server is running.")
        self.assertIn("modules", response.data['data'])

    def test_app_index_endpoints(self):
        self.client.force_authenticate(user=self.user)
        endpoints = [
            '/api/employees/',
            '/api/contracts/',
            '/api/working-schedule/',
            '/api/attendance/',
            '/api/time-off/types/',
            '/api/payroll/structures/',
            '/api/dashboard/',
        ]
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Failed at {endpoint}")
