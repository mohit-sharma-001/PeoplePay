import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_payslip_pdf(payslip) -> bytes:
    """
    Generates PDF bytes for a given Payslip instance using ReportLab.
    Shared helper used by both /api/payroll/payslips/{id}/pdf/ and bulk email delivery.
    """
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
    adjustments = payslip.adjustments.all() if hasattr(payslip, 'adjustments') else []
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
    return pdf_bytes
