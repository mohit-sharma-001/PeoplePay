from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from employees.models import Employee
from datetime import date


class EmployeeAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.emp_group, _ = Group.objects.get_or_create(name='Employee')

        self.user = User.objects.create_user(
            username='testuser',
            password='Password123!',
            email='testuser@example.com'
        )
        self.user.groups.add(self.admin_group)

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

        search_res = self.client.get('/api/employees/?search=Rajesh')
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_res.data), 1)

        filter_res = self.client.get('/api/employees/?department=Engineering')
        self.assertEqual(filter_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filter_res.data), 1)

    def test_employee_role_sees_only_own_record(self):
        emp_user = User.objects.create_user(username='plain_emp_user', password='Password123!')
        emp_user.groups.add(self.emp_group)
        plain_emp = Employee.objects.create(
            user=emp_user,
            first_name='Sneha',
            last_name='Patel',
            email='sneha@example.com',
            department=Employee.Department.HR,
            job_position='HR Specialist',
            date_joined=date(2023, 5, 1)
        )

        self.client.force_authenticate(user=emp_user)
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], plain_emp.id)

    def test_employee_role_cannot_create_employee_returns_403(self):
        emp_user = User.objects.create_user(username='plain_emp_user2', password='Password123!')
        emp_user.groups.add(self.emp_group)

        self.client.force_authenticate(user=emp_user)
        payload = {
            "first_name": "New",
            "last_name": "Emp",
            "email": "new@example.com",
            "department": "Engineering",
            "job_position": "Dev",
            "date_joined": "2026-01-01"
        }
        response = self.client.post('/api/employees/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
