import { apiFetch, ApiResponse } from './client';
import { mockAttendance } from '../../data/mockAttendance';
import { Attendance } from '../../types/attendance';

export const attendanceApi = {
  async getAll(): Promise<ApiResponse<Attendance[]>> {
    return apiFetch('/api/attendance/', {}, mockAttendance);
  },

  async getById(id: string): Promise<ApiResponse<Attendance | null>> {
    return apiFetch(`/api/attendance/${id}/`, {}, mockAttendance.find((a) => a.id === id) || null);
  },

  async getByEmployeeId(employeeId: string): Promise<ApiResponse<Attendance[]>> {
    return apiFetch(`/api/attendance/?employee=${employeeId}`, {}, mockAttendance.filter((a) => a.employeeId === employeeId));
  },

  async checkIn(): Promise<ApiResponse<Attendance>> {
    return apiFetch('/api/attendance/check-in/', { method: 'POST' });
  },

  async checkOut(): Promise<ApiResponse<Attendance>> {
    return apiFetch('/api/attendance/check-out/', { method: 'POST' });
  },

  async approveCorrection(id: string, notes?: string): Promise<ApiResponse<Attendance>> {
    return apiFetch(`/api/attendance/${id}/approve-correction/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
};
