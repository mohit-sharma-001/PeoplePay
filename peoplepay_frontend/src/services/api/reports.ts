import { apiFetch, ApiResponse } from './client';

export interface DepartmentPayrollCost {
  department: string;
  headcount: number;
  total_basic: number;
  total_allowances: number;
  total_overtime: number;
  total_deductions: number;
  total_net: number;
}

export interface PayrollCostSummary {
  total_headcount: number;
  total_basic: number;
  total_allowances: number;
  total_overtime: number;
  total_deductions: number;
  total_net: number;
}

export interface PayrollCostReportData {
  month: string;
  date_from: string;
  date_to: string;
  departments: DepartmentPayrollCost[];
  summary: PayrollCostSummary;
}

export interface LeaveBalance {
  employee_code: string;
  employee_name: string;
  department: string;
  leave_type: string;
  allocated_amount: number;
  used_amount: number;
  remaining_amount: number;
  daily_rate: number;
  liability_valuation: number;
}

export interface UtilizationTrendItem {
  month: string;
  approved_requests: number;
}

export interface LeaveLiabilityReportData {
  leave_balances: LeaveBalance[];
  utilization_trend: UtilizationTrendItem[];
  total_liability: number;
}

async function downloadCsvFile(endpoint: string, filename: string): Promise<void> {
  const token = localStorage.getItem('peoplepay_token') || localStorage.getItem('auth_token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let errMsg = `Failed to download CSV (HTTP ${res.status})`;
    try {
      const json = await res.json();
      errMsg = json.detail || json.error || json.message || errMsg;
    } catch {
      // Non-json error
    }
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const reportsApi = {
  async getPayrollCost(month?: string): Promise<ApiResponse<PayrollCostReportData>> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await apiFetch<PayrollCostReportData>(`/api/reports/payroll-cost/${query}`);
    return res;
  },

  async downloadPayrollCostCsv(month?: string): Promise<void> {
    const qMonth = month ? `month=${encodeURIComponent(month)}&` : '';
    const endpoint = `/api/reports/payroll-cost/?${qMonth}format=csv`;
    const fn = `payroll_cost_report_${month || 'current'}.csv`;
    await downloadCsvFile(endpoint, fn);
  },

  async getLeaveLiability(): Promise<ApiResponse<LeaveLiabilityReportData>> {
    const res = await apiFetch<LeaveLiabilityReportData>('/api/reports/leave-liability/');
    return res;
  },

  async downloadLeaveLiabilityCsv(): Promise<void> {
    const endpoint = '/api/reports/leave-liability/?format=csv';
    await downloadCsvFile(endpoint, 'time_off_leave_liability_report.csv');
  },

  async downloadFullLedgerCsv(): Promise<void> {
    const endpoint = '/api/reports/full-ledger/?format=csv';
    await downloadCsvFile(endpoint, 'payroll_full_ledger.csv');
  },
};
