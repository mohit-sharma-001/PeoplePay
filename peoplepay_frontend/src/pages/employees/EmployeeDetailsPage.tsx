import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Calendar as CalendarIcon, Briefcase, FileText, Clock, Layers } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { employeesApi } from '../../services/api/employees';
import { contractsApi } from '../../services/api/contracts';
import { attendanceApi } from '../../services/api/attendance';
import { Employee } from '../../types/employee';
import { Contract } from '../../types/contract';
import { Attendance } from '../../types/attendance';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEmployee() {
      setIsLoading(true);
      if (!id) return;
      const empRes = await employeesApi.getById(id);
      setEmployee(empRes.data);

      if (empRes.data) {
        const [conRes, attRes] = await Promise.all([
          contractsApi.getByEmployeeId(empRes.data.id),
          attendanceApi.getByEmployeeId(empRes.data.id),
        ]);
        setContract(conRes.data);
        setAttendance(attRes.data);
      }
      setIsLoading(false);
    }
    loadEmployee();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading employee record...</div>;
  }

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Employee Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested employee ID does not exist.</p>
        <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        subtitle={`${employee.jobTitle} • ${employee.department}`}
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: `${employee.firstName} ${employee.lastName}` },
        ]}
      />

      {/* Header Profile Card */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar src={employee.avatarUrl} name={`${employee.firstName} ${employee.lastName}`} size="xl" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h2>
                <StatusBadge status={employee.status} />
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{employee.code}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {employee.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {employee.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {employee.workLocation}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
              Manage Contract
            </Button>
            <Button size="sm">Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs Hub */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', icon: <Briefcase className="w-4 h-4" /> },
          { id: 'contract', label: 'Contract Details', icon: <FileText className="w-4 h-4" /> },
          { id: 'attendance', label: 'Attendance Records', icon: <Clock className="w-4 h-4" />, count: attendance.length },
          { id: 'timeoff', label: 'Time Off & Allocations', icon: <Layers className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-semibold text-slate-900">{employee.department}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Job Title</span>
                <span className="font-semibold text-slate-900">{employee.jobTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Manager</span>
                <span className="font-semibold text-slate-900">{employee.managerName || 'None'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Joining Date</span>
                <span className="font-semibold text-slate-900">{formatDate(employee.joiningDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Working Schedule</span>
                <span className="font-semibold text-blue-600">{employee.workingScheduleName}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Contract Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {contract ? (
                <>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Contract Ref</span>
                    <span className="font-mono font-semibold text-slate-900">{contract.reference}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Contract Type</span>
                    <span className="font-semibold text-slate-900">{contract.contractType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Monthly Wage</span>
                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(contract.wage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Salary Structure</span>
                    <span className="font-semibold text-purple-600">{contract.salaryStructureName}</span>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No active contract assigned to this employee.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'contract' && (
        <Card>
          <CardHeader>
            <CardTitle>Full Contract Details</CardTitle>
          </CardHeader>
          <CardContent>
            {contract ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Contract Reference</span>
                  <p className="font-mono font-bold text-sm text-slate-900">{contract.reference}</p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Status</span>
                  <StatusBadge status={contract.status} />
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Gross Wage</span>
                  <p className="font-bold text-sm text-slate-900">{formatCurrency(contract.wage)} / {contract.wagePeriod}</p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Start Date</span>
                  <p className="font-semibold text-slate-800">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">End Date</span>
                  <p className="font-semibold text-slate-800">{contract.endDate ? formatDate(contract.endDate) : 'Indefinite'}</p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Salary Structure</span>
                  <p className="font-semibold text-blue-600">{contract.salaryStructureName}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No contract details available.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attendance.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {attendance.map((att) => (
                  <div key={att.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{formatDate(att.date)}</p>
                      <p className="text-slate-500">In: {att.checkIn} • Out: {att.checkOut || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-slate-700">{att.workedHours} hrs</span>
                      <StatusBadge status={att.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-xs text-slate-500">No attendance entries recorded for this employee.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeoff' && (
        <Card>
          <CardHeader>
            <CardTitle>Time Off Balances & Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Time off request and allocation records are synchronized with the central Time Off engine.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
