import { apiFetch, ApiResponse } from './client';
import { mockContracts } from '../../data/mockContracts';
import { Contract } from '../../types/contract';

function mapContract(apiItem: any): Contract {
  const rawState = apiItem.state || apiItem.status || 'running';
  const statusStr = rawState.charAt(0).toUpperCase() + rawState.slice(1);

  return {
    id: String(apiItem.id),
    reference: `CON-2026-${String(apiItem.id).padStart(3, '0')}`,
    employeeId: String(apiItem.employee || apiItem.id),
    employeeName: apiItem.employee_name || apiItem.employeeName || 'Employee',
    jobTitle: apiItem.job_position || apiItem.jobTitle || 'Software Engineer',
    department: apiItem.department || 'Engineering',
    contractType: 'Permanent',
    startDate: apiItem.date_start || apiItem.startDate || '2026-01-01',
    endDate: apiItem.date_end || apiItem.endDate || undefined,
    wage: typeof apiItem.wage === 'number' ? apiItem.wage : parseFloat(apiItem.wage || '85000'),
    wagePeriod: 'Monthly',
    salaryStructureId: '1',
    salaryStructureName: apiItem.salary_structure_placeholder || 'Standard Salary Structure',
    workingScheduleId: '1',
    workingScheduleName: 'Standard 40h Shift',
    status: (statusStr === 'Running' || statusStr === 'Draft' || statusStr === 'Expired' || statusStr === 'Cancelled' ? statusStr : 'Running') as any,
    notes: '',
  };
}

export const contractsApi = {
  async getAll(): Promise<ApiResponse<Contract[]>> {
    const res = await apiFetch<any[]>('/api/contracts/', {}, mockContracts);
    const data = Array.isArray(res.data) ? res.data.map(mapContract) : mockContracts;
    return { ...res, data };
  },

  async getById(id: string): Promise<ApiResponse<Contract | null>> {
    const res = await apiFetch<any>(`/api/contracts/${id}/`, {}, mockContracts.find((c) => c.id === id) || null);
    const data = res.data ? mapContract(res.data) : null;
    return { ...res, data };
  },

  async getByEmployeeId(employeeId: string): Promise<ApiResponse<Contract | null>> {
    const res = await apiFetch<any>(`/api/contracts/?employee=${employeeId}`, {}, mockContracts.find((c) => c.employeeId === employeeId) || null);
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { ...res, data: mapContract(res.data[0]) };
    }
    const data = res.data && !Array.isArray(res.data) ? mapContract(res.data) : null;
    return { ...res, data };
  },
};
