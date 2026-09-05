import { apiFetch, ApiResponse } from './client';
import { mockAttendance } from '../../data/mockAttendance';
import { Attendance } from '../../types/attendance';

function mapAttendance(apiItem: any): Attendance {
  const checkInDate = apiItem.check_in ? new Date(apiItem.check_in) : new Date();
  const checkInTime = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const checkOutTime = apiItem.check_out ? new Date(apiItem.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined;
  const dateStr = apiItem.check_in ? apiItem.check_in.split('T')[0] : new Date().toISOString().split('T')[0];

  const rawStatus = apiItem.status || 'present';
  const statusStr = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  return {
    id: String(apiItem.id),
    employeeId: String(apiItem.employee || '1'),
    employeeName: apiItem.employee_code ? `${apiItem.employee_code}` : (apiItem.employeeName || 'Employee'),
    department: 'Engineering',
    date: dateStr,
    checkIn: checkInTime,
    checkOut: checkOutTime,
    workedHours: typeof apiItem.worked_hours === 'number' ? apiItem.worked_hours : parseFloat(apiItem.worked_hours || '8.0'),
    overtimeHours: typeof apiItem.raw_hours === 'number' && apiItem.raw_hours > 8 ? roundTwo(apiItem.raw_hours - 8) : 0,
    status: (statusStr === 'Present' || statusStr === 'Late' || statusStr === 'Absent' || statusStr === 'Half Day' || statusStr === 'Overtime' ? statusStr : 'Present') as any,
    notes: apiItem.notes || '',
  };
}

function roundTwo(val: number) {
  return Math.round(val * 100) / 100;
}

export const attendanceApi = {
  async getAll(): Promise<ApiResponse<Attendance[]>> {
    const res = await apiFetch<any[]>('/api/attendance/', {}, mockAttendance);
    const data = Array.isArray(res.data) ? res.data.map(mapAttendance) : mockAttendance;
    return { ...res, data };
  },

  async getById(id: string): Promise<ApiResponse<Attendance | null>> {
    const res = await apiFetch<any>(`/api/attendance/${id}/`, {}, mockAttendance.find((a) => a.id === id) || null);
    const data = res.data ? mapAttendance(res.data) : null;
    return { ...res, data };
  },

  async getByEmployeeId(employeeId: string): Promise<ApiResponse<Attendance[]>> {
    const res = await apiFetch<any[]>(`/api/attendance/?employee=${employeeId}`, {}, mockAttendance.filter((a) => a.employeeId === employeeId));
    const data = Array.isArray(res.data) ? res.data.map(mapAttendance) : mockAttendance;
    return { ...res, data };
  },

  async checkIn(): Promise<ApiResponse<Attendance>> {
    const res = await apiFetch<any>('/api/attendance/check-in/', { method: 'POST' });
    return { ...res, data: mapAttendance(res.data) };
  },

  async checkOut(): Promise<ApiResponse<Attendance>> {
    const res = await apiFetch<any>('/api/attendance/check-out/', { method: 'POST' });
    return { ...res, data: mapAttendance(res.data) };
  },

  async approveCorrection(id: string, notes?: string): Promise<ApiResponse<Attendance>> {
    const res = await apiFetch<any>(`/api/attendance/${id}/approve-correction/`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return { ...res, data: mapAttendance(res.data) };
  },
};
