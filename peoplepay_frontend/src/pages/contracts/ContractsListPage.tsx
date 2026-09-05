import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { contractsApi } from '../../services/api/contracts';
import { employeesApi } from '../../services/api/employees';
import { ApiError } from '../../services/api/client';
import { Contract } from '../../types/contract';
import { Employee } from '../../types/employee';
import { formatDate, formatCurrency } from '../../utils/formatters';

const STATE_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'running', label: 'Running' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const ContractsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [wage, setWage] = useState('');
  const [dateStart, setDateStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState('');
  const [stateVal, setStateVal] = useState('running');
  const [department, setDepartment] = useState('Engineering');
  const [jobPosition, setJobPosition] = useState('Software Engineer');

  const loadData = async () => {
    setIsLoading(true);
    const [cRes, eRes] = await Promise.all([
      contractsApi.getAll(),
      employeesApi.getAll(),
    ]);
    setContracts(cRes.data || []);
    setEmployees(eRes.data || []);
    if (eRes.data && eRes.data.length > 0 && !employeeId) {
      setEmployeeId(eRes.data[0].id);
      setDepartment(eRes.data[0].department || 'Engineering');
      setJobPosition(eRes.data[0].jobTitle || 'Software Engineer');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEmployeeChange = (selectedId: string) => {
    setEmployeeId(selectedId);
    const emp = employees.find((e) => e.id === selectedId);
    if (emp) {
      setDepartment(emp.department || 'Engineering');
      setJobPosition(emp.jobTitle || 'Software Engineer');
    }
  };

  const resetForm = () => {
    if (employees.length > 0) {
      setEmployeeId(employees[0].id);
      setDepartment(employees[0].department || 'Engineering');
      setJobPosition(employees[0].jobTitle || 'Software Engineer');
    }
    setWage('');
    setDateStart(new Date().toISOString().split('T')[0]);
    setDateEnd('');
    setStateVal('running');
    setFieldErrors({});
    setGlobalError(null);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setGlobalError('Please select an employee.');
      return;
    }
    setSubmitting(true);
    setFieldErrors({});
    setGlobalError(null);

    const payload = {
      employee: parseInt(employeeId, 10),
      wage: parseFloat(wage),
      date_start: dateStart,
      date_end: dateEnd ? dateEnd : null,
      state: stateVal,
      department,
      job_position: jobPosition,
    };

    try {
      await contractsApi.create(payload);
      setToastMessage('Contract created successfully!');
      setIsModalOpen(false);
      resetForm();
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        let msg = err.message || 'Failed to create contract.';
        if (err.errors) {
          if (typeof err.errors === 'string') {
            msg = err.errors;
          } else if (typeof err.errors === 'object') {
            const errValues = Object.values(err.errors).flatMap((v) => (Array.isArray(v) ? v : [v]));
            if (errValues.length > 0) {
              msg = errValues.join(' ');
            }
          }
        }
        // Explicitly check for active contract conflict message
        if (msg.toLowerCase().includes('already has an active running contract') || msg.toLowerCase().includes('active running contract')) {
          setGlobalError(msg);
        } else {
          setGlobalError(msg);
        }
      } else {
        setGlobalError(err?.message || 'Failed to create contract.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = (contracts || []).filter(
    (c) =>
      (c.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} (${e.code})`,
  }));

  const columns: Column<Contract>[] = [
    {
      key: 'reference',
      header: 'Contract Ref',
      sortable: true,
      accessor: (item) => <span className="font-mono font-bold text-slate-900">{item.reference || 'CON-000'}</span>,
    },
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.employeeName || 'Employee'}</span>
          <span className="text-xs text-slate-500">{item.jobTitle || 'Staff'}</span>
        </div>
      ),
    },
    {
      key: 'contractType',
      header: 'Type',
      sortable: true,
      accessor: (item) => <span>{item.contractType || 'Permanent'}</span>,
    },
    {
      key: 'wage',
      header: 'Gross Wage',
      sortable: true,
      align: 'right',
      accessor: (item) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(item.wage || 0)} <span className="text-xs text-slate-400 font-normal">/{item.wagePeriod || 'Monthly'}</span>
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      accessor: (item) => formatDate(item.startDate || new Date().toISOString()),
    },
    {
      key: 'salaryStructureName',
      header: 'Structure',
      accessor: (item) => <span className="text-xs text-purple-600 font-medium">{item.salaryStructureName || 'Standard'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => <StatusBadge status={item.status || 'Running'} />,
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
        title="Employment Contracts"
        subtitle="Manage salary agreements, contract terms, structures, and validity periods."
        breadcrumbs={[{ label: 'Contracts' }]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            New Contract
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search by contract ref, employee, department..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/contracts/${item.id}`)}
        actions={(item) => (
          <IconButton
            icon={<ExternalLink className="w-4 h-4" />}
            label="View contract"
            onClick={() => navigate(`/contracts/${item.id}`)}
          />
        )}
      />

      {/* New Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
        title="Create New Contract"
        description="Assign salary terms and employment contract period to an employee."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateContract} disabled={submitting} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {submitting ? 'Saving...' : 'Create Contract'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateContract} className="space-y-4 text-left">
          {globalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed">
                <span className="font-bold block text-rose-800 uppercase tracking-wider text-[11px] mb-0.5">Contract Error</span>
                <span>{globalError}</span>
              </div>
            </div>
          )}

          <Select
            label="Employee *"
            options={employeeOptions}
            value={employeeId}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monthly Gross Wage ($) *"
              type="number"
              step="0.01"
              placeholder="e.g. 85000"
              value={wage}
              onChange={(e) => setWage(e.target.value)}
              error={fieldErrors.wage}
              required
            />
            <Select
              label="Contract State *"
              options={STATE_OPTIONS}
              value={stateVal}
              onChange={(e) => setStateVal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              error={fieldErrors.date_start}
              required
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              error={fieldErrors.date_end}
              helperText="Leave blank for permanent / indefinite contracts"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
            <Input
              label="Job Position"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
