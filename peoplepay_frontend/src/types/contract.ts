export type ContractStatus = 'Draft' | 'Running' | 'Expired' | 'Cancelled';
export type ContractType = 'Permanent' | 'Contractor' | 'Probation' | 'Internship';

export interface Contract {
  id: string;
  reference: string; // e.g. CON-2026-089
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  wage: number; // Monthly gross wage
  wagePeriod: 'Monthly' | 'Hourly' | 'Annual';
  salaryStructureId: string;
  salaryStructureName: string;
  workingScheduleId: string;
  workingScheduleName: string;
  status: ContractStatus;
  notes?: string;
}
