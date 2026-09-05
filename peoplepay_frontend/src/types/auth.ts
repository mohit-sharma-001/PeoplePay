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
  | 'view_reports'
  | 'manage_users';

export interface User {
  id: string | number;
  name: string;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  roles?: string[];
  avatarUrl?: string;
  department?: string;
  employeeId?: string;
  employee_id?: number | string;
  employee_name?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  department?: string;
  job_position?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: {
      id: number | string;
      username: string;
      email: string;
      first_name?: string;
      last_name?: string;
      roles?: string[];
      employee_id?: number | string;
    };
  };
  errors?: Record<string, string[]> | null;
}

export interface ManagedUser {
  id: number | string;
  username: string;
  email: string;
  roles: string[];
  employee_id?: number | string;
  employee_name?: string;
}
