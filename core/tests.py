from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from employees.models import Employee


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


class AuthEndpointsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.employee_group, _ = Group.objects.get_or_create(name='Employee')
        self.hr_manager_group, _ = Group.objects.get_or_create(name='HR Manager')

        self.admin_user = User.objects.create_user(
            username='admin_auth_test',
            password='Password123!',
            email='admin_test@example.com'
        )
        self.admin_user.groups.add(self.admin_group)

        self.employee_user = User.objects.create_user(
            username='emp_auth_test',
            password='Password123!',
            email='emp_test@example.com'
        )
        self.employee_user.groups.add(self.employee_group)

    def test_public_registration_assigns_only_employee_role(self):
        """
        Unauthenticated request to /api/auth/register/ succeeds and new user ends up
        ONLY in the 'Employee' group even if other role data is submitted.
        """
        payload = {
            "username": "newselfreg",
            "password": "Password123!",
            "email": "newselfreg@example.com",
            "first_name": "New",
            "last_name": "User",
            "roles": ["Admin", "HR Manager"],  # Privilege escalation attempt
            "department": "Engineering",
            "job_position": "Backend Engineer"
        }
        response = self.client.post('/api/auth/register/', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("data", response.data)
        self.assertIn("token", response.data["data"])

        # Check DB user and groups
        user = User.objects.get(username="newselfreg")
        user_roles = list(user.groups.values_list('name', flat=True))
        self.assertEqual(user_roles, ['Employee'])
        self.assertNotIn('Admin', user_roles)
        self.assertNotIn('HR Manager', user_roles)

        # Check linked Employee record
        self.assertTrue(hasattr(user, 'employee_profile'))
        self.assertEqual(user.employee_profile.email, "newselfreg@example.com")

    def test_non_admin_gets_403_on_user_list_and_role_assign(self):
        """
        A non-Admin user gets 403 Forbidden on GET /api/auth/users/ and PATCH /api/auth/users/{id}/assign-role/.
        """
        self.client.force_authenticate(user=self.employee_user)

        # GET /api/auth/users/
        get_res = self.client.get('/api/auth/users/')
        self.assertEqual(get_res.status_code, status.HTTP_403_FORBIDDEN)

        # PATCH /api/auth/users/{id}/assign-role/
        patch_res = self.client.patch(
            f'/api/auth/users/{self.employee_user.id}/assign-role/',
            data={"roles": ["HR Manager"]},
            format='json'
        )
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_user_listing_and_role_reassignment(self):
        """
        An Admin user can list users and reassign a user's role, completely replacing
        the previous role.
        """
        self.client.force_authenticate(user=self.admin_user)

        # List all users
        list_res = self.client.get('/api/auth/users/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(list_res.data['data']) >= 2)

        # Filter by ?role=Employee
        filter_res = self.client.get('/api/auth/users/?role=Employee')
        self.assertEqual(filter_res.status_code, status.HTTP_200_OK)
        user_ids = [u['id'] for u in filter_res.data['data']]
        self.assertIn(self.employee_user.id, user_ids)

        # Reassign role of employee_user from ['Employee'] to ['HR Manager']
        reassign_res = self.client.patch(
            f'/api/auth/users/{self.employee_user.id}/assign-role/',
            data={"roles": ["HR Manager"]},
            format='json'
        )
        self.assertEqual(reassign_res.status_code, status.HTTP_200_OK)
        self.assertEqual(reassign_res.data['data']['roles'], ['HR Manager'])

        # Verify DB group state
        self.employee_user.refresh_from_db()
        roles = list(self.employee_user.groups.values_list('name', flat=True))
        self.assertEqual(roles, ['HR Manager'])
        self.assertNotIn('Employee', roles)

    def test_register_auto_creates_timeoff_allocations(self):
        from time_off.models import TimeOffType, TimeOffAllocation

        pto_type, _ = TimeOffType.objects.get_or_create(
            name="Paid Time Off",
            defaults={"requires_allocation": True, "is_paid": True, "requires_approval": True}
        )
        sick_type, _ = TimeOffType.objects.get_or_create(
            name="Sick Leave",
            defaults={"requires_allocation": True, "is_paid": True, "requires_approval": True}
        )

        payload = {
            "username": "autoallocuser",
            "password": "Password123!",
            "email": "autoalloc@example.com",
            "first_name": "Auto",
            "last_name": "Alloc",
            "department": "Engineering",
            "job_position": "Developer"
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        emp_id = res.data['data']['user']['employee_id']
        allocations = TimeOffAllocation.objects.filter(employee_id=emp_id)
        self.assertGreaterEqual(allocations.count(), 2)

        type_names = set(allocations.values_list('time_off_type__name', flat=True))
        self.assertIn("Paid Time Off", type_names)
        self.assertIn("Sick Leave", type_names)

    def test_list_users_filter_by_employee_id(self):
        self.client.force_authenticate(user=self.admin_user)
        emp = Employee.objects.create(
            user=self.employee_user,
            first_name="Emp",
            last_name="Test",
            email="emp_test@example.com",
            department="Engineering",
            job_position="Developer",
            date_joined="2026-01-01"
        )
        filter_res = self.client.get(f'/api/auth/users/?employee_id={emp.id}')
        self.assertEqual(filter_res.status_code, status.HTTP_200_OK)
        data = filter_res.data['data']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.employee_user.id)



