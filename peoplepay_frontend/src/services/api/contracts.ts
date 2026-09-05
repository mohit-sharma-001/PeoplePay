import { apiFetch, ApiResponse } from './client';
import { mockContracts } from '../../data/mockContracts';
import { Contract } from '../../types/contract';

export const contractsApi = {
  async getAll(): Promise<ApiResponse<Contract[]>> {
    return apiFetch('/api/contracts/', {}, mockContracts);
  },

  async getById(id: string): Promise<ApiResponse<Contract | null>> {
    return apiFetch(`/api/contracts/${id}/`, {}, mockContracts.find((c) => c.id === id) || null);
  },

  async getByEmployeeId(employeeId: string): Promise<ApiResponse<Contract | null>> {
    return apiFetch(`/api/contracts/?employee=${employeeId}`, {}, mockContracts.find((c) => c.employeeId === employeeId) || null);
  },
};
