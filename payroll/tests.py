from datetime import date
from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from payroll.models import SalaryStructure, SalaryRule, Payrun, Payslip, PayslipAdjustment
from employees.models import Employee
from contracts.models import Contract


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


class PayrunTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.hr_manager_group, _ = Group.objects.get_or_create(name='HR Manager')
        self.payroll_manager_group, _ = Group.objects.get_or_create(name='HR Payroll Manager')
        self.payroll_user_group, _ = Group.objects.get_or_create(name='HR Payroll User')

        self.admin_user = User.objects.create_user(username='admin_test', password='Password123!')
        self.admin_user.groups.add(self.admin_group)

        self.hr_manager = User.objects.create_user(username='hrm_test', password='Password123!')
        self.hr_manager.groups.add(self.hr_manager_group)

        self.payroll_manager = User.objects.create_user(username='pm_test', password='Password123!')
        self.payroll_manager.groups.add(self.payroll_manager_group)

        self.payroll_user = User.objects.create_user(username='pu_test', password='Password123!')
        self.payroll_user.groups.add(self.payroll_user_group)

        self.structure = SalaryStructure.objects.create(
            name="Regular Salary",
            code="REG_SAL",
            company_name="PeoplePay"
        )
        SalaryRule.objects.create(
            structure=self.structure,
            name="Basic Monthly Salary",
            code="BASIC",
            category=SalaryRule.Category.BASIC,
            amount_type=SalaryRule.AmountType.FIXED,
            amount=50000.00
        )
        SalaryRule.objects.create(
            structure=self.structure,
            name="House Rent Allowance",
            code="HRA",
            category=SalaryRule.Category.ALLOWANCE,
            amount_type=SalaryRule.AmountType.FIXED,
            amount=20000.00
        )
        SalaryRule.objects.create(
            structure=self.structure,
            name="Provident Fund Deduction",
            code="PF",
            category=SalaryRule.Category.DEDUCTION,
            amount_type=SalaryRule.AmountType.FIXED,
            amount=3600.00
        )

        self.emp1 = Employee.objects.create(
            employee_code="EMP001",
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
            date_joined=date(2026, 1, 1)
        )
        self.contract1 = Contract.objects.create(
            employee=self.emp1,
            wage=70000.00,
            date_start=date(2026, 1, 1),
            state=Contract.State.RUNNING,
            department='Engineering',
            job_position='Developer'
        )

        self.emp2 = Employee.objects.create(
            employee_code="EMP002",
            first_name="Bob",
            last_name="Jones",
            email="bob@example.com",
            date_joined=date(2026, 1, 1)
        )

    def test_create_payrun_with_mixed_contracts(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "structure": self.structure.id,
            "date_from": "2026-09-01",
            "date_to": "2026-09-30",
            "employee_ids": [self.emp1.id, self.emp2.id]
        }
        response = self.client.post('/api/payroll/payruns/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data
        self.assertEqual(data['status'], 'draft')
        self.assertEqual(len(data['payslips']), 2)

        ps1 = next(p for p in data['payslips'] if p['employee'] == self.emp1.id)
        ps2 = next(p for p in data['payslips'] if p['employee'] == self.emp2.id)

        self.assertFalse(ps1['is_excluded'])
        self.assertEqual(ps1['contract'], self.contract1.id)

        self.assertTrue(ps2['is_excluded'])
        self.assertIn("No active contract", ps2['warning'])

    def test_compute_payrun(self):
        self.client.force_authenticate(user=self.payroll_manager)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps1 = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft'
        )

        response = self.client.post(f'/api/payroll/payruns/{payrun.id}/compute/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payrun.refresh_from_db()
        ps1.refresh_from_db()

        self.assertEqual(payrun.status, 'computed')
        self.assertEqual(ps1.status, 'computed')
        self.assertEqual(float(ps1.basic), 50000.0)
        self.assertEqual(float(ps1.gross), 70000.0)
        self.assertEqual(float(ps1.total_deductions), 3600.0)
        self.assertEqual(float(ps1.net), 66400.0)
        self.assertIn('BASIC', ps1.line_items)

    def test_validate_and_mark_paid_lifecycle(self):
        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            status='draft'
        )

        val_resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/validate/')
        self.assertEqual(val_resp.status_code, status.HTTP_400_BAD_REQUEST)

        payrun.status = 'computed'
        payrun.save()

        paid_resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/mark-paid/')
        self.assertEqual(paid_resp.status_code, status.HTTP_400_BAD_REQUEST)

        val_resp2 = self.client.post(f'/api/payroll/payruns/{payrun.id}/validate/')
        self.assertEqual(val_resp2.status_code, status.HTTP_200_OK)
        payrun.refresh_from_db()
        self.assertEqual(payrun.status, 'validated')

        paid_resp2 = self.client.post(f'/api/payroll/payruns/{payrun.id}/mark-paid/')
        self.assertEqual(paid_resp2.status_code, status.HTTP_200_OK)
        payrun.refresh_from_db()
        self.assertEqual(payrun.status, 'paid')

    def test_hr_manager_cannot_create_payrun(self):
        self.client.force_authenticate(user=self.hr_manager)
        payload = {
            "structure": self.structure.id,
            "date_from": "2026-09-01",
            "date_to": "2026-09-30"
        }
        response = self.client.post('/api/payroll/payruns/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_payroll_user_can_create_payrun_but_cannot_delete(self):
        self.client.force_authenticate(user=self.payroll_user)
        payload = {
            "structure": self.structure.id,
            "date_from": "2026-09-01",
            "date_to": "2026-09-30"
        }
        response = self.client.post('/api/payroll/payruns/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        payrun_id = response.data['id']

        # Delete should return 403
        del_resp = self.client.delete(f'/api/payroll/payruns/{payrun_id}/')
        self.assertEqual(del_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_and_delete_adjustment(self):
        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft',
            line_items={'NET': 60000.00},
            net=60000.00
        )

        # Add adjustment
        add_resp = self.client.post(
            f'/api/payroll/payslips/{ps.id}/add-adjustment/',
            {"label": "Festival Incentive", "amount": 5000},
            format='json'
        )
        self.assertEqual(add_resp.status_code, status.HTTP_201_CREATED)
        ps.refresh_from_db()
        self.assertEqual(float(ps.net), 65000.0)

        # Delete adjustment
        adj_id = add_resp.data['adjustments'][0]['id']
        del_resp = self.client.delete(f'/api/payroll/payslips/{ps.id}/adjustments/{adj_id}/')
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)
        ps.refresh_from_db()
        self.assertEqual(float(ps.net), 60000.0)

    def test_add_adjustment_to_validated_payslip_returns_400(self):
        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            status='validated'
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='validated',
            net=60000.00
        )

        resp = self.client.post(
            f'/api/payroll/payslips/{ps.id}/add-adjustment/',
            {"label": "Overtime", "amount": 2000},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_hr_manager_adjustment_returns_403(self):
        self.client.force_authenticate(user=self.hr_manager)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft'
        )

        resp = self.client.post(
            f'/api/payroll/payslips/{ps.id}/add-adjustment/',
            {"label": "Overtime", "amount": 2000},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_download_payslip_pdf_returns_200(self):
        self.client.force_authenticate(user=self.payroll_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='computed',
            line_items={'BASIC': 50000, 'NET': 50000},
            net=50000.00
        )

        resp = self.client.get(f'/api/payroll/payslips/{ps.id}/pdf/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertGreater(len(resp.content), 1000)

    def test_proration_no_working_schedule_not_penalized(self):
        self.client.force_authenticate(user=self.admin_user)
        self.emp1.working_schedule = None
        self.emp1.save()

        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft'
        )

        resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/compute/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ps.refresh_from_db()

        self.assertEqual(float(ps.worked_percentage), 1.0)
        self.assertIn('CONTRACT_WAGE', ps.line_items)

    def test_proration_zero_attendance_warning(self):
        from working_schedule.models import WorkingSchedule, WorkingScheduleLine
        ws = WorkingSchedule.objects.create(name="Standard 40h")
        WorkingScheduleLine.objects.create(schedule=ws, day_of_week=0, start_time="09:00", end_time="17:00")

        self.emp1.working_schedule = ws
        self.emp1.save()

        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft'
        )

        resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/compute/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ps.refresh_from_db()

        self.assertEqual(float(ps.worked_percentage), 0.0)
        self.assertEqual(ps.warning, "No attendance recorded for this period")
        self.assertFalse(ps.is_excluded)

    def test_proration_partial_attendance(self):
        from working_schedule.models import WorkingSchedule, WorkingScheduleLine
        from attendance.models import Attendance
        from datetime import datetime, timezone

        ws = WorkingSchedule.objects.create(name="Standard 40h")
        WorkingScheduleLine.objects.create(schedule=ws, day_of_week=0, start_time="09:00", end_time="17:00") # 8h per day, 8h weekly

        self.emp1.working_schedule = ws
        self.emp1.save()

        # Expected hours for 30 days = (8 / 7) * 30 = 34.29 hrs
        # Create 1 attendance record of 17.145 hrs (50% worked)
        Attendance.objects.create(
            employee=self.emp1,
            check_in=datetime(2026, 9, 5, 8, 0, tzinfo=timezone.utc),
            check_out=datetime(2026, 9, 6, 1, 9, tzinfo=timezone.utc), # 17.15 hrs
            status=Attendance.Status.PRESENT
        )

        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft'
        )

        resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/compute/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ps.refresh_from_db()

        self.assertEqual(round(float(ps.worked_percentage), 2), 0.35)
        self.assertLessEqual(float(ps.worked_percentage), 1.0)

    def test_patch_draft_payrun_syncs_employees(self):
        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            status='draft'
        )
        Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft'
        )

        resp = self.client.patch(
            f'/api/payroll/payruns/{payrun.id}/',
            {"employee_ids": [self.emp1.id, self.emp2.id]},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payrun.refresh_from_db()
        self.assertEqual(payrun.payslips.count(), 2)

    def test_proration_contract_working_schedule_priority(self):
        from working_schedule.models import WorkingSchedule, WorkingScheduleLine
        ws_emp = WorkingSchedule.objects.create(name="Emp 20h")
        WorkingScheduleLine.objects.create(schedule=ws_emp, day_of_week=0, start_time="09:00", end_time="13:00") # 4h

        ws_contract = WorkingSchedule.objects.create(name="Contract 40h")
        WorkingScheduleLine.objects.create(schedule=ws_contract, day_of_week=0, start_time="09:00", end_time="17:00") # 8h

        self.emp1.working_schedule = ws_emp
        self.emp1.save()

        self.contract1.working_schedule = ws_contract
        self.contract1.save()

        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30)
        )
        ps = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='draft'
        )

        resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/compute/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ps.refresh_from_db()

        # Contract has 8h total weekly hours; 30 days => expected_hours = (8 / 7) * 30 ~ 34.29
        self.assertAlmostEqual(float(ps.expected_hours), (8.0 / 7.0) * 30.0, places=2)


class SalaryRuleSequencingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.admin_user = User.objects.create_user(username='admin_seq_test', password='Password123!')
        self.admin_user.groups.add(self.admin_group)

        self.structure = SalaryStructure.objects.create(
            name="Sequencing Test Structure",
            code="SEQ_STRUCT",
            company_name="PeoplePay"
        )

    def test_auto_sequence_assignment(self):
        self.client.force_authenticate(user=self.admin_user)

        r1 = self.client.post('/api/payroll/rules/', {
            "structure": self.structure.id,
            "name": "Rule 1",
            "code": "R1",
            "category": "basic",
            "amount_type": "fixed",
            "amount": 1000
        }, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r1.data['sequence'], 10)

        r2 = self.client.post('/api/payroll/rules/', {
            "structure": self.structure.id,
            "name": "Rule 2",
            "code": "R2",
            "category": "allowance",
            "amount_type": "fixed",
            "amount": 500
        }, format='json')
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.data['sequence'], 20)

        r3 = self.client.post('/api/payroll/rules/', {
            "structure": self.structure.id,
            "name": "Rule 3",
            "code": "R3",
            "category": "deduction",
            "amount_type": "fixed",
            "amount": 200
        }, format='json')
        self.assertEqual(r3.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r3.data['sequence'], 30)

    def test_explicit_sequence_override(self):
        self.client.force_authenticate(user=self.admin_user)

        r1 = self.client.post('/api/payroll/rules/', {
            "structure": self.structure.id,
            "sequence": 5,
            "name": "Rule Custom",
            "code": "RCUST",
            "category": "basic",
            "amount_type": "fixed",
            "amount": 1000
        }, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r1.data['sequence'], 5)

    def test_delete_rule_renormalizes_sequences(self):
        self.client.force_authenticate(user=self.admin_user)

        r1 = SalaryRule.objects.create(structure=self.structure, name="R1", code="R1", sequence=10)
        r2 = SalaryRule.objects.create(structure=self.structure, name="R2", code="R2", sequence=20)
        r3 = SalaryRule.objects.create(structure=self.structure, name="R3", code="R3", sequence=30)

        del_resp = self.client.delete(f'/api/payroll/rules/{r2.id}/')
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

        r1.refresh_from_db()
        r3.refresh_from_db()

        self.assertEqual(r1.sequence, 10)
        self.assertEqual(r3.sequence, 20)

    def test_renormalization_4_rules_delete_middle(self):
        r1 = SalaryRule.objects.create(structure=self.structure, name="R1", code="R1", sequence=10)
        r2 = SalaryRule.objects.create(structure=self.structure, name="R2", code="R2", sequence=20)
        r3 = SalaryRule.objects.create(structure=self.structure, name="R3", code="R3", sequence=30)
        r4 = SalaryRule.objects.create(structure=self.structure, name="R4", code="R4", sequence=40)

        # Delete r2 (sequence=20)
        r2.delete()

        r1.refresh_from_db()
        r3.refresh_from_db()
        r4.refresh_from_db()

        self.assertEqual(r1.sequence, 10)
        self.assertEqual(r3.sequence, 20)
        self.assertEqual(r4.sequence, 30)

    def test_renormalization_4_rules_delete_first(self):
        r1 = SalaryRule.objects.create(structure=self.structure, name="R1", code="R1", sequence=10)
        r2 = SalaryRule.objects.create(structure=self.structure, name="R2", code="R2", sequence=20)
        r3 = SalaryRule.objects.create(structure=self.structure, name="R3", code="R3", sequence=30)
        r4 = SalaryRule.objects.create(structure=self.structure, name="R4", code="R4", sequence=40)

        # Delete r1 (sequence=10)
        r1.delete()

        r2.refresh_from_db()
        r3.refresh_from_db()
        r4.refresh_from_db()

        self.assertEqual(r2.sequence, 10)
        self.assertEqual(r3.sequence, 20)
        self.assertEqual(r4.sequence, 30)

    def test_renormalization_4_rules_delete_last(self):
        r1 = SalaryRule.objects.create(structure=self.structure, name="R1", code="R1", sequence=10)
        r2 = SalaryRule.objects.create(structure=self.structure, name="R2", code="R2", sequence=20)
        r3 = SalaryRule.objects.create(structure=self.structure, name="R3", code="R3", sequence=30)
        r4 = SalaryRule.objects.create(structure=self.structure, name="R4", code="R4", sequence=40)

        # Delete r4 (sequence=40)
        r4.delete()

        r1.refresh_from_db()
        r2.refresh_from_db()
        r3.refresh_from_db()

        self.assertEqual(r1.sequence, 10)
        self.assertEqual(r2.sequence, 20)
        self.assertEqual(r3.sequence, 30)


class PayrollReportsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_group, _ = Group.objects.get_or_create(name='Admin')
        self.employee_group, _ = Group.objects.get_or_create(name='Employee')

        self.admin_user = User.objects.create_user(username='admin_report_test', password='Password123!')
        self.admin_user.groups.add(self.admin_group)

        self.emp_user = User.objects.create_user(username='emp_report_test', password='Password123!')
        self.emp_user.groups.add(self.employee_group)

        self.structure = SalaryStructure.objects.create(name="Report Struct", code="REP_STRUCT")

        self.emp = Employee.objects.create(
            employee_code="EMP100",
            first_name="Jane",
            last_name="Doe",
            department="Engineering",
            date_joined=date(2026, 1, 1)
        )
        self.contract = Contract.objects.create(
            employee=self.emp,
            wage=60000.00,
            date_start=date(2026, 1, 1),
            state=Contract.State.RUNNING,
            department='Engineering',
            job_position='Software Engineer'
        )

        self.payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            status='computed'
        )
        self.payslip = Payslip.objects.create(
            payrun=self.payrun,
            employee=self.emp,
            contract=self.contract,
            basic=40000.00,
            gross=60000.00,
            total_deductions=5000.00,
            net=55000.00,
            status='computed'
        )
        PayslipAdjustment.objects.create(
            payslip=self.payslip,
            label="Overtime Pay",
            amount=2000.00
        )

        from time_off.models import TimeOffType, TimeOffAllocation
        self.pto_type = TimeOffType.objects.create(name="Paid Annual Leave", requires_allocation=True)
        TimeOffAllocation.objects.create(
            employee=self.emp,
            time_off_type=self.pto_type,
            allocated_amount=20,
            valid_from=date(2026, 1, 1),
            state='confirmed'
        )

    def test_payroll_cost_report_json_and_csv(self):
        self.client.force_authenticate(user=self.admin_user)

        # JSON response
        res_json = self.client.get('/api/reports/payroll-cost/', {'month': '2026-09'})
        self.assertEqual(res_json.status_code, status.HTTP_200_OK)
        self.assertTrue(res_json.data['success'])
        self.assertIn('departments', res_json.data['data'])
        self.assertIn('summary', res_json.data['data'])
        depts = res_json.data['data']['departments']
        self.assertTrue(len(depts) >= 1)
        eng_dept = next(d for d in depts if d['department'] == 'Engineering')
        self.assertEqual(eng_dept['headcount'], 1)
        self.assertEqual(float(eng_dept['total_overtime']), 2000.0)

        # CSV response
        res_csv = self.client.get('/api/reports/payroll-cost/', {'month': '2026-09', 'format': 'csv'})
        self.assertEqual(res_csv.status_code, status.HTTP_200_OK)
        self.assertEqual(res_csv['Content-Type'], 'text/csv')
        content = res_csv.content.decode('utf-8')
        self.assertIn('Department,Headcount', content)
        self.assertIn('Engineering,1', content)

    def test_leave_liability_report_json_and_csv(self):
        self.client.force_authenticate(user=self.admin_user)

        # JSON response
        res_json = self.client.get('/api/reports/leave-liability/')
        self.assertEqual(res_json.status_code, status.HTTP_200_OK)
        self.assertTrue(res_json.data['success'])
        data = res_json.data['data']
        self.assertIn('leave_balances', data)
        self.assertIn('utilization_trend', data)
        self.assertIn('total_liability', data)
        lb = next(item for item in data['leave_balances'] if item['employee_code'] == 'EMP100')
        self.assertEqual(lb['remaining_amount'], 20.0)
        # Daily rate = 60000 / 30 = 2000.0 => liability = 20 * 2000 = 40000.0
        self.assertEqual(float(lb['daily_rate']), 2000.0)
        self.assertEqual(float(lb['liability_valuation']), 40000.0)

        # CSV response
        res_csv = self.client.get('/api/reports/leave-liability/', {'format': 'csv'})
        self.assertEqual(res_csv.status_code, status.HTTP_200_OK)
        self.assertEqual(res_csv['Content-Type'], 'text/csv')
        content = res_csv.content.decode('utf-8')
        self.assertIn('Employee Code,Employee Name,Department', content)
        self.assertIn('EMP100,Jane Doe,Engineering', content)

    def test_full_ledger_report_csv(self):
        self.client.force_authenticate(user=self.admin_user)

        res_csv = self.client.get('/api/reports/full-ledger/', {'format': 'csv'})
        self.assertEqual(res_csv.status_code, status.HTTP_200_OK)
        self.assertEqual(res_csv['Content-Type'], 'text/csv')
        content = res_csv.content.decode('utf-8')
        self.assertIn('Payslip ID,Employee Code,Employee Name', content)
        self.assertIn('EMP100', content)

    def test_unauthorized_user_gets_403(self):
        self.client.force_authenticate(user=self.emp_user)

        res1 = self.client.get('/api/reports/payroll-cost/')
        self.assertEqual(res1.status_code, status.HTTP_403_FORBIDDEN)

        res2 = self.client.get('/api/reports/leave-liability/')
        self.assertEqual(res2.status_code, status.HTTP_403_FORBIDDEN)

        res3 = self.client.get('/api/reports/full-ledger/', {'format': 'csv'})
        self.assertEqual(res3.status_code, status.HTTP_403_FORBIDDEN)


class BulkSendPayslipsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(username='admin_mail', password='password123')

        admin_grp, _ = Group.objects.get_or_create(name='Admin')
        self.admin_user.groups.add(admin_grp)

        self.emp_user = User.objects.create_user(username='emp_mail', password='password123')
        emp_grp, _ = Group.objects.get_or_create(name='Employee')
        self.emp_user.groups.add(emp_grp)

        self.payroll_mgr = User.objects.create_user(username='pm_mail', password='password123')
        pm_grp, _ = Group.objects.get_or_create(name='HR Payroll Manager')
        self.payroll_mgr.groups.add(pm_grp)

        self.structure = SalaryStructure.objects.create(name='Standard Structure', code='STD_MAIL')
        self.emp1 = Employee.objects.create(
            employee_code='EMP100',
            first_name='Jane',
            last_name='Doe',
            email='jane.doe@example.com',
            date_joined=date(2024, 1, 1),
            department='Engineering'
        )
        self.contract1 = Contract.objects.create(
            employee=self.emp1,
            wage=60000.00,
            date_start=date(2024, 1, 1),
            state='running',
            department='Engineering',
            job_position='Engineer'
        )

    def test_send_payslips_bulk_email_delivery(self):
        from django.core import mail
        mail.outbox = []

        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            status='computed'
        )

        ps1 = Payslip.objects.create(
            payrun=payrun,
            employee=self.emp1,
            contract=self.contract1,
            status='computed',
            is_excluded=False,
            net=45000.00
        )

        # Emp 2 without email
        emp2 = Employee.objects.create(
            employee_code="EMP101",
            first_name="NoEmail",
            last_name="User",
            email="",
            date_joined=date(2024, 1, 1),
            department="HR"
        )
        ps2 = Payslip.objects.create(
            payrun=payrun,
            employee=emp2,
            status='computed',
            is_excluded=False,
            net=35000.00
        )

        # Excluded payslip
        emp3 = Employee.objects.create(
            employee_code="EMP102",
            first_name="Excluded",
            last_name="User",
            email="excluded@example.com",
            date_joined=date(2024, 1, 1),
            department="Sales"
        )
        ps3 = Payslip.objects.create(
            payrun=payrun,
            employee=emp3,
            status='computed',
            is_excluded=True,
            net=0.00
        )

        resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/send-payslips/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data['data']
        self.assertEqual(data['sent'], 1)
        self.assertEqual(data['skipped'], 2)
        self.assertIn("EMP101 - no email", data['skipped_employees'])
        self.assertIn("EMP102 - excluded", data['skipped_employees'])

        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, ["jane.doe@example.com"])
        self.assertIn("Your Payslip for 2026-09-01 to 2026-09-30", sent_email.subject)
        self.assertIn("Jane Doe", sent_email.body)
        self.assertIn("₹45,000.00", sent_email.body)
        self.assertEqual(len(sent_email.attachments), 1)
        att_name, att_content, att_mime = sent_email.attachments[0]
        self.assertEqual(att_mime, 'application/pdf')
        self.assertGreater(len(att_content), 500)

    def test_send_payslips_draft_payrun_returns_400(self):
        self.client.force_authenticate(user=self.admin_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            status='draft'
        )
        resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/send-payslips/')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_send_payslips_unauthorized_role_returns_403(self):
        self.client.force_authenticate(user=self.emp_user)
        payrun = Payrun.objects.create(
            structure=self.structure,
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            status='computed'
        )
        resp = self.client.post(f'/api/payroll/payruns/{payrun.id}/send-payslips/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)







