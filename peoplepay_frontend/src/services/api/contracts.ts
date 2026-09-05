import { mockFetch, ApiResponse } from './client';
import { mockContracts } from '../../data/mockContracts';
import { Contract } from '../../types/contract';

export const contractsApi = {
  async getAll(): Promise<ApiResponse<Contract[]>> {
    return mockFetch(mockContracts);
  },

  async getById(id: string): Promise<ApiResponse<Contract | null>> {
    const contract = mockContracts.find((c) => c.id === id) || null;
    return mockFetch(contract);
  },

  async getByEmployeeId(employeeId: string): Promise<ApiResponse<Contract | null>> {
    const contract = mockContracts.find((c) => c.employeeId === employeeId) || null;
    return mockFetch(contract);
  },
};
