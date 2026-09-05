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
        self.hr_group, _ = Group.objects.get_or_create(name='HR Manager')


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

    def test_create_login_already_has_user_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/employees/{self.employee.id}/create-login/',
            {'username': 'newlogin', 'password': 'Password123!'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], "This employee already has a login account.")

    def test_create_login_non_admin_hr_returns_403(self):
        emp_no_user = Employee.objects.create(
            first_name='Unlinked',
            last_name='Employee',
            email='unlinked@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Software Engineer',
            date_joined=date(2026, 1, 1)
        )
        plain_emp_user = User.objects.create_user(username='plainuser_login', password='Password123!')
        plain_emp_user.groups.add(self.emp_group)

        self.client.force_authenticate(user=plain_emp_user)
        response = self.client.post(
            f'/api/employees/{emp_no_user.id}/create-login/',
            {'username': 'newlogin2', 'password': 'Password123!'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_login_success(self):
        emp_no_user = Employee.objects.create(
            first_name='Unlinked2',
            last_name='Employee2',
            email='unlinked2@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='DevOps Specialist',
            date_joined=date(2026, 1, 1)
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/employees/{emp_no_user.id}/create-login/',
            {'username': 'newlogin3', 'password': 'Password123!'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['username'], 'newlogin3')
        self.assertIn('Employee', response.data['roles'])
        self.assertNotIn('password', response.data)

        emp_no_user.refresh_from_db()
        self.assertIsNotNone(emp_no_user.user)
        self.assertEqual(emp_no_user.user.username, 'newlogin3')
        self.assertTrue(emp_no_user.user.check_password('Password123!'))
        self.assertTrue(emp_no_user.user.groups.filter(name='Employee').exists())

    def test_admin_create_login_custom_role_succeeds(self):
        emp_no_user = Employee.objects.create(
            first_name='AdminRole',
            last_name='User',
            email='adminrole@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Payroll Lead',
            date_joined=date(2026, 1, 1)
        )
        self.client.force_authenticate(user=self.user)  # Admin user
        response = self.client.post(
            f'/api/employees/{emp_no_user.id}/create-login/',
            {'username': 'payroll_lead', 'password': 'Password123!', 'roles': ['HR Payroll Manager']},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['roles'], ['HR Payroll Manager'])

    def test_hr_manager_create_login_custom_role_forced_to_employee(self):
        hr_user = User.objects.create_user(username='hr_user_role', password='Password123!')
        hr_user.groups.add(self.hr_group)

        emp_no_user = Employee.objects.create(
            first_name='HRRole',
            last_name='Target',
            email='hrtarget@example.com',
            department=Employee.Department.HR,
            job_position='Recruiter',
            date_joined=date(2026, 1, 1)
        )
        self.client.force_authenticate(user=hr_user)
        response = self.client.post(
            f'/api/employees/{emp_no_user.id}/create-login/',
            {'username': 'recruiter_user', 'password': 'Password123!', 'roles': ['Admin']},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['roles'], ['Employee'])

    def test_create_login_invalid_role_returns_400(self):
        emp_no_user = Employee.objects.create(
            first_name='InvalidRole',
            last_name='Target',
            email='invalidrole@example.com',
            department=Employee.Department.ENGINEERING,
            job_position='Dev',
            date_joined=date(2026, 1, 1)
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/employees/{emp_no_user.id}/create-login/',
            {'username': 'invalid_role_user', 'password': 'Password123!', 'roles': ['SuperAdminRole']},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('roles', response.data)


