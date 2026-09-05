export type TimeOffStatus = 'Draft' | 'To Approve' | 'Approved' | 'Refused';

export interface TimeOffType {
  id: string;
  name: string;
  code: string;
  color: string;
  requiresApproval: boolean;
  allocationMode: 'Fixed' | 'Accrual' | 'Unlimited';
}

export interface TimeOffRequest {
  id: string;
  reference: string;
  employeeId: string;
  employeeName: string;
  department: string;
  timeOffTypeId: string;
  timeOffTypeName: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: TimeOffStatus;
  approverName?: string;
  createdAt: string;
}

export interface TimeOffAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  timeOffTypeId: string;
  timeOffTypeName: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  period: string; // e.g. "2026"
}
