import { apiFetch, ApiResponse } from './client';
import { mockTimeOffRequests, mockTimeOffAllocations, mockTimeOffTypes } from '../../data/mockTimeOff';
import { TimeOffRequest, TimeOffAllocation, TimeOffType } from '../../types/timeoff';

function mapTimeOffRequest(apiItem: any): TimeOffRequest {
  const rawStatus = apiItem.status || 'submitted';
  let statusStr = 'To Approve';
  if (rawStatus === 'approved') statusStr = 'Approved';
  else if (rawStatus === 'refused') statusStr = 'Refused';
  else if (rawStatus === 'draft') statusStr = 'Draft';

  return {
    id: String(apiItem.id),
    reference: `REQ-2026-${String(apiItem.id).padStart(3, '0')}`,
    employeeId: String(apiItem.employee || '1'),
    employeeName: apiItem.employee_name || apiItem.employeeName || 'Employee',
    department: 'Engineering',
    timeOffTypeId: String(apiItem.time_off_type || '1'),
    timeOffTypeName: apiItem.time_off_type_name || apiItem.timeOffTypeName || 'Paid Time Off',
    startDate: apiItem.date_from || apiItem.startDate || '2026-01-01',
    endDate: apiItem.date_to || apiItem.endDate || '2026-01-02',
    durationDays: apiItem.duration || apiItem.durationDays || 1,
    reason: apiItem.reason || '',
    status: statusStr as any,
    approverName: apiItem.approved_by_name || apiItem.approverName || undefined,
    createdAt: apiItem.created_at || apiItem.createdAt || new Date().toISOString(),
  };
}

function mapTimeOffAllocation(apiItem: any): TimeOffAllocation {
  return {
    id: String(apiItem.id),
    employeeId: String(apiItem.employee || '1'),
    employeeName: apiItem.employee_name || apiItem.employeeName || 'Employee',
    department: 'Engineering',
    timeOffTypeId: String(apiItem.time_off_type || '1'),
    timeOffTypeName: apiItem.time_off_type_name || apiItem.timeOffTypeName || 'Paid Time Off',
    allocatedDays: parseFloat(apiItem.allocated_amount || apiItem.allocatedDays || '20'),
    usedDays: parseFloat(apiItem.used_amount || apiItem.usedDays || '0'),
    remainingDays: parseFloat(apiItem.remaining_amount || apiItem.remainingDays || '20'),
    period: '2026',
  };
}

function mapTimeOffType(apiItem: any): TimeOffType {
  return {
    id: String(apiItem.id),
    name: apiItem.name || 'Leave Type',
    code: apiItem.name ? apiItem.name.substring(0, 3).toUpperCase() : 'PTO',
    color: '#3B82F6',
    requiresApproval: apiItem.requires_approval ?? true,
    allocationMode: apiItem.requires_allocation ? 'Fixed' : 'Unlimited',
    unit: apiItem.unit || 'days',
    isPaid: apiItem.is_paid ?? true,
    requiresAllocation: apiItem.requires_allocation ?? true,
  };
}

export const timeOffApi = {
  async getRequests(params?: { status?: string; employee?: string }): Promise<ApiResponse<TimeOffRequest[]>> {
    let url = '/api/time-off/requests/';
    if (params) {
      const q = new URLSearchParams();
      if (params.status) q.append('status', params.status);
      if (params.employee) q.append('employee', params.employee);
      if (q.toString()) url += `?${q.toString()}`;
    }
    const res = await apiFetch<any[]>(url, {}, mockTimeOffRequests);
    const data = Array.isArray(res.data) ? res.data.map(mapTimeOffRequest) : mockTimeOffRequests;
    return { ...res, data };
  },

  async getRequestById(id: string): Promise<ApiResponse<TimeOffRequest | null>> {
    const res = await apiFetch<any>(`/api/time-off/requests/${id}/`, {}, mockTimeOffRequests.find((r) => r.id === id) || null);
    const data = res.data ? mapTimeOffRequest(res.data) : null;
    return { ...res, data };
  },

  async getAllocations(): Promise<ApiResponse<TimeOffAllocation[]>> {
    const res = await apiFetch<any[]>('/api/time-off/allocations/', {}, mockTimeOffAllocations);
    const data = Array.isArray(res.data) ? res.data.map(mapTimeOffAllocation) : mockTimeOffAllocations;
    return { ...res, data };
  },

  async getAllocationsByEmployee(employeeId?: string, timeOffTypeId?: string): Promise<ApiResponse<TimeOffAllocation[]>> {
    let url = '/api/time-off/allocations/';
    const params = new URLSearchParams();
    if (employeeId) params.append('employee', employeeId);
    if (timeOffTypeId) params.append('time_off_type', timeOffTypeId);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await apiFetch<any[]>(url, {}, mockTimeOffAllocations);
    const data = Array.isArray(res.data) ? res.data.map(mapTimeOffAllocation) : mockTimeOffAllocations;
    return { ...res, data };
  },

  async getTypes(): Promise<ApiResponse<TimeOffType[]>> {
    const res = await apiFetch<any[]>('/api/time-off/types/', {}, mockTimeOffTypes);
    const data = Array.isArray(res.data) ? res.data.map(mapTimeOffType) : mockTimeOffTypes;
    return { ...res, data };
  },

  async createType(payload: {
    name: string;
    unit: string;
    requires_allocation: boolean;
    is_paid: boolean;
    requires_approval: boolean;
  }): Promise<ApiResponse<TimeOffType>> {
    const res = await apiFetch<any>('/api/time-off/types/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, data: res.data ? mapTimeOffType(res.data) : (res as any) };
  },

  async bulkAllocateType(
    typeId: string,
    payload: {
      allocated_amount: number;
      valid_from: string;
      valid_until?: string;
    }
  ): Promise<ApiResponse<{ created: number; skipped: number }>> {
    const res = await apiFetch<any>(`/api/time-off/types/${typeId}/bulk-allocate/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  async createRequest(payload: any): Promise<ApiResponse<any>> {
    const res = await apiFetch<any>('/api/time-off/requests/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  async approveRequest(id: string): Promise<ApiResponse<TimeOffRequest>> {
    const res = await apiFetch<any>(`/api/time-off/requests/${id}/approve/`, { method: 'POST' });
    return { ...res, data: mapTimeOffRequest(res.data) };
  },

  async refuseRequest(id: string): Promise<ApiResponse<TimeOffRequest>> {
    const res = await apiFetch<any>(`/api/time-off/requests/${id}/refuse/`, { method: 'POST' });
    return { ...res, data: mapTimeOffRequest(res.data) };
  },
};
