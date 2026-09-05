import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Calendar, Banknote, ArrowRight, Clock } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { employeesApi } from '../../services/api/employees';
import { timeOffApi } from '../../services/api/timeoff';
import { payrollApi } from '../../services/api/payroll';
import { formatCurrency } from '../../utils/formatters';
import { Employee } from '../../types/employee';
import { TimeOffRequest } from '../../types/timeoff';
import { Payrun } from '../../types/payroll';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      const [empRes, timeRes, payRes] = await Promise.all([
        employeesApi.getAll().catch((err) => {
          console.warn('Dashboard failed to load employees:', err);
          return { data: [] };
        }),
        timeOffApi.getRequests().catch((err) => {
          console.warn('Dashboard failed to load timeoff requests:', err);
          return { data: [] };
        }),
        payrollApi.getPayruns().catch((err) => {
          console.warn('Dashboard failed to load payruns:', err);
          return { data: [] };
        }),
      ]);

      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setTimeOffRequests(Array.isArray(timeRes.data) ? timeRes.data : []);
      setPayruns(Array.isArray(payRes.data) ? payRes.data : []);
      setIsLoading(false);
    }
    loadDashboardData();
  }, []);

  const totalEmployees = (employees || []).length;
  const activeEmployees = (employees || []).filter((e) => (e.status || '').toLowerCase() === 'active').length;
  const pendingTimeOff = (timeOffRequests || []).filter((r) => {
    const s = (r.status || '').toLowerCase();
    return s === 'submitted' || s === 'to approve';
  }).length;
  const latestPayrun = (payruns && payruns.length > 0) ? payruns[payruns.length - 1] : null;

  return (
    <div className="space-y-6 min-h-[calc(100vh-6rem)]">
      {/* Main Foreground Content Layer */}
      <div className="space-y-6">
        <PageHeader
          title="Executive Overview"
          subtitle="Operational metrics for HR, Contracts, Time Off, and Payroll processing."
          breadcrumbs={[{ label: 'Overview' }]}
          actions={
            <Button onClick={() => navigate('/payroll/payruns')}>
              View Payruns
            </Button>
          }
        />

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Employees */}
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/employees')}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Headcount</p>
                <h2 className="text-2xl font-black text-[var(--brand-primary)] mt-1">{isLoading ? '...' : totalEmployees}</h2>
                <span className="text-xs text-[var(--text-secondary)] mt-0.5 inline-block font-medium">Registered employees</span>
              </div>
              <div className="p-3 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* Active Employees */}
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/employees')}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Active Rate</p>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mt-1">{isLoading ? '...' : activeEmployees}</h2>
                <span className="text-xs text-emerald-600 font-bold mt-0.5 inline-block">
                  {isLoading ? '...' : `${Math.round((activeEmployees / (totalEmployees || 1)) * 100)}% active workforce`}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Time Off */}
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/time-off/requests?status=submitted')}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pending Leave Req.</p>
                <h2 className="text-2xl font-black text-[#F59E0B] mt-1">{isLoading ? '...' : pendingTimeOff}</h2>
                <span className="text-xs text-[#D97706] font-semibold mt-0.5 inline-block">Awaiting approval</span>
              </div>
              <div className="p-3 bg-[#F59E0B]/10 text-[#F59E0B] rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* Current Payroll Status */}
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/payroll')}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Current Payrun</p>
                <div className="p-2 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded-lg">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[var(--text-primary)]">{latestPayrun?.reference || 'PR-2026-09'}</span>
                  {latestPayrun && <StatusBadge status={latestPayrun.status} size="sm" />}
                </div>
                <span className="text-xs text-[var(--text-secondary)] mt-0.5 block font-semibold">
                  {latestPayrun ? formatCurrency(Number(latestPayrun.totalNet) || 0) : formatCurrency(0)} Net
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Sections Grid */}
        <div className="w-full">
          {/* Pending Requests & Approvals */}
          <Card className="w-full">
            <CardHeader>
              <div>
                <CardTitle>Recent Leave Requests</CardTitle>
                <p className="text-xs text-[var(--text-secondary)]">Requires manager review or validation</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/time-off/requests')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[var(--border-color)]">
              {timeOffRequests && timeOffRequests.length > 0 ? (
                (timeOffRequests || []).slice(0, 5).map((req) => (
                  <div key={req.id} className="p-4 flex items-center justify-between hover:bg-[var(--table-row-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{req.employeeName || 'Employee'}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {req.timeOffTypeName || 'Leave'} • {req.durationDays || 1} day(s) ({req.startDate || '2026-01-01'})
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={req.status || 'To Approve'} size="sm" />
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  No leave requests found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
