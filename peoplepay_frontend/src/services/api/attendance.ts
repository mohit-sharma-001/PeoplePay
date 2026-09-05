import { mockFetch, ApiResponse } from './client';
import { mockAttendance } from '../../data/mockAttendance';
import { Attendance } from '../../types/attendance';

export const attendanceApi = {
  async getAll(): Promise<ApiResponse<Attendance[]>> {
    return mockFetch(mockAttendance);
  },

  async getById(id: string): Promise<ApiResponse<Attendance | null>> {
    const record = mockAttendance.find((a) => a.id === id) || null;
    return mockFetch(record);
  },

  async getByEmployeeId(employeeId: string): Promise<ApiResponse<Attendance[]>> {
    const list = mockAttendance.filter((a) => a.employeeId === employeeId);
    return mockFetch(list);
  },
};
