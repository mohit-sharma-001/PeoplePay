import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Calendar, Banknote, ArrowRight, Clock } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { OverviewCreativeBackground } from './components/OverviewCreativeBackground';
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
      try {
        const [empRes, timeRes, payRes] = await Promise.all([
          employeesApi.getAll(),
          timeOffApi.getRequests(),
          payrollApi.getPayruns(),
        ]);
        setEmployees(empRes.data);
        setTimeOffRequests(timeRes.data);
        setPayruns(payRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const pendingTimeOff = timeOffRequests.filter((r) => r.status === 'To Approve').length;
  const latestPayrun = payruns[payruns.length - 1] || null;

  return (
    <div className="relative space-y-6 overflow-hidden min-h-[calc(100vh-6rem)]">
      {/* Creative Workforce Constellation & Wave Vector Background (Active on Light and Dark themes for Executive Overview) */}
      <OverviewCreativeBackground />

      {/* Main Foreground Content Layer */}
      <div className="relative z-10 space-y-6">
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

          {/* Pending Time Off (Orange Accent) */}
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/time-off/requests')}>
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
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Current Payrun</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-base font-bold text-[var(--text-primary)]">{latestPayrun?.reference || 'PR-2026-09'}</span>
                  {latestPayrun && <StatusBadge status={latestPayrun.status} size="sm" />}
                </div>
                <span className="text-xs text-[var(--text-secondary)] mt-0.5 block font-semibold">
                  {latestPayrun ? formatCurrency(latestPayrun.totalNet) : '$0.00'} Net
                </span>
              </div>
              <div className="p-3 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded-xl">
                <Banknote className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Requests & Approvals */}
          <Card className="lg:col-span-2">
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
              {timeOffRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-[var(--table-row-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{req.employeeName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {req.timeOffTypeName} • {req.durationDays} day(s) ({req.startDate})
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Activity Stream */}
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Payrun PR-2026-08 Executed</p>
                  <p className="text-[var(--text-secondary)]">Net payout $63,525.00 completed</p>
                  <span className="text-[10px] text-[var(--text-muted)]">2 hours ago</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">New Employee Contract Added</p>
                  <p className="text-[var(--text-secondary)]">Aria Montgomery (Lead UX Architect)</p>
                  <span className="text-[10px] text-[var(--text-muted)]">1 day ago</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Time Off Allocation Updated</p>
                  <p className="text-[var(--text-secondary)]">Paid Annual Leave balances refreshed</p>
                  <span className="text-[10px] text-[var(--text-muted)]">3 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
