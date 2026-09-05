import csv
import io
from datetime import date, datetime, timedelta
from calendar import monthrange
from decimal import Decimal

from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer, BaseRenderer
from rest_framework import status

from payroll.models import Payrun, Payslip, PayslipAdjustment, SalaryRule
from employees.models import Employee
from contracts.models import Contract
from time_off.models import TimeOffAllocation, TimeOffType, TimeOffRequest


class PassthroughCSVRenderer(BaseRenderer):
    media_type = 'text/csv'
    format = 'csv'
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


ALLOWED_REPORT_ROLES = {'Admin', 'HR Payroll Manager', 'HR Payroll User'}


def check_report_permission(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    user_groups = set(user.groups.values_list('name', flat=True))
    return bool(user_groups.intersection(ALLOWED_REPORT_ROLES))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer, PassthroughCSVRenderer])
def payroll_cost_report(request, format=None):
    if not check_report_permission(request.user):
        return Response({"error": "You do not have permission to view payroll reports."}, status=status.HTTP_403_FORBIDDEN)

    month_str = request.query_params.get('month')
    date_from_str = request.query_params.get('date_from')
    date_to_str = request.query_params.get('date_to')

    today = date.today()

    if month_str:
        try:
            year, m = map(int, month_str.split('-'))
            _, last_day = monthrange(year, m)
            dt_from = date(year, m, 1)
            dt_to = date(year, m, last_day)
        except Exception:
            dt_from = date(today.year, today.month, 1)
            _, last_day = monthrange(today.year, today.month)
            dt_to = date(today.year, today.month, last_day)
            month_str = today.strftime('%Y-%m')
    elif date_from_str and date_to_str:
        try:
            dt_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
            dt_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
            month_str = f"{dt_from.strftime('%Y-%m')}"
        except Exception:
            dt_from = date(today.year, today.month, 1)
            _, last_day = monthrange(today.year, today.month)
            dt_to = date(today.year, today.month, last_day)
            month_str = today.strftime('%Y-%m')
    else:
        dt_from = date(today.year, today.month, 1)
        _, last_day = monthrange(today.year, today.month)
        dt_to = date(today.year, today.month, last_day)
        month_str = today.strftime('%Y-%m')

    payslips = Payslip.objects.filter(
        payrun__date_from__lte=dt_to,
        payrun__date_to__gte=dt_from
    ).select_related('employee', 'payrun').prefetch_related('adjustments')

    dept_map = {}

    for ps in payslips:
        emp = ps.employee
        dept = (emp.department or 'Unassigned').strip() if emp else 'Unassigned'

        if dept not in dept_map:
            dept_map[dept] = {
                'department': dept,
                'employee_ids': set(),
                'total_basic': 0.0,
                'total_allowances': 0.0,
                'total_overtime': 0.0,
                'total_deductions': 0.0,
                'total_net': 0.0,
            }

        if emp:
            dept_map[dept]['employee_ids'].add(emp.id)

        basic_val = float(ps.basic)
        gross_val = float(ps.gross)
        allowance_val = max(0.0, gross_val - basic_val)
        deduction_val = float(ps.total_deductions)
        net_val = float(ps.net)

        overtime_val = 0.0
        for adj in ps.adjustments.all():
            if 'overtime' in adj.label.lower():
                overtime_val += float(adj.amount)

        dept_map[dept]['total_basic'] += basic_val
        dept_map[dept]['total_allowances'] += allowance_val
        dept_map[dept]['total_overtime'] += overtime_val
        dept_map[dept]['total_deductions'] += deduction_val
        dept_map[dept]['total_net'] += net_val

    departments_list = []
    summary = {
        'total_headcount': 0,
        'total_basic': 0.0,
        'total_allowances': 0.0,
        'total_overtime': 0.0,
        'total_deductions': 0.0,
        'total_net': 0.0,
    }

    for dept_name, d_data in sorted(dept_map.items()):
        hc = len(d_data['employee_ids'])
        item = {
            'department': dept_name,
            'headcount': hc,
            'total_basic': round(d_data['total_basic'], 2),
            'total_allowances': round(d_data['total_allowances'], 2),
            'total_overtime': round(d_data['total_overtime'], 2),
            'total_deductions': round(d_data['total_deductions'], 2),
            'total_net': round(d_data['total_net'], 2),
        }
        departments_list.append(item)

        summary['total_headcount'] += hc
        summary['total_basic'] += item['total_basic']
        summary['total_allowances'] += item['total_allowances']
        summary['total_overtime'] += item['total_overtime']
        summary['total_deductions'] += item['total_deductions']
        summary['total_net'] += item['total_net']

    summary['total_basic'] = round(summary['total_basic'], 2)
    summary['total_allowances'] = round(summary['total_allowances'], 2)
    summary['total_overtime'] = round(summary['total_overtime'], 2)
    summary['total_deductions'] = round(summary['total_deductions'], 2)
    summary['total_net'] = round(summary['total_net'], 2)

    fmt = request.query_params.get('format', '').lower()
    if fmt == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="payroll_cost_report_{month_str}.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'Department', 'Headcount', 'Total Basic (₹)', 'Total Allowances (₹)',
            'Total Overtime (₹)', 'Total Deductions (₹)', 'Total Net Paid (₹)'
        ])
        for dept in departments_list:
            writer.writerow([
                dept['department'],
                dept['headcount'],
                f"{dept['total_basic']:.2f}",
                f"{dept['total_allowances']:.2f}",
                f"{dept['total_overtime']:.2f}",
                f"{dept['total_deductions']:.2f}",
                f"{dept['total_net']:.2f}",
            ])
        writer.writerow([])
        writer.writerow([
            'Summary / Total',
            summary['total_headcount'],
            f"{summary['total_basic']:.2f}",
            f"{summary['total_allowances']:.2f}",
            f"{summary['total_overtime']:.2f}",
            f"{summary['total_deductions']:.2f}",
            f"{summary['total_net']:.2f}",
        ])
        return response

    return Response({
        'success': True,
        'data': {
            'month': month_str,
            'date_from': dt_from.strftime('%Y-%m-%d'),
            'date_to': dt_to.strftime('%Y-%m-%d'),
            'departments': departments_list,
            'summary': summary,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer, PassthroughCSVRenderer])
def leave_liability_report(request, format=None):
    if not check_report_permission(request.user):
        return Response({"error": "You do not have permission to view leave liability reports."}, status=status.HTTP_403_FORBIDDEN)

    employees = Employee.objects.all().order_by('first_name', 'last_name')
    leave_types = TimeOffType.objects.filter(requires_allocation=True).order_by('name')

    leave_balances = []
    total_liability = 0.0

    for emp in employees:
        contracts = Contract.objects.filter(employee=emp)
        active_contract = next((c for c in contracts if c.state == Contract.State.RUNNING), contracts.first())

        # Simplified approximation: daily rate = contract.wage / 30.0
        if active_contract and active_contract.wage:
            daily_rate = round(float(active_contract.wage) / 30.0, 2)
        else:
            daily_rate = 0.0

        for lt in leave_types:
            alloc = TimeOffAllocation.objects.filter(employee=emp, time_off_type=lt).first()
            if alloc:
                allocated = float(alloc.allocated_amount or 0.0)
                used = float(alloc.used_amount or 0.0)
                remaining = max(0.0, allocated - used)
            else:
                allocated = 0.0
                used = 0.0
                remaining = 0.0

            liability = round(remaining * daily_rate, 2)
            total_liability += liability

            leave_balances.append({
                'employee_code': emp.employee_code,
                'employee_name': f"{emp.first_name} {emp.last_name}".strip(),
                'department': emp.department or 'Unassigned',
                'leave_type': lt.name,
                'allocated_amount': round(allocated, 1),
                'used_amount': round(used, 1),
                'remaining_amount': round(remaining, 1),
                'daily_rate': daily_rate,
                'liability_valuation': liability,
            })

    # Utilization trend: calculate approved leave request count for last 3 months
    today = date.today()
    utilization_trend = []
    for i in range(2, -1, -1):
        m_date = today - timedelta(days=i * 30)
        m_year, m_month = m_date.year, m_date.month
        m_str = m_date.strftime('%Y-%m')

        req_count = TimeOffRequest.objects.filter(
            date_from__year=m_year,
            date_from__month=m_month,
            status__in=['approved', 'validate']
        ).count()

        utilization_trend.append({
            'month': m_str,
            'approved_requests': req_count
        })

    total_liability = round(total_liability, 2)

    fmt = request.query_params.get('format', '').lower()
    if fmt == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="time_off_leave_liability_report.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'Employee Code', 'Employee Name', 'Department', 'Leave Type',
            'Allocated Days', 'Used Days', 'Remaining Balance', 'Daily Rate (₹)', 'Liability Valuation (₹)'
        ])
        for lb in leave_balances:
            writer.writerow([
                lb['employee_code'],
                lb['employee_name'],
                lb['department'],
                lb['leave_type'],
                lb['allocated_amount'],
                lb['used_amount'],
                lb['remaining_amount'],
                f"{lb['daily_rate']:.2f}",
                f"{lb['liability_valuation']:.2f}",
            ])
        writer.writerow([])
        writer.writerow(['Total Liability Valuation', '', '', '', '', '', '', '', f"{total_liability:.2f}"])
        return response

    return Response({
        'success': True,
        'data': {
            'leave_balances': leave_balances,
            'utilization_trend': utilization_trend,
            'total_liability': total_liability,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer, PassthroughCSVRenderer])
def full_ledger_report(request, format=None):
    if not check_report_permission(request.user):
        return Response({"error": "You do not have permission to view full ledger export."}, status=status.HTTP_403_FORBIDDEN)

    date_from_str = request.query_params.get('date_from')
    date_to_str = request.query_params.get('date_to')

    payslips = Payslip.objects.all().select_related('payrun', 'employee').prefetch_related('adjustments').order_by('-created_at')

    if date_from_str:
        try:
            dt_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
            payslips = payslips.filter(payrun__date_from__gte=dt_from)
        except Exception:
            pass

    if date_to_str:
        try:
            dt_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
            payslips = payslips.filter(payrun__date_to__lte=dt_to)
        except Exception:
            pass

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="payroll_full_ledger.csv"'
    writer = csv.writer(response)

    writer.writerow([
        'Payslip ID', 'Employee Code', 'Employee Name', 'Department',
        'Payrun Reference', 'Period From', 'Period To', 'Basic (₹)', 'Gross (₹)',
        'Total Deductions (₹)', 'Adjustments Total (₹)', 'Net Pay (₹)', 'Status'
    ])

    for ps in payslips:
        emp = ps.employee
        payrun = ps.payrun

        emp_code = emp.employee_code if emp else ''
        emp_name = f"{emp.first_name} {emp.last_name}".strip() if emp else ''
        dept = emp.department if emp else 'Unassigned'

        payrun_ref = payrun.reference if payrun else ''
        p_from = payrun.date_from.strftime('%Y-%m-%d') if (payrun and payrun.date_from) else ''
        p_to = payrun.date_to.strftime('%Y-%m-%d') if (payrun and payrun.date_to) else ''

        basic = float(ps.basic)
        gross = float(ps.gross)
        deductions = float(ps.total_deductions)
        adj_total = sum(float(a.amount) for a in ps.adjustments.all())
        net = float(ps.net)

        writer.writerow([
            ps.id,
            emp_code,
            emp_name,
            dept,
            payrun_ref,
            p_from,
            p_to,
            f"{basic:.2f}",
            f"{gross:.2f}",
            f"{deductions:.2f}",
            f"{adj_total:.2f}",
            f"{net:.2f}",
            ps.status,
        ])

    return response
