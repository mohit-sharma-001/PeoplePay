from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from employees.models import Employee
from datetime import date


class EmployeeAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test group & user
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.user = User.objects.create_user(
            username='testuser',
            password='Password123!',
            email='testuser@example.com'
        )
        self.user.groups.add(self.admin_group)

        # Create test employee
        self.employee = Employee.objects.create(
            user=self.user,
            first_name='Rajesh',
            last_name='Sharma',
            email='rajesh@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Software Director',
            date_joined=date(2023, 1, 1),
            status=Employee.Status.ACTIVE
        )

    def test_employee_code_auto_generation(self):
        self.assertTrue(self.employee.employee_code.startswith('EMP'))
        emp2 = Employee.objects.create(
            first_name='Sneha',
            last_name='Patel',
            email='sneha@example.com',
            department=Employee.Department.HR,
            job_position='HR Specialist',
            date_joined=date(2023, 5, 1)
        )
        self.assertNotEqual(self.employee.employee_code, emp2.employee_code)

    def test_login_endpoint(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'Password123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data['data'])
        self.assertEqual(response.data['data']['user']['username'], 'testuser')

    def test_employee_list_authenticated(self):
        # Obtain token
        login_res = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'Password123!'
        }, format='json')
        token = login_res.data['data']['token']

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_employee_search_and_filter(self):
        login_res = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'Password123!'
        }, format='json')
        token = login_res.data['data']['token']
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)

        # Test search
        search_res = self.client.get('/api/employees/?search=Rajesh')
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_res.data), 1)

        # Test department filter
        filter_res = self.client.get('/api/employees/?department=Engineering')
        self.assertEqual(filter_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filter_res.data), 1)
