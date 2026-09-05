import { apiFetch, ApiResponse } from './client';
import { mockPayruns, mockPayslips, mockSalaryStructures, mockSalaryRules } from '../../data/mockPayroll';
import { Payrun, Payslip, SalaryStructure, SalaryRule } from '../../types/payroll';

function mapSalaryStructure(apiItem: any): SalaryStructure {
  return {
    id: String(apiItem.id),
    code: apiItem.code || 'STD',
    name: apiItem.name || 'Standard Structure',
    type: 'Employee',
    ruleIds: (apiItem.rules || []).map((r: any) => String(r.id)),
    rules: (apiItem.rules || []).map(mapSalaryRule),
  };
}

function mapSalaryRule(apiItem: any): SalaryRule {
  const cat = apiItem.category ? (apiItem.category.charAt(0).toUpperCase() + apiItem.category.slice(1)) : 'Basic';
  return {
    id: String(apiItem.id),
    code: apiItem.code || 'RULE',
    name: apiItem.name || 'Salary Rule',
    category: (cat === 'Basic' || cat === 'Allowance' || cat === 'Gross' || cat === 'Deduction' || cat === 'Net' ? cat : 'Basic') as any,
    amountType: apiItem.amount_type === 'percentage' ? 'Percentage' : 'Fixed',
    amountValue: parseFloat(apiItem.amount || '0'),
    sequence: apiItem.id || 1,
    condition: 'True',
    description: '',
  };
}

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
    const res = await apiFetch<any[]>('/api/payroll/structures/', {}, mockSalaryStructures);
    const data = Array.isArray(res.data) ? res.data.map(mapSalaryStructure) : mockSalaryStructures;
    return { ...res, data };
  },

  async getRules(): Promise<ApiResponse<SalaryRule[]>> {
    const res = await apiFetch<any[]>('/api/payroll/rules/', {}, mockSalaryRules);
    const data = Array.isArray(res.data) ? res.data.map(mapSalaryRule) : mockSalaryRules;
    return { ...res, data };
  },

  async createStructure(payload: any): Promise<ApiResponse<SalaryStructure>> {
    const res = await apiFetch<any>('/api/payroll/structures/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapSalaryStructure(res.data) };
  },

  async createRule(payload: any): Promise<ApiResponse<SalaryRule>> {
    const res = await apiFetch<any>('/api/payroll/rules/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapSalaryRule(res.data) };
  },
};
