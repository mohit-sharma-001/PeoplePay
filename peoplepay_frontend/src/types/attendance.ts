export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Half Day' | 'Overtime';

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string; // ISO or HH:mm
  checkOut?: string;
  workedHours: number; // e.g. 8.5
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
}
