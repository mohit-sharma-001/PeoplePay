from decimal import Decimal


def compute_salary_for_structure(structure, initial_context=None):
    """
    Computes salary breakdown for a given SalaryStructure using its defined rules.

    Args:
        structure (SalaryStructure): The salary structure instance.
        initial_context (dict, optional): Initial key-values (e.g. {'CONTRACT_WAGE': Decimal('50000.00')}).

    Returns:
        tuple: (context_dict, basic_val, gross_val, deductions_val, net_val)
    """
    context = {}
    if initial_context:
        for k, v in initial_context.items():
            context[k] = float(v) if isinstance(v, Decimal) else float(v)

    rules = structure.rules.all().order_by('id')

    basic_rules_total = 0.0
    allowance_rules_total = 0.0
    deduction_rules_total = 0.0

    for rule in rules:
        code = rule.code.upper()

        if rule.amount_type == 'fixed':
            val = float(rule.amount)
            if val == 0 and code == 'BASIC' and 'CONTRACT_WAGE' in context:
                val = context['CONTRACT_WAGE']
        elif rule.amount_type == 'percentage':
            basis_code = (rule.percentage_basis_code or '').upper()
            basis_val = context.get(basis_code, context.get('BASIC', context.get('CONTRACT_WAGE', 0.0)))
            val = round((float(rule.amount) / 100.0) * basis_val, 2)
        elif rule.amount_type == 'formula':
            try:
                val = float(eval(rule.formula, {"__builtins__": None}, context))
            except Exception:
                val = float(rule.amount)
        else:
            val = float(rule.amount)

        val = round(val, 2)
        context[code] = val

        category = (rule.category or '').lower()
        if category == 'basic':
            basic_rules_total += val
        elif category == 'allowance':
            allowance_rules_total += val
        elif category == 'deduction':
            deduction_rules_total += val

    basic_val = context.get('BASIC', basic_rules_total)
    if basic_val == 0.0 and 'CONTRACT_WAGE' in context:
        basic_val = context['CONTRACT_WAGE']

    if 'GROSS' in context:
        gross_val = context['GROSS']
    else:
        gross_val = basic_val + allowance_rules_total
        context['GROSS'] = round(gross_val, 2)

    deductions_val = deduction_rules_total
    context['TOTAL_DEDUCTIONS'] = round(deductions_val, 2)

    if 'NET' in context:
        net_val = context['NET']
    else:
        net_val = gross_val - deductions_val
        context['NET'] = round(net_val, 2)

    return context, round(basic_val, 2), round(gross_val, 2), round(deductions_val, 2), round(net_val, 2)


def calculate_worked_percentage(employee, date_from, date_to, contract=None):
    """
    Calculates expected working hours and actual worked hours for an employee
    during a date range [date_from, date_to], returning expected_hours, actual_hours,
    and worked_percentage.

    Prioritizes contract.working_schedule if set, falling back to employee.working_schedule.
    """
    working_schedule = None
    if contract and getattr(contract, 'working_schedule', None):
        working_schedule = contract.working_schedule
    elif employee and getattr(employee, 'working_schedule', None):
        working_schedule = employee.working_schedule

    if working_schedule:
        weekly_hours = float(working_schedule.total_weekly_hours or 40.0)
        num_days = (date_to - date_from).days + 1
        expected_hours = (weekly_hours / 7.0) * num_days
    else:
        expected_hours = None

    from attendance.models import Attendance
    attendances = Attendance.objects.filter(
        employee=employee,
        check_in__date__range=(date_from, date_to),
        check_out__isnull=False
    )
    actual_hours = sum(float(a.worked_hours) for a in attendances)

    if expected_hours is not None and expected_hours > 0:
        raw_pct = actual_hours / expected_hours
        worked_pct = min(raw_pct, 1.0)
    else:
        worked_pct = 1.0

    return {
        "expected_hours": round(expected_hours, 2) if expected_hours is not None else None,
        "actual_hours": round(actual_hours, 2),
        "worked_percentage": round(worked_pct, 4)
    }

