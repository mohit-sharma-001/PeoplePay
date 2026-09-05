import { WorkingSchedule } from '../types/employee';

export const mockSchedules: WorkingSchedule[] = [
  {
    id: 'sch-1',
    name: 'Standard 40h/Week (Mon-Fri 9-5)',
    hoursPerWeek: 40,
    timeZone: 'EST (UTC-5)',
    flexible: false,
    days: [
      { day: 'Monday', workHours: 8, startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', workHours: 8, startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', workHours: 8, startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday', workHours: 8, startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', workHours: 8, startTime: '09:00', endTime: '17:00' },
    ],
  },
  {
    id: 'sch-2',
    name: 'Executive Flex (38h/Week)',
    hoursPerWeek: 38,
    timeZone: 'EST (UTC-5)',
    flexible: true,
    days: [
      { day: 'Monday', workHours: 8, startTime: '08:30', endTime: '16:30' },
      { day: 'Tuesday', workHours: 8, startTime: '08:30', endTime: '16:30' },
      { day: 'Wednesday', workHours: 8, startTime: '08:30', endTime: '16:30' },
      { day: 'Thursday', workHours: 8, startTime: '08:30', endTime: '16:30' },
      { day: 'Friday', workHours: 6, startTime: '08:30', endTime: '14:30' },
    ],
  },
  {
    id: 'sch-3',
    name: 'Shift Support (44h/Week Rotational)',
    hoursPerWeek: 44,
    timeZone: 'EST (UTC-5)',
    flexible: false,
    days: [
      { day: 'Monday', workHours: 9, startTime: '08:00', endTime: '17:00' },
      { day: 'Tuesday', workHours: 9, startTime: '08:00', endTime: '17:00' },
      { day: 'Wednesday', workHours: 9, startTime: '08:00', endTime: '17:00' },
      { day: 'Thursday', workHours: 9, startTime: '08:00', endTime: '17:00' },
      { day: 'Friday', workHours: 8, startTime: '08:00', endTime: '16:00' },
    ],
  },
];
