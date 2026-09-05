import { User } from '../types/auth';

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Alexander Wright',
    email: 'admin@peoplepay360.io',
    role: 'Admin',
    department: 'Executive',
    employeeId: 'EMP-2026-001',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-2',
    name: 'Eleanor Vance',
    email: 'hr.manager@peoplepay360.io',
    role: 'HR Manager',
    department: 'Human Resources',
    employeeId: 'EMP-2026-002',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-3',
    name: 'David Sterling',
    email: 'payroll.mgr@peoplepay360.io',
    role: 'HR Payroll Manager',
    department: 'Finance & Payroll',
    employeeId: 'EMP-2026-003',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-4',
    name: 'Sophia Patel',
    email: 'payroll.user@peoplepay360.io',
    role: 'HR Payroll User',
    department: 'Finance & Payroll',
    employeeId: 'EMP-2026-004',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr-5',
    name: 'Marcus Brody',
    email: 'marcus.brody@peoplepay360.io',
    role: 'Employee',
    department: 'Engineering',
    employeeId: 'EMP-2026-005',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
];
