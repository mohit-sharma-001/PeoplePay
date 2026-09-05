import { mockFetch, ApiResponse } from './client';
import { mockEmployees } from '../../data/mockEmployees';
import { mockSchedules } from '../../data/mockSchedules';
import { Employee, WorkingSchedule } from '../../types/employee';

export const employeesApi = {
  async getAll(): Promise<ApiResponse<Employee[]>> {
    return mockFetch(mockEmployees);
  },

  async getById(id: string): Promise<ApiResponse<Employee | null>> {
    const employee = mockEmployees.find((e) => e.id === id) || null;
    return mockFetch(employee);
  },

  async getSchedules(): Promise<ApiResponse<WorkingSchedule[]>> {
    return mockFetch(mockSchedules);
  },
};
