export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Pending';

export interface Employee {
  id: string;
  code: string; // e.g. EMP-2026-001
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  department: string;
  jobTitle: string;
  managerId?: string;
  managerName?: string;
  joiningDate: string;
  workLocation: string;
  status: EmployeeStatus;
  workingScheduleId: string;
  workingScheduleName: string;
  contractId?: string;
}

export interface WorkingSchedule {
  id: string;
  name: string;
  hoursPerWeek: number;
  timeZone: string;
  flexible: boolean;
  days: {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    workHours: number;
    startTime: string;
    endTime: string;
  }[];
}
