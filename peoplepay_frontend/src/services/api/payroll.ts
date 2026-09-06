import { apiFetch, ApiResponse } from './client';
import { mockPayruns, mockPayslips, mockSalaryStructures, mockSalaryRules } from '../../data/mockPayroll';
import { Payrun, Payslip, PayslipLine, SalaryStructure, SalaryRule } from '../../types/payroll';

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

function mapPayslip(apiItem: any): Payslip {
  if (!apiItem) return null as any;
  const lineItems = apiItem.line_items || {};
  const lines: PayslipLine[] = Object.entries(lineItems).map(([key, val], idx) => ({
    id: String(idx + 1),
    ruleCode: key,
    ruleName: key === 'BASIC' ? 'Basic Salary' : key === 'HRA' ? 'House Rent Allowance' : key === 'PF' ? 'Provident Fund' : key,
    category: (key === 'BASIC' ? 'Basic' : key === 'PF' ? 'Deduction' : 'Allowance') as any,
    amount: typeof val === 'number' ? val : parseFloat(String(val) || '0'),
  }));

  return {
    id: String(apiItem.id),
    reference: apiItem.payrun_reference ? `PS-${apiItem.payrun_reference}-${apiItem.employee_code || apiItem.employee}` : `PS-${apiItem.id}`,
    payrun: apiItem.payrun,
    payrunId: String(apiItem.payrun || ''),
    payrun_reference: apiItem.payrun_reference,
    payrunName: apiItem.payrun_reference || 'Payrun Batch',
    employee: apiItem.employee,
    employeeId: String(apiItem.employee || ''),
    employeeName: apiItem.employee_name || 'Employee',
    employee_name: apiItem.employee_name || 'Employee',
    employeeCode: apiItem.employee_code || 'EMP',
    employee_code: apiItem.employee_code || 'EMP',
    contract: apiItem.contract,
    contractId: String(apiItem.contract || ''),
    salaryStructureName: apiItem.salary_structure_name || 'Standard Structure',
    date_from: apiItem.date_from,
    date_to: apiItem.date_to,
    periodStart: apiItem.date_from || '2026-09-01',
    periodEnd: apiItem.date_to || '2026-09-30',
    basicWage: parseFloat(apiItem.basic || '0'),
    grossWage: parseFloat(apiItem.gross || '0'),
    totalDeductions: parseFloat(apiItem.total_deductions || '0'),
    netWage: parseFloat(apiItem.net || '0'),
    basic: apiItem.basic,
    gross: apiItem.gross,
    total_deductions: apiItem.total_deductions,
    net: apiItem.net,
    line_items: apiItem.line_items || {},
    adjustments: apiItem.adjustments || [],
    status: apiItem.status || 'draft',
    warning: apiItem.warning || '',
    is_excluded: Boolean(apiItem.is_excluded),
    expected_hours: apiItem.expected_hours,
    actual_hours: apiItem.actual_hours,
    worked_percentage: apiItem.worked_percentage,
    lines,
  };
}

function mapPayrun(apiItem: any): Payrun {
  if (!apiItem) return null as any;
  const payslips = (apiItem.payslips || []).map(mapPayslip);
  const totalEmployees = payslips.length;
  const totalGross = payslips.reduce((sum: number, p: Payslip) => sum + (p.grossWage || 0), 0);
  const totalDeductions = payslips.reduce((sum: number, p: Payslip) => sum + (p.totalDeductions || 0), 0);
  const totalNet = payslips.reduce((sum: number, p: Payslip) => sum + (p.netWage || 0), 0);

  return {
    id: String(apiItem.id),
    reference: apiItem.reference || `PR-${apiItem.id}`,
    name: apiItem.structure_name ? `${apiItem.structure_name} Batch` : 'Monthly Payroll Batch',
    structure: apiItem.structure,
    structure_name: apiItem.structure_name || 'Standard Structure',
    date_from: apiItem.date_from || '',
    date_to: apiItem.date_to || '',
    periodStart: apiItem.date_from || '',
    periodEnd: apiItem.date_to || '',
    paymentDate: apiItem.date_to || '',
    status: apiItem.status || 'draft',
    totalEmployees,
    totalGross,
    totalDeductions,
    totalNet,
    payslips,
    created_at: apiItem.created_at,
    updated_at: apiItem.updated_at,
  };
}

export const payrollApi = {
  async getPayruns(): Promise<ApiResponse<Payrun[]>> {
    const res = await apiFetch<any[]>('/api/payroll/payruns/', {}, mockPayruns);
    const data = Array.isArray(res.data) ? res.data.map(mapPayrun) : mockPayruns;
    return { ...res, data };
  },

  async getPayrunById(id: string): Promise<ApiResponse<Payrun | null>> {
    const res = await apiFetch<any>(`/api/payroll/payruns/${id}/`, {}, mockPayruns.find((p) => p.id === id) || null);
    const data = res.data ? mapPayrun(res.data) : null;
    return { ...res, data };
  },

  async createPayrun(payload: { structure: number; date_from: string; date_to: string; employee_ids?: number[] }): Promise<ApiResponse<Payrun>> {
    const res = await apiFetch<any>('/api/payroll/payruns/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapPayrun(res.data) };
  },

  async updatePayrun(id: string | number, payload: { structure?: number; date_from?: string; date_to?: string; employee_ids?: number[] }): Promise<ApiResponse<Payrun>> {
    const res = await apiFetch<any>(`/api/payroll/payruns/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapPayrun(res.data) };
  },

  async computePayrun(id: string | number): Promise<ApiResponse<Payrun>> {
    const res = await apiFetch<any>(`/api/payroll/payruns/${id}/compute/`, {
      method: 'POST',
    });
    return { ...res, data: mapPayrun(res.data) };
  },

  async validatePayrun(id: string | number): Promise<ApiResponse<Payrun>> {
    const res = await apiFetch<any>(`/api/payroll/payruns/${id}/validate/`, {
      method: 'POST',
    });
    return { ...res, data: mapPayrun(res.data) };
  },

  async markPaidPayrun(id: string | number): Promise<ApiResponse<Payrun>> {
    const res = await apiFetch<any>(`/api/payroll/payruns/${id}/mark-paid/`, {
      method: 'POST',
    });
    return { ...res, data: mapPayrun(res.data) };
  },

  async sendPayslips(id: string | number): Promise<ApiResponse<{ sent: number; skipped: number; skipped_employees: string[] }>> {
    const res = await apiFetch<any>(`/api/payroll/payruns/${id}/send-payslips/`, {
      method: 'POST',
    });
    return res;
  },


  async getPayslips(payrunId?: string): Promise<ApiResponse<Payslip[]>> {
    const url = payrunId ? `/api/payroll/payslips/?payrun=${payrunId}` : '/api/payroll/payslips/';
    const res = await apiFetch<any[]>(url, {}, mockPayslips);
    const data = Array.isArray(res.data) ? res.data.map(mapPayslip) : mockPayslips;
    return { ...res, data };
  },

  async getPayslipById(id: string): Promise<ApiResponse<Payslip | null>> {
    const res = await apiFetch<any>(`/api/payroll/payslips/${id}/`, {}, mockPayslips.find((ps) => ps.id === id) || null);
    const data = res.data ? mapPayslip(res.data) : null;
    return { ...res, data };
  },

  async addPayslipAdjustment(payslipId: string | number, payload: { label: string; amount: number }): Promise<ApiResponse<Payslip>> {
    const res = await apiFetch<any>(`/api/payroll/payslips/${payslipId}/add-adjustment/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, data: mapPayslip(res.data) };
  },

  async deletePayslipAdjustment(payslipId: string | number, adjustmentId: string | number): Promise<ApiResponse<Payslip>> {
    const res = await apiFetch<any>(`/api/payroll/payslips/${payslipId}/adjustments/${adjustmentId}/`, {
      method: 'DELETE',
    });
    return { ...res, data: mapPayslip(res.data) };
  },

  getPayslipPdfUrl(payslipId: string | number): string {
    return `/api/payroll/payslips/${payslipId}/pdf/`;
  },

  async downloadPayslipPdf(payslipId: string | number, filename?: string): Promise<void> {
    const token = localStorage.getItem('peoplepay_token') || localStorage.getItem('auth_token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const endpoint = `/api/payroll/payslips/${payslipId}/pdf/`;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      let errMsg = `Failed to download PDF (HTTP ${res.status})`;
      try {
        const json = await res.json();
        errMsg = json.detail || json.message || errMsg;
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errMsg);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `payslip_${payslipId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
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

  async deleteStructure(id: string): Promise<ApiResponse<any>> {
    return await apiFetch(`/api/payroll/structures/${id}/`, {
      method: 'DELETE',
    });
  },

  async deleteRule(id: string): Promise<ApiResponse<any>> {
    return await apiFetch(`/api/payroll/rules/${id}/`, {
      method: 'DELETE',
    });
  },
};

