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
    user: apiItem.user !== undefined ? apiItem.user : null,
    terminationReason: apiItem.termination_reason || undefined,
    terminatedAt: apiItem.terminated_at || undefined,
  };
}

function mapWorkingSchedule(apiItem: any): WorkingSchedule {
  return {
    id: String(apiItem.id),
    name: apiItem.name || 'Standard Schedule',
    flexible: apiItem.schedule_type === 'flexible' || apiItem.flexible === true,
    hoursPerWeek: apiItem.total_weekly_hours || apiItem.hoursPerWeek || 40,
    timeZone: 'Asia/Kolkata (IST)',
    days: Array.isArray(apiItem.lines)
      ? apiItem.lines.map((l: any) => ({
          day: l.day_name || 'Day',
          startTime: l.start_time ? l.start_time.substring(0, 5) : '09:00',
          endTime: l.end_time ? l.end_time.substring(0, 5) : '18:00',
          workHours: l.daily_hours || 8,
        }))
      : (apiItem.days || []),
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
    const res = await apiFetch<any[]>('/api/working-schedule/', {}, mockSchedules);
    const data = Array.isArray(res.data) ? res.data.map(mapWorkingSchedule) : mockSchedules;
    return { ...res, data };
  },

  async createSchedule(payload: any): Promise<ApiResponse<WorkingSchedule>> {
    const res = await apiFetch<any>('/api/working-schedule/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapWorkingSchedule(res.data) };
  },

  async updateSchedule(id: string, payload: any): Promise<ApiResponse<WorkingSchedule>> {
    const res = await apiFetch<any>(`/api/working-schedule/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapWorkingSchedule(res.data) };
  },

  async deleteSchedule(id: string): Promise<ApiResponse<null>> {
    return await apiFetch<null>(`/api/working-schedule/${id}/`, {
      method: 'DELETE',
    });
  },

  async create(payload: any): Promise<ApiResponse<Employee>> {
    const res = await apiFetch<any>('/api/employees/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapEmployee(res.data) };
  },

  async update(id: string, payload: any): Promise<ApiResponse<Employee>> {
    const res = await apiFetch<any>(`/api/employees/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapEmployee(res.data) };
  },

  async createLogin(
    employeeId: string,
    payload: { username: string; password: string }
  ): Promise<ApiResponse<any>> {
    return await apiFetch<any>(
      `/api/employees/${employeeId}/create-login/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      {
        data: {
          id: Date.now(),
          username: payload.username,
          employee_id: Number(employeeId),
        },
        status: 201,
        message: 'Login credentials created successfully.',
      }
    );
  },

  async terminate(id: string, reason?: string): Promise<ApiResponse<Employee>> {
    const res = await apiFetch<any>(`/api/employees/${id}/terminate/`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || '' }),
    });
    return { ...res, data: res.data ? mapEmployee(res.data) : (null as any) };
  },

  async reactivate(id: string): Promise<ApiResponse<Employee>> {
    const res = await apiFetch<any>(`/api/employees/${id}/reactivate/`, {
      method: 'POST',
    });
    return { ...res, data: res.data ? mapEmployee(res.data) : (null as any) };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    return await apiFetch<null>(`/api/employees/${id}/`, {
      method: 'DELETE',
    });
  },
};

