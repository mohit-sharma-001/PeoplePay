import { Role, Permission } from '../types/auth';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Admin: [
    'view_dashboard',
    'view_employees',
    'manage_employees',
    'view_schedules',
    'manage_schedules',
    'view_contracts',
    'manage_contracts',
    'view_attendance',
    'manage_attendance',
    'view_timeoff',
    'manage_timeoff',
    'approve_timeoff',
    'view_payroll',
    'manage_payroll',
    'approve_payroll',
    'delete_payroll',
    'manage_structures',
    'view_reports',
    'manage_users',
  ],
  'HR Manager': [
    'view_dashboard',
    'view_employees',
    'manage_employees',
    'view_schedules',
    'manage_schedules',
    'view_contracts',
    'manage_contracts',
    'view_attendance',
    'manage_attendance',
    'view_timeoff',
    'manage_timeoff',
    'approve_timeoff',
  ],
  'HR Payroll User': [
    'view_dashboard',
    'view_employees',
    'view_schedules',
    'view_contracts',
    'view_attendance',
    'view_timeoff',
    'view_payroll',
    'manage_payroll',
    'view_reports',
  ],
  'HR Payroll Manager': [
    'view_dashboard',
    'view_employees',
    'manage_employees',
    'view_schedules',
    'manage_schedules',
    'view_contracts',
    'manage_contracts',
    'view_attendance',
    'manage_attendance',
    'view_timeoff',
    'manage_timeoff',
    'approve_timeoff',
    'view_payroll',
    'manage_payroll',
    'approve_payroll',
    'delete_payroll',
    'manage_structures',
    'view_reports',
  ],
  Employee: [
    'view_dashboard',
    'view_attendance',
    'view_timeoff',
  ],
};

export const MODULE_ROUTES: Record<string, Permission> = {
  '/dashboard': 'view_dashboard',
  '/employees': 'view_employees',
  '/schedules': 'view_schedules',
  '/contracts': 'view_contracts',
  '/attendance': 'view_attendance',
  '/time-off': 'view_timeoff',
  '/payroll': 'view_payroll',
  '/reports': 'view_reports',
  '/admin': 'manage_users',
};

export function hasPermission(userRole: Role | undefined | null, permission: Permission): boolean {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function canAccessModule(userRole: Role | undefined | null, modulePath: string): boolean {
  if (!userRole) return false;
  // Exact match or prefix match with /
  const matchedModule = Object.keys(MODULE_ROUTES).find(route => 
    modulePath === route || modulePath.startsWith(route + '/')
  );
  if (!matchedModule) return true;
  const requiredPermission = MODULE_ROUTES[matchedModule];
  return hasPermission(userRole, requiredPermission);
}

export function canPerformAction(userRole: Role | undefined | null, actionPermission: Permission): boolean {
  return hasPermission(userRole, actionPermission);
}
