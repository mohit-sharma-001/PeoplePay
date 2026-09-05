import { apiFetch, ApiResponse } from './client';
import { mockPayruns, mockPayslips, mockSalaryStructures, mockSalaryRules } from '../../data/mockPayroll';
import { Payrun, Payslip, SalaryStructure, SalaryRule } from '../../types/payroll';

export const payrollApi = {
  async getPayruns(): Promise<ApiResponse<Payrun[]>> {
    return apiFetch('/api/payroll/payruns/', {}, mockPayruns);
  },

  async getPayrunById(id: string): Promise<ApiResponse<Payrun | null>> {
    return apiFetch(`/api/payroll/payruns/${id}/`, {}, mockPayruns.find((p) => p.id === id) || null);
  },

  async getPayslips(payrunId?: string): Promise<ApiResponse<Payslip[]>> {
    const url = payrunId ? `/api/payroll/payslips/?payrun=${payrunId}` : '/api/payroll/payslips/';
    const fallback = payrunId ? mockPayslips.filter((ps) => ps.payrunId === payrunId) : mockPayslips;
    return apiFetch(url, {}, fallback);
  },

  async getPayslipById(id: string): Promise<ApiResponse<Payslip | null>> {
    return apiFetch(`/api/payroll/payslips/${id}/`, {}, mockPayslips.find((ps) => ps.id === id) || null);
  },

  async getStructures(): Promise<ApiResponse<SalaryStructure[]>> {
    return apiFetch('/api/payroll/structures/', {}, mockSalaryStructures);
  },

  async getRules(): Promise<ApiResponse<SalaryRule[]>> {
    return apiFetch('/api/payroll/rules/', {}, mockSalaryRules);
  },
};
