export type PayrunStatus = 'draft' | 'computed' | 'validated' | 'paid' | 'Draft' | 'In Progress' | 'Done' | 'Cancelled';
export type PayslipStatus = 'draft' | 'computed' | 'validated' | 'paid' | 'Draft' | 'Verified' | 'Paid' | 'Cancelled';

export type SalaryRuleCategory = 'Basic' | 'Allowance' | 'Gross' | 'Deduction' | 'Net';

export interface SalaryRule {
  id: string;
  code: string;
  name: string;
  category: SalaryRuleCategory;
  amountType: 'Percentage' | 'Fixed' | 'Python Code';
  amountValue: number;
  sequence: number;
  condition: string;
  description?: string;
}

export interface SalaryStructure {
  id: string;
  code: string;
  name: string;
  type: 'Employee' | 'Worker' | 'Executive';
  ruleIds: string[];
  rules?: SalaryRule[];
}

export interface PayslipAdjustment {
  id: number | string;
  payslip: number | string;
  label: string;
  amount: number | string;
  added_by?: number | string;
  added_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayslipLine {
  id: string;
  ruleCode: string;
  ruleName: string;
  category: SalaryRuleCategory;
  amount: number;
}

export interface Payslip {
  id: string | number;
  reference?: string;
  payrun?: string | number;
  payrunId?: string;
  payrun_reference?: string;
  payrunName?: string;
  employee: string | number;
  employeeId?: string;
  employeeName?: string;
  employee_name?: string;
  employeeCode?: string;
  employee_code?: string;
  contract?: string | number | null;
  contractId?: string;
  salaryStructureName?: string;
  date_from?: string;
  date_to?: string;
  periodStart?: string;
  periodEnd?: string;
  basicWage?: number;
  grossWage?: number;
  totalDeductions?: number;
  netWage?: number;
  basic?: number | string;
  gross?: number | string;
  total_deductions?: number | string;
  net?: number | string;
  line_items?: Record<string, number>;
  adjustments?: PayslipAdjustment[];
  status: string;
  warning?: string;
  is_excluded?: boolean;
  expected_hours?: number | string | null;
  actual_hours?: number | string | null;
  worked_percentage?: number | string | null;
  lines?: PayslipLine[];
}

export interface Payrun {
  id: string | number;
  reference: string;
  name?: string;
  structure: number | string;
  structure_name?: string;
  date_from: string;
  date_to: string;
  periodStart?: string;
  periodEnd?: string;
  paymentDate?: string;
  status: string;
  totalEmployees?: number;
  totalGross?: number;
  totalDeductions?: number;
  totalNet?: number;
  payslips?: Payslip[];
  created_at?: string;
  updated_at?: string;
}

