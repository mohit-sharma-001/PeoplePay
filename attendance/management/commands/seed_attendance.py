from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, time, datetime
from attendance.models import Attendance
from employees.models import Employee


class Command(BaseCommand):
    help = 'Seeds sample Attendance records over the last 5-7 days with realistic statuses.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Attendance seed process..."))

        employees = Employee.objects.all()
        if not employees.exists():
            self.stdout.write(self.style.WARNING("No employees found. Please run seed_employees first."))
            return

        created_count = 0
        now = timezone.now()
        tz = timezone.get_current_timezone()

        # Seed records for past 4 days (days -4 to -1) plus today (day 0)
        for days_ago in range(4, -1, -1):
            target_date = (now - timedelta(days=days_ago)).date()

            # Skip weekends (Saturday=5, Sunday=6)
            if target_date.weekday() in (5, 6):
                continue

            for idx, emp in enumerate(employees):
                # Deliberate variations for demo realism:
                if days_ago == 0 and idx == 0:
                    # Ongoing open check-in for first employee today
                    check_in_time = datetime.combine(target_date, time(9, 5), tzinfo=tz)
                    att, created = Attendance.objects.get_or_create(
                        employee=emp,
                        check_in=check_in_time,
                        defaults={
                            'check_out': None,
                            'status': Attendance.Status.PRESENT,
                            'is_manual_correction': False,
                        }
                    )
                    if created:
                        created_count += 1
                elif days_ago == 2 and idx == 3:
                    # Absent entry for employee 3 two days ago
                    check_in_time = datetime.combine(target_date, time(9, 0), tzinfo=tz)
                    att, created = Attendance.objects.get_or_create(
                        employee=emp,
                        check_in=check_in_time,
                        defaults={
                            'check_out': datetime.combine(target_date, time(9, 0), tzinfo=tz),
                            'status': Attendance.Status.ABSENT,
                            'is_manual_correction': True,
                            'notes': 'Unexcused absence - LOP applied'
                        }
                    )
                    if created:
                        created_count += 1
                elif days_ago in (1, 3) and idx in (1, 4):
                    # Late arrival entries
                    check_in_time = datetime.combine(target_date, time(10, 20), tzinfo=tz)
                    check_out_time = datetime.combine(target_date, time(18, 30), tzinfo=tz)
                    att, created = Attendance.objects.get_or_create(
                        employee=emp,
                        check_in=check_in_time,
                        defaults={
                            'check_out': check_out_time,
                            'status': Attendance.Status.LATE,
                            'is_manual_correction': False,
                        }
                    )
                    if created:
                        created_count += 1
                else:
                    # Normal Present entry
                    check_in_time = datetime.combine(target_date, time(9, 2), tzinfo=tz)
                    check_out_time = datetime.combine(target_date, time(18, 5), tzinfo=tz)
                    att, created = Attendance.objects.get_or_create(
                        employee=emp,
                        check_in=check_in_time,
                        defaults={
                            'check_out': check_out_time,
                            'status': Attendance.Status.PRESENT,
                            'is_manual_correction': False,
                        }
                    )
                    if created:
                        created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} new Attendance records (Total Attendances: {Attendance.objects.count()})."))
