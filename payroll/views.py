import io
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import HasRole
from core.utils import api_response
from django.http import HttpResponse
from django.core.mail import EmailMessage
from django.conf import settings
from payroll.pdf_utils import generate_payslip_pdf

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from payroll.models import SalaryStructure, SalaryRule, Payrun, Payslip, PayslipAdjustment
from payroll.serializers import (
    SalaryStructureSerializer, SalaryRuleSerializer,
    PayrunSerializer, PayslipSerializer
)
from payroll.engine import compute_salary_for_structure, calculate_worked_percentage
from employees.models import Employee
from contracts.models import Contract


class SalaryStructureViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Salary Structures.
    Full CRUD restricted to Admin and HR Payroll Manager.
    Read-only (GET) additionally allowed for HR Payroll User.
    """
    queryset = SalaryStructure.objects.all().prefetch_related('rules').order_by('name')
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'retrieve': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'create': ['Admin', 'HR Payroll Manager'],
        'update': ['Admin', 'HR Payroll Manager'],
        'partial_update': ['Admin', 'HR Payroll Manager'],
        'destroy': ['Admin', 'HR Payroll Manager'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']


class SalaryRuleViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for full CRUD management of Salary Rules.
    Full CRUD restricted to Admin and HR Payroll Manager.
    Read-only (GET) additionally allowed for HR Payroll User.
    """
    queryset = SalaryRule.objects.all().select_related('structure').order_by('sequence', 'id')
    serializer_class = SalaryRuleSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'retrieve': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'create': ['Admin', 'HR Payroll Manager'],
        'update': ['Admin', 'HR Payroll Manager'],
        'partial_update': ['Admin', 'HR Payroll Manager'],
        'destroy': ['Admin', 'HR Payroll Manager'],
    }
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'category']
    ordering_fields = ['sequence', 'category', 'name', 'amount', 'created_at']

    def perform_create(self, serializer):
        structure = serializer.validated_data.get('structure')
        sequence = serializer.validated_data.get('sequence')
        if sequence is None:
            from django.db.models import Max
            max_seq = SalaryRule.objects.filter(structure=structure).aggregate(Max('sequence'))['sequence__max']
            sequence = (max_seq + 10) if max_seq is not None else 10
        serializer.save(sequence=sequence)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)


class PayrunViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Payrun lifecycle management.
    """
    queryset = Payrun.objects.all().prefetch_related('payslips', 'payslips__employee', 'payslips__contract').order_by('-created_at')
    serializer_class = PayrunSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'retrieve': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'create': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'update': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'partial_update': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'destroy': ['Admin', 'HR Payroll Manager'],
        'compute': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'validate': ['Admin', 'HR Payroll Manager'],
        'mark_paid': ['Admin', 'HR Payroll Manager'],
        'send_payslips': ['Admin', 'HR Payroll Manager'],
    }

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'structure__name', 'status']
    ordering_fields = ['reference', 'created_at', 'date_from', 'date_to', 'status']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        structure_id = serializer.validated_data['structure'].id
        date_from = serializer.validated_data['date_from']
        date_to = serializer.validated_data['date_to']
        employee_ids = serializer.validated_data.pop('employee_ids', None)

        payrun = serializer.save(created_by=request.user if request.user and request.user.is_authenticated else None)

        if employee_ids:
            employees = Employee.objects.filter(id__in=employee_ids)
        else:
            employees = Employee.objects.all()

        for emp in employees:
            is_terminated = (emp.status and emp.status.lower() == 'terminated')

            contracts = Contract.objects.filter(employee=emp)
            active_contract = None
            if not is_terminated:
                for c in contracts:
                    if c.is_active_for_period(date_from, date_to):
                        active_contract = c
                        break

            if active_contract and not is_terminated:
                Payslip.objects.create(
                    payrun=payrun,
                    employee=emp,
                    contract=active_contract,
                    status=Payslip.Status.DRAFT,
                    is_excluded=False,
                    warning=''
                )
            else:
                warning_msg = "Employee is terminated" if is_terminated else "No active contract for this period"
                Payslip.objects.create(
                    payrun=payrun,
                    employee=emp,
                    contract=active_contract if not is_terminated else None,
                    status=Payslip.Status.DRAFT,
                    is_excluded=True,
                    warning=warning_msg,
                    basic=0,
                    gross=0,
                    total_deductions=0,
                    net=0
                )

        payrun.refresh_from_db()
        output_serializer = self.get_serializer(payrun)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        payrun = self.get_object()

        if payrun.status != Payrun.Status.DRAFT:
            return Response(
                {"error": "Payrun can only be edited while in 'draft' status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(payrun, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        employee_ids = request.data.get('employee_ids', None)
        payrun = serializer.save()

        date_from = payrun.date_from
        date_to = payrun.date_to

        if employee_ids is not None:
            desired_emp_ids = set(int(eid) for eid in employee_ids)
            current_payslips = list(payrun.payslips.all())

            for ps in current_payslips:
                if ps.employee_id not in desired_emp_ids:
                    ps.delete()

            existing_emp_ids = set(payrun.payslips.values_list('employee_id', flat=True))
            new_emp_ids = desired_emp_ids - existing_emp_ids

            for emp in Employee.objects.filter(id__in=new_emp_ids):
                is_terminated = (emp.status and emp.status.lower() == 'terminated')

                contracts = Contract.objects.filter(employee=emp)
                active_contract = None
                if not is_terminated:
                    for c in contracts:
                        if c.is_active_for_period(date_from, date_to):
                            active_contract = c
                            break

                if active_contract and not is_terminated:
                    Payslip.objects.create(
                        payrun=payrun,
                        employee=emp,
                        contract=active_contract,
                        status=Payslip.Status.DRAFT,
                        is_excluded=False,
                        warning=''
                    )
                else:
                    warning_msg = "Employee is terminated" if is_terminated else "No active contract for this period"
                    Payslip.objects.create(
                        payrun=payrun,
                        employee=emp,
                        contract=active_contract if not is_terminated else None,
                        status=Payslip.Status.DRAFT,
                        is_excluded=True,
                        warning=warning_msg,
                        basic=0,
                        gross=0,
                        total_deductions=0,
                        net=0
                    )

        payrun.refresh_from_db()
        output_serializer = self.get_serializer(payrun)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def compute(self, request, pk=None):
        payrun = self.get_object()

        for payslip in payrun.payslips.filter(is_excluded=False):
            raw_wage = float(payslip.contract.wage) if payslip.contract else 0.0
            calc = calculate_worked_percentage(payslip.employee, payrun.date_from, payrun.date_to, contract=payslip.contract)
            worked_pct = calc["worked_percentage"]
            adjusted_wage = raw_wage * worked_pct

            line_items, basic_val, gross_val, deductions_val, net_val = compute_salary_for_structure(
                payrun.structure,
                {"CONTRACT_WAGE": adjusted_wage}
            )

            # Preserve unadjusted full contract wage as reference key CONTRACT_WAGE in line_items
            line_items["CONTRACT_WAGE"] = round(raw_wage, 2)

            payslip.expected_hours = calc["expected_hours"]
            payslip.actual_hours = calc["actual_hours"]
            payslip.worked_percentage = calc["worked_percentage"]

            if worked_pct == 0 and (calc["expected_hours"] is not None and calc["expected_hours"] > 0):
                payslip.warning = "No attendance recorded for this period"
            elif payslip.warning == "No attendance recorded for this period":
                payslip.warning = ""

            payslip.line_items = line_items
            payslip.basic = basic_val
            payslip.gross = gross_val
            payslip.total_deductions = deductions_val
            payslip.net = net_val
            payslip.status = Payslip.Status.COMPUTED
            payslip.save()
            payslip.recalculate_net()

        payrun.status = Payrun.Status.COMPUTED
        payrun.save()

        serializer = self.get_serializer(payrun)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        payrun = self.get_object()
        if payrun.status != Payrun.Status.COMPUTED:
            return Response(
                {"error": "Payrun must be in 'computed' status to validate."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payrun.status = Payrun.Status.VALIDATED
        payrun.save()

        payrun.payslips.filter(is_excluded=False).update(status=Payslip.Status.VALIDATED)

        serializer = self.get_serializer(payrun)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        payrun = self.get_object()
        if payrun.status != Payrun.Status.VALIDATED:
            return Response(
                {"error": "Payrun must be in 'validated' status to mark as paid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payrun.status = Payrun.Status.PAID
        payrun.save()

        payrun.payslips.filter(is_excluded=False).update(status=Payslip.Status.PAID)

        serializer = self.get_serializer(payrun)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='send-payslips')
    def send_payslips(self, request, pk=None):
        payrun = self.get_object()

        if payrun.status == Payrun.Status.DRAFT:
            return api_response(
                message="Cannot send payslips for a draft payrun.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors={"status": "Cannot send payslips for a draft payrun."}
            )

        payslips = payrun.payslips.select_related('employee', 'employee__user').all()

        sent_count = 0
        skipped_count = 0
        skipped_employees = []

        for payslip in payslips:
            emp = payslip.employee

            if payslip.is_excluded:
                skipped_count += 1
                emp_code = emp.employee_code if emp else 'EMP'
                skipped_employees.append(f"{emp_code} - excluded")
                continue

            email = emp.email if (emp and emp.email) else (emp.user.email if (emp and emp.user and emp.user.email) else None)

            if not email or '@' not in email:
                skipped_count += 1
                emp_code = emp.employee_code if emp else 'EMP'
                skipped_employees.append(f"{emp_code} - no email")
                continue

            try:
                pdf_bytes = generate_payslip_pdf(payslip)

                if payrun.date_from and payrun.date_to:
                    date_from_str = payrun.date_from.strftime('%Y-%m-%d')
                    date_to_str = payrun.date_to.strftime('%Y-%m-%d')
                    period_title = f"{date_from_str} to {date_to_str}"
                else:
                    date_from_str = "N/A"
                    date_to_str = "N/A"
                    period_title = payrun.reference or payrun.name

                emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Employee"
                net_val = float(payslip.net) if payslip.net is not None else 0.0

                subject = f"Your Payslip for {period_title}"
                body = (
                    f"Dear {emp_name}, please find your payslip for {date_from_str} to {date_to_str} attached. "
                    f"Net Pay: ₹{net_val:,.2f}.\n\n"
                    f"— PeoplePay360"
                )

                email_msg = EmailMessage(
                    subject=subject,
                    body=body,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'payroll@peoplepay360.com'),
                    to=[email],
                )
                filename = f"payslip_{emp.employee_code if emp else 'EMP'}_{date_from_str}.pdf"
                email_msg.attach(filename, pdf_bytes, 'application/pdf')
                email_msg.send(fail_silently=False)

                sent_count += 1

                from core.models import Notification
                Notification.objects.create(
                    user=emp.user if (emp and emp.user) else request.user,
                    payslip=payslip,
                    title=f"Payslip Email Sent - {emp_name}",
                    message=f"Payslip email delivered to {email} for period {period_title}. Net Pay: ₹{net_val:,.2f}.",
                    notification_type="email",
                    is_read=False
                )
            except Exception as e:
                skipped_count += 1
                emp_code = emp.employee_code if emp else 'EMP'
                skipped_employees.append(f"{emp_code} - send error: {str(e)}")

        if request.user and request.user.is_authenticated and sent_count > 0:
            from core.models import Notification
            Notification.objects.create(
                user=request.user,
                title="Bulk Payslip Email Distribution Complete",
                message=f"Successfully sent {sent_count} payslip email(s) for payrun {payrun.reference or payrun.name}. {skipped_count} skipped.",
                notification_type="email",
                is_read=False
            )

        data = {
            "sent": sent_count,
            "skipped": skipped_count,
            "skipped_employees": skipped_employees
        }

        return api_response(
            data=data,
            message=f"Payslips sent to {sent_count} employees. {skipped_count} skipped.",
            status_code=status.HTTP_200_OK
        )



class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnlyModelViewSet for viewing Payslips, managing adjustments, and PDF export.
    Filterable by ?payrun= and ?employee=.
    """
    queryset = Payslip.objects.all().select_related('payrun', 'employee', 'contract').prefetch_related('adjustments').order_by('employee__first_name')
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated, HasRole]
    action_allowed_roles = {
        'list': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'retrieve': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'add_adjustment': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'delete_adjustment': ['Admin', 'HR Payroll Manager', 'HR Payroll User'],
        'pdf': ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'],
    }
    filter_backends = [filters.OrderingFilter]

    def get_queryset(self):
        qs = super().get_queryset()
        payrun_id = self.request.query_params.get('payrun')
        if payrun_id:
            qs = qs.filter(payrun_id=payrun_id)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        return qs

    @action(detail=True, methods=['post'], url_path='add-adjustment')
    def add_adjustment(self, request, pk=None):
        payslip = self.get_object()

        if payslip.status in [Payslip.Status.VALIDATED, Payslip.Status.PAID]:
            return Response(
                {"error": "Payslip is locked once validated or paid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if payslip.is_excluded:
            return Response(
                {"error": "Cannot add adjustment to an excluded payslip."},
                status=status.HTTP_400_BAD_REQUEST
            )

        label = request.data.get('label')
        amount = request.data.get('amount')

        if not label or amount is None:
            return Response(
                {"error": "Both 'label' and 'amount' are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from decimal import Decimal
            decimal_amount = Decimal(str(amount))
        except Exception:
            return Response(
                {"error": "Invalid amount value."},
                status=status.HTTP_400_BAD_REQUEST
            )

        PayslipAdjustment.objects.create(
            payslip=payslip,
            label=label,
            amount=decimal_amount,
            added_by=request.user if request.user and request.user.is_authenticated else None
        )

        payslip.recalculate_net()
        payslip.refresh_from_db()
        serializer = self.get_serializer(payslip)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='adjustments/(?P<adjustment_id>[^/.]+)')
    def delete_adjustment(self, request, pk=None, adjustment_id=None):
        payslip = self.get_object()

        if payslip.status in [Payslip.Status.VALIDATED, Payslip.Status.PAID]:
            return Response(
                {"error": "Payslip is locked once validated or paid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        adjustment = PayslipAdjustment.objects.filter(id=adjustment_id, payslip=payslip).first()
        if not adjustment:
            return Response(
                {"error": "Adjustment not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        adjustment.delete()
        payslip.recalculate_net()
        payslip.refresh_from_db()
        serializer = self.get_serializer(payslip)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def pdf(self, request, pk=None):
        token_key = request.query_params.get('token')
        user = request.user
        if token_key:
            from rest_framework.authtoken.models import Token
            try:
                token_obj = Token.objects.select_related('user').get(key=token_key)
                user = token_obj.user
            except Exception:
                pass

        if not user or not user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        payslip = self.get_object()
        pdf_bytes = generate_payslip_pdf(payslip)

        emp_code = payslip.employee.employee_code if payslip.employee else 'EMP'
        period = payslip.payrun.date_from.strftime('%Y-%m') if (payslip.payrun and payslip.payrun.date_from) else 'period'
        filename = f"payslip_{emp_code}_{period}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['X-Frame-Options'] = 'ALLOWALL'
        return response

