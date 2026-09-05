import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Briefcase,
  FileText,
  Clock,
  Layers,
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Loader2,
  Edit3,
  Shield,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { employeesApi } from '../../services/api/employees';
import { contractsApi } from '../../services/api/contracts';
import { attendanceApi } from '../../services/api/attendance';
import { timeOffApi } from '../../services/api/timeoff';
import { apiFetch, ApiError } from '../../services/api/client';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { Employee } from '../../types/employee';
import { Contract } from '../../types/contract';
import { Attendance } from '../../types/attendance';
import { TimeOffAllocation } from '../../types/timeoff';
import { formatDate, formatCurrency } from '../../utils/formatters';

const SYSTEM_ROLE_OPTIONS = [
  { value: 'Employee', label: 'Employee' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'HR Payroll User', label: 'HR Payroll User' },
  { value: 'HR Payroll Manager', label: 'HR Payroll Manager' },
  { value: 'Admin', label: 'Admin' },
];



function generateSecurePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const DEPARTMENT_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'HR', label: 'HR' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
];

export const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Create Login Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [jobPosition, setJobPosition] = useState('');
  const [dateJoined, setDateJoined] = useState('');
  const [statusVal, setStatusVal] = useState('active');
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [userAccountInfo, setUserAccountInfo] = useState<{ username: string; roles: string[] } | null>(null);

  // User Account ID & Role State
  const [userAccountId, setUserAccountId] = useState<number | string | null>(null);
  const [selectedCreateRole, setSelectedCreateRole] = useState('Employee');

  // Change Role Modal State (Admin Only)
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [selectedChangeRole, setSelectedChangeRole] = useState('Employee');
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [changeRoleError, setChangeRoleError] = useState<string | null>(null);

  const isAdmin = Boolean(
    currentUser?.roles?.some((r) => r === 'Admin') ||
    currentUser?.role === 'Admin'
  );

  const loadEmployeeData = async () => {
    setIsLoading(true);
    if (!id) return;
    const empRes = await employeesApi.getById(id);
    setEmployee(empRes.data);

    if (empRes.data) {
      const [conRes, attRes, alcRes, usrRes] = await Promise.all([
        contractsApi.getByEmployeeId(empRes.data.id),
        attendanceApi.getByEmployeeId(empRes.data.id),
        timeOffApi.getAllocationsByEmployee(empRes.data.id),
        apiFetch<any[]>(`/api/auth/users/?employee_id=${empRes.data.id}`),
      ]);
      setContract(conRes.data);
      setAttendance(attRes.data);
      setAllocations(alcRes.data || []);

      if (Array.isArray(usrRes.data) && usrRes.data.length > 0) {
        const uObj = usrRes.data[0];
        setUserAccountId(uObj.id);
        setUserAccountInfo({
          username: uObj.username,
          roles: uObj.roles || ['Employee'],
        });
      } else if (empRes.data.user) {
        setUserAccountId((empRes.data.user as any).id || null);
        setUserAccountInfo({
          username: empRes.data.user.username || 'Linked User',
          roles: (empRes.data.user as any).roles || ['Employee'],
        });
      } else {
        setUserAccountId(null);
        setUserAccountInfo(null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEmployeeData();
  }, [id]);

  const isHRorAdmin =
    currentUser?.roles?.some((r) => r === 'Admin' || r === 'HR Manager') ||
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'HR Manager';

  const canCreateLogin = Boolean(isHRorAdmin && employee && (!employee.user || employee.user === null));

  const handleOpenCreateModal = () => {
    if (!employee) return;
    const defaultUsername = employee.email
      ? employee.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '')
      : `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}`;
    setUsername(defaultUsername);
    setPassword(generateSecurePassword());
    setShowPassword(true);
    setSelectedCreateRole('Employee');
    setCreateError(null);
    setCreatedCredentials(null);
    setCopied(false);
    setIsCreateModalOpen(true);
  };

  const handleGeneratePassword = () => {
    setPassword(generateSecurePassword());
  };

  const handleCreateLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !id) return;
    if (!username.trim() || !password.trim()) {
      setCreateError('Username and password are required.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    const payload: any = {
      username: username.trim(),
      password: password.trim(),
    };
    if (isAdmin && selectedCreateRole) {
      payload.roles = [selectedCreateRole];
    }

    try {
      const res = await employeesApi.createLogin(id, payload);

      if ((res.status >= 200 && res.status < 300) || res.data) {
        const credentials = {
          username: username.trim(),
          password: password.trim(),
        };
        setCreatedCredentials(credentials);
        await loadEmployeeData();
      } else {
        setCreateError(res.message || 'Failed to create user login credentials.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'An error occurred while creating login credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChangeRoleModal = () => {
    const currentRole = (userAccountInfo?.roles && userAccountInfo.roles[0]) || 'Employee';
    setSelectedChangeRole(currentRole);
    setChangeRoleError(null);
    setIsChangeRoleModalOpen(true);
  };

  const handleChangeRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccountId) {
      setChangeRoleError('No linked user account ID found for role assignment.');
      return;
    }
    setIsAssigningRole(true);
    setChangeRoleError(null);

    try {
      const res = await authService.assignRole(userAccountId, selectedChangeRole);
      if (res.success) {
        setToastMessage(`User role updated to "${selectedChangeRole}" successfully!`);
        setIsChangeRoleModalOpen(false);
        await loadEmployeeData();
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setChangeRoleError(res.error || 'Failed to reassign user role.');
      }
    } catch (err: any) {
      setChangeRoleError(err.message || 'An error occurred while updating user role.');
    } finally {
      setIsAssigningRole(false);
    }
  };


  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Username: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEditModal = () => {
    if (!employee) return;
    setFirstName(employee.firstName || '');
    setLastName(employee.lastName || '');
    setEmail(employee.email || '');
    setPhone(employee.phone || '');
    setDepartment(employee.department || 'Engineering');
    setJobPosition(employee.jobTitle || '');
    setDateJoined(employee.joiningDate || new Date().toISOString().split('T')[0]);
    setStatusVal((employee.status || 'Active').toLowerCase());
    setFieldErrors({});
    setGlobalError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setSubmitting(true);
    setFieldErrors({});
    setGlobalError(null);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department,
      job_position: jobPosition.trim(),
      date_joined: dateJoined,
      status: statusVal,
    };

    try {
      await employeesApi.update(employee.id, payload);
      setToastMessage('Employee profile updated successfully!');
      setIsEditModalOpen(false);
      await loadEmployeeData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (err instanceof ApiError && err.errors) {
        const errorsObj: Record<string, string> = {};
        if (typeof err.errors === 'object') {
          Object.keys(err.errors).forEach((key) => {
            const val = err.errors![key];
            errorsObj[key] = Array.isArray(val) ? val.join(' ') : String(val);
          });
        }
        setFieldErrors(errorsObj);
        setGlobalError(err.message || 'Please fix the errors below.');
      } else {
        setGlobalError(err?.message || 'Failed to update employee record. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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

          <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            {canCreateLogin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateModal}
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4 text-emerald-600" />
                Create Login
              </Button>
            )}
            {employee.user && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5" />
                User Account Linked
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
              Manage Contract
            </Button>
            <Button size="sm" leftIcon={<Edit3 className="w-4 h-4" />} onClick={openEditModal}>
              Edit Profile
            </Button>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>1. Basic Identity & Employment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Full Name</span>
                  <span className="font-bold text-slate-900">{employee.firstName} {employee.lastName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Employee Code</span>
                  <span className="font-mono font-semibold text-slate-900">{employee.code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="font-semibold text-slate-900">{employee.department}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Job Position</span>
                  <span className="font-semibold text-slate-900">{employee.jobTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Status</span>
                  <StatusBadge status={employee.status} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date Joined</span>
                  <span className="font-semibold text-slate-900">{formatDate(employee.joiningDate)}</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. User Account & Roles Card */}
            <Card>
              <CardHeader>
                <CardTitle>2. System Access & User Role(s)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {userAccountInfo || employee.user ? (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Account Username</span>
                      <span className="font-mono font-bold text-slate-900">{userAccountInfo?.username || employee.user?.username}</span>
                    </div>
                    <div className="space-y-1.5 border-b border-slate-100 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium block">Assigned Role(s)</span>
                        {isAdmin && userAccountId && (
                          <button
                            type="button"
                            onClick={handleOpenChangeRoleModal}
                            className="text-xs text-[var(--brand-primary)] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5" /> Change Role
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(userAccountInfo?.roles || ['Employee']).map((r) => (
                          <span key={r} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Portal Login Linked</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-500">No login account is currently linked to this employee profile.</p>
                    {canCreateLogin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenCreateModal}
                        className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Key className="w-4 h-4 text-emerald-600" />
                        Create Portal Login Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. Active Contract Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>3. Active Contract Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {contract ? (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Contract Ref</span>
                      <span className="font-mono font-bold text-slate-900">{contract.reference}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Contract Status</span>
                      <StatusBadge status={contract.status} size="sm" />
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Monthly Gross Wage</span>
                      <span className="font-bold text-blue-600 text-sm">{formatCurrency(contract.wage)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Validity Period</span>
                      <span className="font-semibold text-slate-900">
                        {formatDate(contract.startDate)} {contract.endDate ? `to ${formatDate(contract.endDate)}` : '(Indefinite)'}
                      </span>
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

            {/* 4. Working Schedule Card */}
            <Card>
              <CardHeader>
                <CardTitle>4. Working Schedule & Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Schedule Name</span>
                  <span className="font-semibold text-blue-600">{employee.workingScheduleName || 'Standard 40h Shift'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Total Weekly Hours</span>
                  <span className="font-bold text-slate-900">40.0 hrs / week</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Standard Shift</span>
                  <span className="font-medium text-slate-800">09:00 AM - 05:00 PM (Mon-Fri)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Overtime Allowance</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Standard Overtime</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 5. Leave Balances Card */}
          <Card>
            <CardHeader>
              <CardTitle>5. Leave Balances & Allocation Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              {allocations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {allocations.map((alc) => (
                    <div key={alc.id} className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{alc.timeOffTypeName}</span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          {alc.remainingDays} / {alc.allocatedDays} days remaining
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, (alc.remainingDays / (alc.allocatedDays || 1)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>Used: {alc.usedDays} days</span>
                        <span>Allocated: {alc.allocatedDays} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No leave allocations found for this employee.</p>
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

      {/* Create Login Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsCreateModalOpen(false);
        }}
        title={createdCredentials ? 'Login Credentials Created' : 'Create User Login'}
        description={
          createdCredentials
            ? `Credentials generated for ${employee.firstName} ${employee.lastName}`
            : `Set up backend portal access for ${employee.firstName} ${employee.lastName}`
        }
        maxWidth="md"
      >
        {createdCredentials ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-start gap-2.5">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Login created successfully!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Share these credentials with the employee now. For security reasons, the password will not be retrievable again.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] rounded-xl space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Username:</span>
                <span className="font-bold text-[var(--text-primary)] select-all">{createdCredentials.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Password:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 select-all">{createdCredentials.password}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCredentials}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
              </Button>
              <Button size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateLoginSubmit} className="space-y-4 text-xs">
            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div>
              <label className="block font-medium text-[var(--text-primary)] mb-1">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)]"
                placeholder="e.g. priya.patel"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Unique login handle for the user account.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-[var(--text-primary)]">Password *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-[var(--brand-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-generate
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isAdmin ? (
                <div className="mt-3">
                  <Select
                    label="Assign Initial System Role *"
                    options={SYSTEM_ROLE_OPTIONS}
                    value={selectedCreateRole}
                    onChange={(e) => setSelectedCreateRole(e.target.value)}
                  />
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Will be automatically assigned the Employee role.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Create Credentials
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={isChangeRoleModalOpen}
        onClose={() => {
          if (!isAssigningRole) setIsChangeRoleModalOpen(false);
        }}
        title="Change User Account Role"
        description={`Reassign system permissions for user "${userAccountInfo?.username || employee.user?.username}"`}
        maxWidth="md"
      >
        <form onSubmit={handleChangeRoleSubmit} className="space-y-4 text-xs">
          {changeRoleError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{changeRoleError}</span>
            </div>
          )}

          <Select
            label="System Role *"
            options={SYSTEM_ROLE_OPTIONS}
            value={selectedChangeRole}
            onChange={(e) => setSelectedChangeRole(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsChangeRoleModalOpen(false)} disabled={isAssigningRole}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isAssigningRole}>
              Update Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsEditModalOpen(false);
          }
        }}
        title="Edit Employee Profile"
        description={`Update details for ${employee.firstName} ${employee.lastName}`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={submitting} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {submitting ? 'Saving...' : 'Update Profile'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-4 text-left">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={fieldErrors.first_name}
              required
            />
            <Input
              label="Last Name *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={fieldErrors.last_name}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department *"
              options={DEPARTMENT_OPTIONS}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              error={fieldErrors.department}
            />
            <Input
              label="Job Position *"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              error={fieldErrors.job_position}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Joining Date *"
              type="date"
              value={dateJoined}
              onChange={(e) => setDateJoined(e.target.value)}
              error={fieldErrors.date_joined}
              required
            />
            <Select
              label="Status *"
              options={STATUS_OPTIONS}
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              error={fieldErrors.status}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
