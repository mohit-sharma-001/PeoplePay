export type Role = 
  | 'Employee' 
  | 'HR Manager' 
  | 'HR Payroll User' 
  | 'HR Payroll Manager' 
  | 'Admin';

export type Permission = 
  | 'view_dashboard'
  | 'view_employees'
  | 'manage_employees'
  | 'view_contracts'
  | 'manage_contracts'
  | 'view_attendance'
  | 'manage_attendance'
  | 'view_timeoff'
  | 'manage_timeoff'
  | 'approve_timeoff'
  | 'view_payroll'
  | 'manage_payroll'
  | 'approve_payroll'
  | 'view_reports';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department?: string;
  employeeId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
