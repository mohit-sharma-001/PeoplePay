from datetime import date, timedelta

INDIAN_HOLIDAYS_2026 = {
    date(2026, 1, 26),   # Republic Day
    date(2026, 3, 4),    # Holi
    date(2026, 4, 3),    # Good Friday
    date(2026, 4, 14),   # Ambedkar Jayanti
    date(2026, 5, 1),    # Labour Day
    date(2026, 8, 15),   # Independence Day
    date(2026, 9, 14),   # Ganesh Chaturthi
    date(2026, 10, 2),   # Gandhi Jayanti
    date(2026, 10, 20),  # Dussehra
    date(2026, 11, 8),   # Diwali
    date(2026, 12, 25),  # Christmas
}


def is_working_day(target_date: date) -> bool:
    """
    Returns True if target_date is a weekday (Monday to Friday)
    and NOT an Indian national holiday.
    """
    if target_date.weekday() >= 5:  # Saturday or Sunday
        return False
    if target_date in INDIAN_HOLIDAYS_2026:
        return False
    return True


def calculate_working_days(date_from: date, date_to: date) -> int:
    """
    Calculates number of working days between date_from and date_to (inclusive),
    excluding weekends (Saturday & Sunday) and Indian national holidays.
    """
    if not date_from or not date_to or date_to < date_from:
        return 0

    count = 0
    curr = date_from
    while curr <= date_to:
        if is_working_day(curr):
            count += 1
        curr += timedelta(days=1)
    return count
