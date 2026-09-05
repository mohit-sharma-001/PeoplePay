import { apiFetch, ApiResponse } from './client';
import { mockTimeOffRequests, mockTimeOffAllocations, mockTimeOffTypes } from '../../data/mockTimeOff';
import { TimeOffRequest, TimeOffAllocation, TimeOffType } from '../../types/timeoff';

export const timeOffApi = {
  async getRequests(): Promise<ApiResponse<TimeOffRequest[]>> {
    return apiFetch('/api/time-off/requests/', {}, mockTimeOffRequests);
  },

  async getRequestById(id: string): Promise<ApiResponse<TimeOffRequest | null>> {
    return apiFetch(`/api/time-off/requests/${id}/`, {}, mockTimeOffRequests.find((r) => r.id === id) || null);
  },

  async getAllocations(): Promise<ApiResponse<TimeOffAllocation[]>> {
    return apiFetch('/api/time-off/allocations/', {}, mockTimeOffAllocations);
  },

  async getTypes(): Promise<ApiResponse<TimeOffType[]>> {
    return apiFetch('/api/time-off/types/', {}, mockTimeOffTypes);
  },

  async approveRequest(id: string): Promise<ApiResponse<TimeOffRequest>> {
    return apiFetch(`/api/time-off/requests/${id}/approve/`, { method: 'POST' });
  },

  async refuseRequest(id: string): Promise<ApiResponse<TimeOffRequest>> {
    return apiFetch(`/api/time-off/requests/${id}/refuse/`, { method: 'POST' });
  },
};
