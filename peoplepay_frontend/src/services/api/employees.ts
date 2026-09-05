import { apiFetch, ApiResponse } from './client';
import { mockEmployees } from '../../data/mockEmployees';
import { mockSchedules } from '../../data/mockSchedules';
import { Employee, WorkingSchedule } from '../../types/employee';

export const employeesApi = {
  async getAll(): Promise<ApiResponse<Employee[]>> {
    return apiFetch('/api/employees/', {}, mockEmployees);
  },

  async getById(id: string): Promise<ApiResponse<Employee | null>> {
    return apiFetch(`/api/employees/${id}/`, {}, mockEmployees.find((e) => e.id === id) || null);
  },

  async getSchedules(): Promise<ApiResponse<WorkingSchedule[]>> {
    return apiFetch('/api/working-schedule/', {}, mockSchedules);
  },
};
