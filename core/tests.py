from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status


class CoreAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_api_root_health(self):
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], "PeoplePay 360 REST API Server is running.")
        self.assertIn("modules", response.data['data'])

    def test_app_index_endpoints(self):
        endpoints = [
            '/api/employees/',
            '/api/contracts/',
            '/api/working-schedule/',
            '/api/attendance/',
            '/api/time-off/',
            '/api/payroll/',
            '/api/dashboard/',
        ]
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Failed at {endpoint}")
            self.assertTrue(response.data['success'], f"Success false at {endpoint}")
