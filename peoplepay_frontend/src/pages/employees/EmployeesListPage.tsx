import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, CheckCircle2, AlertCircle, Loader2, LayoutList, Kanban, Building2 } from 'lucide-react';
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
import { usePermissions } from '../../hooks/usePermissions';
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

const KANBAN_DEPARTMENTS = ['Engineering', 'Product', 'HR', 'Finance', 'Sales', 'Operations'];

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { canPerformAction } = usePermissions();
  const canManageEmployees = canPerformAction('manage_employees');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'list' vs 'kanban', persisted in localStorage
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    const saved = localStorage.getItem('peoplepay_employees_view');
    return saved === 'kanban' ? 'kanban' : 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('peoplepay_employees_view', mode);
  };

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
            <span className="font-semibold text-[var(--text-primary)] block">{item.firstName} {item.lastName}</span>
            <span className="text-xs text-[var(--text-secondary)] font-mono font-semibold">{item.code}</span>
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
          <span className="font-medium text-[var(--text-primary)] block">{item.jobTitle}</span>
          <span className="text-xs text-[var(--text-secondary)]">{item.department}</span>
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
      accessor: (item) => <span className="text-xs font-semibold text-[var(--text-primary)]">{item.workingScheduleName}</span>,
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
          canManageEmployees ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              New Employee
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, department..." />

        {/* View Toggle: List / Kanban */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 rounded-xl border border-[var(--border-color)] shrink-0">
          <button
            type="button"
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Kanban</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
        </div>
      ) : viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No employees found"
          emptyDescription="No employee records match your search criteria."
          onRowClick={(item) => navigate(`/employees/${item.id}`)}
          rowClassName={(item) => (item.status === 'Terminated' ? 'bg-slate-100/70 dark:bg-slate-800/50 opacity-60 hover:bg-slate-200/70' : '')}
          actions={(item) => (
            <IconButton
              icon={<ExternalLink className="w-4 h-4" />}
              label="View profile"
              onClick={() => navigate(`/employees/${item.id}`)}
            />
          )}
        />
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pb-4">
          {KANBAN_DEPARTMENTS.map((dept) => {
            const deptEmployees = filtered.filter(
              (e) => (e.department || '').toLowerCase() === dept.toLowerCase()
            );
            return (
              <div key={dept} className="bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] rounded-xl p-3 flex flex-col min-w-[200px]">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--brand-primary)]" />
                    <span className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider">{dept}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs font-bold border border-[var(--border-color)]">
                    {deptEmployees.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {deptEmployees.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-lg">
                      No employees
                    </div>
                  ) : (
                    deptEmployees.map((emp) => {
                      const isTerminated = emp.status?.toLowerCase() === 'terminated';
                      return (
                        <div
                          key={emp.id}
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className={`p-3 rounded-lg border bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${
                            isTerminated
                              ? 'opacity-60 bg-[var(--bg-surface-elevated)] border-slate-300 dark:border-slate-700'
                              : 'border-[var(--border-color)]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 mb-2">
                            <Avatar src={emp.avatarUrl} name={`${emp.firstName} ${emp.lastName}`} size="md" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors truncate">
                                {emp.firstName} {emp.lastName}
                              </h4>
                              <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">{emp.code}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-color)]">
                            <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate max-w-[100px]">
                              {emp.jobTitle || 'N/A'}
                            </span>
                            <StatusBadge status={emp.status} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
