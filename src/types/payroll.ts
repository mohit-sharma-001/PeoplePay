export type PayrunStatus = 'Draft' | 'In Progress' | 'Done' | 'Cancelled';
export type PayslipStatus = 'Draft' | 'Verified' | 'Paid' | 'Cancelled';

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

export interface Payrun {
  id: string;
  reference: string; // e.g. PR-2026-08
  name: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  status: PayrunStatus;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  createdAt: string;
}

export interface PayslipLine {
  id: string;
  ruleCode: string;
  ruleName: string;
  category: SalaryRuleCategory;
  amount: number;
}

export interface Payslip {
  id: string;
  reference: string;
  payrunId: string;
  payrunName: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  contractId: string;
  salaryStructureName: string;
  periodStart: string;
  periodEnd: string;
  basicWage: number;
  grossWage: number;
  totalDeductions: number;
  netWage: number;
  status: PayslipStatus;
  lines: PayslipLine[];
}
