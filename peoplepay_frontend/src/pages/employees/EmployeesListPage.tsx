import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { employeesApi } from '../../services/api/employees';
import { ApiError } from '../../services/api/client';
import { Employee } from '../../types/employee';

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

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [dateJoined, setDateJoined] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusVal, setStatusVal] = useState('active');

  const loadData = async () => {
    setIsLoading(true);
    const res = await employeesApi.getAll();
    setEmployees(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDepartment('Engineering');
    setJobPosition('');
    setDateJoined(new Date().toISOString().split('T')[0]);
    setStatusVal('active');
    setFieldErrors({});
    setGlobalError(null);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await employeesApi.create(payload);
      setToastMessage('Employee created successfully!');
      setIsModalOpen(false);
      resetForm();
      await loadData();
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
        setGlobalError(err?.message || 'Failed to create employee record. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <Avatar src={item.avatarUrl} name={`${item.firstName} ${item.lastName}`} size="md" />
          <div>
            <span className="font-semibold text-slate-900 block">{item.firstName} {item.lastName}</span>
            <span className="text-xs text-slate-400 font-mono">{item.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job Title & Department',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-medium text-slate-900 block">{item.jobTitle}</span>
          <span className="text-xs text-slate-500">{item.department}</span>
        </div>
      ),
    },
    {
      key: 'workLocation',
      header: 'Work Location',
      sortable: true,
    },
    {
      key: 'workingScheduleName',
      header: 'Working Schedule',
      accessor: (item) => <span className="text-xs font-medium text-slate-600">{item.workingScheduleName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => <StatusBadge status={item.status} />,
    },
  ];

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
        title="Employees Directory"
        subtitle="Manage employee records, organizational roles, contracts, and schedules."
        breadcrumbs={[{ label: 'Employees' }]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            New Employee
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, department..." />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="No employees found"
        emptyDescription="No employee records match your search criteria."
        onRowClick={(item) => navigate(`/employees/${item.id}`)}
        actions={(item) => (
          <IconButton
            icon={<ExternalLink className="w-4 h-4" />}
            label="View profile"
            onClick={() => navigate(`/employees/${item.id}`)}
          />
        )}
      />

      {/* New Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
        title="Create New Employee"
        description="Add a new staff member to PeoplePay 360 database."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateEmployee} disabled={submitting} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {submitting ? 'Saving...' : 'Create Employee'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-left">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              placeholder="e.g. Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={fieldErrors.first_name}
              required
            />
            <Input
              label="Last Name *"
              placeholder="e.g. Smith"
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
              placeholder="jane.smith@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+1 555-0199"
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
              placeholder="e.g. Software Engineer"
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
