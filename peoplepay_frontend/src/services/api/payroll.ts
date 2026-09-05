import { mockFetch, ApiResponse } from './client';
import { mockPayruns, mockPayslips, mockSalaryStructures, mockSalaryRules } from '../../data/mockPayroll';
import { Payrun, Payslip, SalaryStructure, SalaryRule } from '../../types/payroll';

export const payrollApi = {
  async getPayruns(): Promise<ApiResponse<Payrun[]>> {
    return mockFetch(mockPayruns);
  },

  async getPayrunById(id: string): Promise<ApiResponse<Payrun | null>> {
    const payrun = mockPayruns.find((p) => p.id === id) || null;
    return mockFetch(payrun);
  },

  async getPayslips(payrunId?: string): Promise<ApiResponse<Payslip[]>> {
    if (payrunId) {
      const list = mockPayslips.filter((ps) => ps.payrunId === payrunId);
      return mockFetch(list);
    }
    return mockFetch(mockPayslips);
  },

  async getPayslipById(id: string): Promise<ApiResponse<Payslip | null>> {
    const payslip = mockPayslips.find((ps) => ps.id === id) || null;
    return mockFetch(payslip);
  },

  async getStructures(): Promise<ApiResponse<SalaryStructure[]>> {
    return mockFetch(mockSalaryStructures);
  },

  async getRules(): Promise<ApiResponse<SalaryRule[]>> {
    return mockFetch(mockSalaryRules);
  },
};
