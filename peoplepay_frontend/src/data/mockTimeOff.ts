import { TimeOffRequest, TimeOffAllocation, TimeOffType } from '../types/timeoff';

export const mockTimeOffTypes: TimeOffType[] = [
  {
    id: 'tot-1',
    name: 'Paid Annual Leave',
    code: 'LEAVE_PAID',
    color: '#2563eb', // Blue
    requiresApproval: true,
    allocationMode: 'Fixed',
  },
  {
    id: 'tot-2',
    name: 'Sick Leave',
    code: 'LEAVE_SICK',
    color: '#e11d48', // Rose
    requiresApproval: false,
    allocationMode: 'Fixed',
  },
  {
    id: 'tot-3',
    name: 'Parental Leave',
    code: 'LEAVE_PARENTAL',
    color: '#7c3aed', // Purple
    requiresApproval: true,
    allocationMode: 'Fixed',
  },
  {
    id: 'tot-4',
    name: 'Unpaid Leave',
    code: 'LEAVE_UNPAID',
    color: '#64748b', // Slate
    requiresApproval: true,
    allocationMode: 'Unlimited',
  },
];

export const mockTimeOffRequests: TimeOffRequest[] = [
  {
    id: 'tor-1',
    reference: 'REQ-2026-042',
    employeeId: 'emp-7',
    employeeName: 'Michael Chen',
    department: 'Product Management',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Paid Annual Leave',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    durationDays: 8,
    reason: 'Family summer vacation in Europe',
    status: 'Approved',
    approverName: 'Alexander Wright',
    createdAt: '2026-08-15',
  },
  {
    id: 'tor-2',
    reference: 'REQ-2026-048',
    employeeId: 'emp-6',
    employeeName: 'Elena Rostova',
    department: 'Engineering',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Paid Annual Leave',
    startDate: '2026-09-18',
    endDate: '2026-09-22',
    durationDays: 3,
    reason: 'Attending React Advanced Conference',
    status: 'To Approve',
    createdAt: '2026-09-02',
  },
  {
    id: 'tor-3',
    reference: 'REQ-2026-050',
    employeeId: 'emp-4',
    employeeName: 'Sophia Patel',
    department: 'Finance & Payroll',
    timeOffTypeId: 'tot-2',
    timeOffTypeName: 'Sick Leave',
    startDate: '2026-09-08',
    endDate: '2026-09-08',
    durationDays: 1,
    reason: 'Medical checkup and lab tests',
    status: 'To Approve',
    createdAt: '2026-09-04',
  },
];

export const mockTimeOffAllocations: TimeOffAllocation[] = [
  {
    id: 'toa-1',
    employeeId: 'emp-1',
    employeeName: 'Alexander Wright',
    department: 'Executive',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Paid Annual Leave',
    allocatedDays: 25,
    usedDays: 5,
    remainingDays: 20,
    period: '2026',
  },
  {
    id: 'toa-2',
    employeeId: 'emp-6',
    employeeName: 'Elena Rostova',
    department: 'Engineering',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Paid Annual Leave',
    allocatedDays: 20,
    usedDays: 4,
    remainingDays: 16,
    period: '2026',
  },
  {
    id: 'toa-3',
    employeeId: 'emp-7',
    employeeName: 'Michael Chen',
    department: 'Product Management',
    timeOffTypeId: 'tot-1',
    timeOffTypeName: 'Paid Annual Leave',
    allocatedDays: 20,
    usedDays: 12,
    remainingDays: 8,
    period: '2026',
  },
];
