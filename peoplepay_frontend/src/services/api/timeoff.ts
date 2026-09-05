import { mockFetch, ApiResponse } from './client';
import { mockTimeOffRequests, mockTimeOffAllocations, mockTimeOffTypes } from '../../data/mockTimeOff';
import { TimeOffRequest, TimeOffAllocation, TimeOffType } from '../../types/timeoff';

export const timeOffApi = {
  async getRequests(): Promise<ApiResponse<TimeOffRequest[]>> {
    return mockFetch(mockTimeOffRequests);
  },

  async getRequestById(id: string): Promise<ApiResponse<TimeOffRequest | null>> {
    const req = mockTimeOffRequests.find((r) => r.id === id) || null;
    return mockFetch(req);
  },

  async getAllocations(): Promise<ApiResponse<TimeOffAllocation[]>> {
    return mockFetch(mockTimeOffAllocations);
  },

  async getTypes(): Promise<ApiResponse<TimeOffType[]>> {
    return mockFetch(mockTimeOffTypes);
  },
};
