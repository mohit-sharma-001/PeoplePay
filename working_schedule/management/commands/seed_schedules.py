from django.core.management.base import BaseCommand
from datetime import time
from working_schedule.models import WorkingSchedule, WorkingScheduleLine
from employees.models import Employee


class Command(BaseCommand):
    help = 'Seeds sample working schedules (Standard 40h, Night Shift, Flexi Shift) and assigns them to employees.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Working Schedules seed process..."))

        # 1. Standard 40 Hours/Week (Mon-Fri 9am-6pm with 60min break = 8hrs/day * 5 = 40hrs)
        std_schedule, created = WorkingSchedule.objects.get_or_create(
            name='Standard 40 Hours/Week',
            defaults={
                'schedule_type': WorkingSchedule.ScheduleType.FIXED,
                'company_name': 'My Company'
            }
        )
        if created or std_schedule.lines.count() == 0:
            std_schedule.lines.all().delete()
            for day in range(5):  # Mon-Fri
                WorkingScheduleLine.objects.create(
                    schedule=std_schedule,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(18, 0),
                    break_minutes=60
                )

        # 2. Night Shift Schedule (Mon-Fri 9pm-5am with 30min break = 7.5hrs/day * 5 = 37.5hrs)
        night_schedule, created = WorkingSchedule.objects.get_or_create(
            name='Night Shift (37.5h)',
            defaults={
                'schedule_type': WorkingSchedule.ScheduleType.FIXED,
                'company_name': 'My Company'
            }
        )
        if created or night_schedule.lines.count() == 0:
            night_schedule.lines.all().delete()
            for day in range(5):  # Mon-Fri
                WorkingScheduleLine.objects.create(
                    schedule=night_schedule,
                    day_of_week=day,
                    start_time=time(21, 0),
                    end_time=time(5, 0),
                    break_minutes=30
                )

        # 3. Flexi Hybrid Schedule (Mon-Thu 8:30am-5pm, Fri 8:30am-3pm)
        flexi_schedule, created = WorkingSchedule.objects.get_or_create(
            name='Flexible Hybrid',
            defaults={
                'schedule_type': WorkingSchedule.ScheduleType.FLEXIBLE,
                'company_name': 'My Company'
            }
        )
        if created or flexi_schedule.lines.count() == 0:
            flexi_schedule.lines.all().delete()
            for day in range(4):  # Mon-Thu
                WorkingScheduleLine.objects.create(
                    schedule=flexi_schedule,
                    day_of_week=day,
                    start_time=time(8, 30),
                    end_time=time(17, 0),
                    break_minutes=45
                )
            # Friday shorter day
            WorkingScheduleLine.objects.create(
                schedule=flexi_schedule,
                day_of_week=4,
                start_time=time(8, 30),
                end_time=time(15, 0),
                break_minutes=30
            )

        # Assign schedules to seeded employees
        employees = Employee.objects.all()
        for idx, emp in enumerate(employees):
            if idx % 3 == 0:
                emp.working_schedule = std_schedule
            elif idx % 3 == 1:
                emp.working_schedule = flexi_schedule
            else:
                emp.working_schedule = night_schedule
            emp.save()

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {WorkingSchedule.objects.count()} working schedules and assigned them to {employees.count()} employees."))
