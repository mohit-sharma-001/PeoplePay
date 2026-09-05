import { apiFetch, ApiResponse } from './client';
import { mockEmployees } from '../../data/mockEmployees';
import { mockSchedules } from '../../data/mockSchedules';
import { Employee, WorkingSchedule } from '../../types/employee';

function mapEmployee(apiItem: any): Employee {
  return {
    id: String(apiItem.id),
    code: apiItem.employee_code || `EMP${String(apiItem.id).padStart(4, '0')}`,
    firstName: apiItem.first_name || '',
    lastName: apiItem.last_name || '',
    email: apiItem.email || '',
    phone: apiItem.phone || '',
    department: apiItem.department || 'Engineering',
    jobTitle: apiItem.job_position || apiItem.job_title || 'Software Engineer',
    managerId: apiItem.manager ? String(apiItem.manager) : undefined,
    managerName: apiItem.manager_name || undefined,
    joiningDate: apiItem.date_joined || '2026-01-01',
    workLocation: 'Headquarters',
    status: (apiItem.status ? (apiItem.status.charAt(0).toUpperCase() + apiItem.status.slice(1)) : 'Active') as any,
    workingScheduleId: apiItem.working_schedule ? String(apiItem.working_schedule) : '1',
    workingScheduleName: apiItem.working_schedule_name || 'Standard 40h Shift',
    contractId: `CON-${apiItem.id}`,
  };
}

export const employeesApi = {
  async getAll(): Promise<ApiResponse<Employee[]>> {
    const res = await apiFetch<any[]>('/api/employees/', {}, mockEmployees);
    const data = Array.isArray(res.data) ? res.data.map(mapEmployee) : mockEmployees;
    return { ...res, data };
  },

  async getById(id: string): Promise<ApiResponse<Employee | null>> {
    const res = await apiFetch<any>(`/api/employees/${id}/`, {}, mockEmployees.find((e) => e.id === id) || null);
    const data = res.data ? mapEmployee(res.data) : null;
    return { ...res, data };
  },

  async getSchedules(): Promise<ApiResponse<WorkingSchedule[]>> {
    const res = await apiFetch<WorkingSchedule[]>('/api/working-schedule/', {}, mockSchedules);
    return res;
  },
};
