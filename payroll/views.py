import io
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import HasRole
from django.http import HttpResponse

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

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        payslip = self.get_object()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=colors.HexColor('#714B67'),
            spaceAfter=2
        )
        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=12
        )
        section_heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=10,
            spaceAfter=6
        )
        cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10)
        cell_normal = ParagraphStyle('CellNormal', parent=styles['Normal'], fontName='Helvetica', fontSize=10)
        cell_right = ParagraphStyle('CellRight', parent=styles['Normal'], fontName='Helvetica', fontSize=10, alignment=2)
        cell_right_bold = ParagraphStyle('CellRightBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, alignment=2)

        elements = []

        # Header
        elements.append(Paragraph('PeoplePay360', title_style))
        elements.append(Paragraph('PAYSLIP', subtitle_style))
        elements.append(Spacer(1, 6))

        # Employee & Payrun Metadata Box
        emp = payslip.employee
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else "N/A"
        emp_code = emp.employee_code if emp else "N/A"
        emp_dept = emp.department if emp else "N/A"
        emp_job = emp.job_position if emp else "N/A"

        payrun = payslip.payrun
        payrun_ref = payrun.reference if payrun else "N/A"
        if payrun and payrun.date_from and payrun.date_to:
            period_str = f"{payrun.date_from.strftime('%Y-%m-%d')} to {payrun.date_to.strftime('%Y-%m-%d')}"
        else:
            period_str = "N/A"
        status_str = payslip.status.upper() if payslip.status else "DRAFT"

        meta_data = [
            [
                Paragraph(f"<b>Employee Name:</b> {emp_name}", cell_normal),
                Paragraph(f"<b>Payrun Ref:</b> {payrun_ref}", cell_normal)
            ],
            [
                Paragraph(f"<b>Employee Code:</b> {emp_code}", cell_normal),
                Paragraph(f"<b>Pay Period:</b> {period_str}", cell_normal)
            ],
            [
                Paragraph(f"<b>Department:</b> {emp_dept}", cell_normal),
                Paragraph(f"<b>Status:</b> {status_str}", cell_normal)
            ],
            [
                Paragraph(f"<b>Job Position:</b> {emp_job}", cell_normal),
                Paragraph("", cell_normal)
            ]
        ]

        meta_table = Table(meta_data, colWidths=[270, 270])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # Attendance-Based Proration Section
        exp_hrs = payslip.expected_hours
        act_hrs = payslip.actual_hours
        worked_pct = payslip.worked_percentage

        exp_hrs_str = f"{float(exp_hrs):.1f}h" if exp_hrs is not None else "N/A (No Schedule)"
        act_hrs_str = f"{float(act_hrs):.1f}h" if act_hrs is not None else "0.0h"
        pct_str = f"{float(worked_pct) * 100:.1f}%" if worked_pct is not None else "100.0%"

        elements.append(Paragraph('Attendance-Based Proration', section_heading_style))
        proration_text = f"Expected Hours: <b>{exp_hrs_str}</b> &nbsp;|&nbsp; Actual Hours: <b>{act_hrs_str}</b> &nbsp;|&nbsp; Worked: <b>{pct_str}</b>"
        elements.append(Paragraph(proration_text, cell_normal))
        elements.append(Spacer(1, 10))

        # Salary Breakdown Table
        elements.append(Paragraph('Salary Component Breakdown', section_heading_style))

        rule_map = {}
        if payrun and payrun.structure:
            for r in payrun.structure.rules.all():
                rule_map[r.code] = r.name

        EXCLUDED_PDF_KEYS = {'WORKED_DAYS', 'PUBLIC_HOLIDAYS', 'WORK_DAYS'}
        breakdown_data = [
            [Paragraph('<b>Rule / Component Code</b>', cell_bold), Paragraph('<b>Amount</b>', cell_right_bold)]
        ]

        line_items = payslip.line_items or {}
        filtered_items = [(k, v) for k, v in line_items.items() if k not in EXCLUDED_PDF_KEYS]

        if filtered_items:
            for code, val in filtered_items:
                if code == 'CONTRACT_WAGE':
                    label = "Contract Wage (Reference)"
                elif code in rule_map:
                    label = f"{rule_map[code]} ({code})"
                else:
                    label = code
                try:
                    amt_val = float(val)
                    amt_str = f"Rs. {amt_val:,.2f}"
                except (ValueError, TypeError):
                    amt_str = str(val)
                breakdown_data.append([
                    Paragraph(label, cell_normal),
                    Paragraph(amt_str, cell_right)
                ])
        else:
            breakdown_data.append([
                Paragraph("No computed salary components.", cell_normal),
                Paragraph("Rs. 0.00", cell_right)
            ])

        breakdown_table = Table(breakdown_data, colWidths=[370, 170])
        breakdown_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('LINEBELOW', (0,0), (-1,0), 1.5, colors.HexColor('#CBD5E1')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(breakdown_table)
        elements.append(Spacer(1, 14))

        # Payslip Adjustments Section (if present)
        adjustments = payslip.adjustments.all()
        if adjustments:
            elements.append(Paragraph('Payslip Adjustments', section_heading_style))
            adj_data = [
                [Paragraph('<b>Adjustment Label</b>', cell_bold), Paragraph('<b>Amount</b>', cell_right_bold)]
            ]
            for adj in adjustments:
                try:
                    amt_val = float(adj.amount)
                    amt_str = f"Rs. {amt_val:,.2f}" if amt_val >= 0 else f"-Rs. {abs(amt_val):,.2f}"
                except (ValueError, TypeError):
                    amt_str = str(adj.amount)
                adj_data.append([
                    Paragraph(adj.label, cell_normal),
                    Paragraph(amt_str, cell_right)
                ])

            adj_table = Table(adj_data, colWidths=[370, 170])
            adj_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
                ('LINEBELOW', (0,0), (-1,0), 1.5, colors.HexColor('#CBD5E1')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            elements.append(adj_table)
            elements.append(Spacer(1, 14))

        # Bolded Net Pay Line
        net_val = float(payslip.net) if payslip.net else 0.0
        net_pay_style = ParagraphStyle(
            'NetPayStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.HexColor('#714B67'),
            alignment=2
        )
        elements.append(Paragraph(f"<b>Net Pay: Rs. {net_val:,.2f}</b>", net_pay_style))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        emp_code = payslip.employee.employee_code if payslip.employee else 'EMP'
        period = payslip.payrun.date_from.strftime('%Y-%m') if (payslip.payrun and payslip.payrun.date_from) else 'period'
        filename = f"payslip_{emp_code}_{period}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
