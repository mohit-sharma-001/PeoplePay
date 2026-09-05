from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from payroll.models import SalaryStructure, SalaryRule


class PayrollPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.hr_manager_group, _ = Group.objects.get_or_create(name='HR Manager')
        self.payroll_manager_group, _ = Group.objects.get_or_create(name='HR Payroll Manager')
        self.payroll_user_group, _ = Group.objects.get_or_create(name='HR Payroll User')
        self.employee_group, _ = Group.objects.get_or_create(name='Employee')

        self.admin_user = User.objects.create_user(username='admin_user', password='Password123!')
        self.admin_user.groups.add(self.admin_group)

        self.hr_manager = User.objects.create_user(username='hr_manager', password='Password123!')
        self.hr_manager.groups.add(self.hr_manager_group)

        self.payroll_user = User.objects.create_user(username='payroll_user', password='Password123!')
        self.payroll_user.groups.add(self.payroll_user_group)

        self.employee_user = User.objects.create_user(username='emp_user', password='Password123!')
        self.employee_user.groups.add(self.employee_group)

    def test_hr_manager_cannot_create_salary_structure_returns_403(self):
        self.client.force_authenticate(user=self.hr_manager)
        payload = {"name": "Test Struct", "code": "TST_01", "company_name": "Test Co"}
        response = self.client.post('/api/payroll/structures/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_role_cannot_access_payroll_structures_returns_403(self):
        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get('/api/payroll/structures/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_payroll_user_can_read_but_cannot_create_salary_structure(self):
        self.client.force_authenticate(user=self.payroll_user)
        get_resp = self.client.get('/api/payroll/structures/')
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)

        post_resp = self.client.post('/api/payroll/structures/', {"name": "Test", "code": "TST"}, format='json')
        self.assertEqual(post_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_salary_structure(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {"name": "Executive Structure", "code": "EXEC_STRUCT", "company_name": "PeoplePay"}
        response = self.client.post('/api/payroll/structures/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
