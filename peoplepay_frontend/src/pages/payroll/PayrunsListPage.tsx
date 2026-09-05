import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ExternalLink, X, Users, Calendar, ArrowRight, Check } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Card } from '../../components/ui/Card';
import { usePermissions } from '../../hooks/usePermissions';
import { payrollApi } from '../../services/api/payroll';
import { employeesApi } from '../../services/api/employees';
import { Payrun, SalaryStructure } from '../../types/payroll';
import { Employee } from '../../types/employee';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const PayrunsListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(location.pathname === '/payroll/payruns/new');
  const [step, setStep] = useState<1 | 2>(1);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('2026-09-01');
  const [dateTo, setDateTo] = useState<string>('2026-09-30');
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await payrollApi.getPayruns();
      setPayruns(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isWizardOpen) {
      async function loadWizardData() {
        const [structRes, empRes] = await Promise.all([
          payrollApi.getStructures(),
          employeesApi.getAll(),
        ]);
        setStructures(structRes.data);
        if (structRes.data.length > 0) {
          setSelectedStructureId(structRes.data[0].id);
        }
        const empList = Array.isArray(empRes.data) ? empRes.data : [];
        setEmployees(empList);
        setSelectedEmpIds(empList.map((e) => Number(e.id)));
      }
      loadWizardData();
    }
  }, [isWizardOpen]);

  const handleOpenWizard = () => {
    setStep(1);
    setErrorMsg('');
    setIsWizardOpen(true);
  };

  const handleNextStep = () => {
    if (!selectedStructureId) {
      setErrorMsg('Please select a salary structure.');
      return;
    }
    if (!dateFrom || !dateTo) {
      setErrorMsg('Please enter valid date range.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleToggleEmployee = (id: number) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((eId) => eId !== id) : [...prev, id]
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(employees.map((e) => Number(e.id)));
    }
  };

  const handleCreatePayrunSubmit = async () => {
    if (selectedEmpIds.length === 0) {
      setErrorMsg('Please select at least one employee.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await payrollApi.createPayrun({
        structure: Number(selectedStructureId),
        date_from: dateFrom,
        date_to: dateTo,
        employee_ids: selectedEmpIds,
      });

      setIsSubmitting(false);
      setIsWizardOpen(false);
      if (res.data?.id) {
        navigate(`/payroll/payruns/${res.data.id}`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to create payrun.');
    }
  };

  const filtered = payruns.filter(
    (p) =>
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.structure_name && p.structure_name.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Payrun>[] = [
    {
      key: 'reference',
      header: 'Payrun Ref',
      sortable: true,
      accessor: (item) => <span className="font-mono font-bold text-slate-900">{item.reference}</span>,
    },
    {
      key: 'name',
      header: 'Batch Structure',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.structure_name || item.name}</span>
          <span className="text-xs text-slate-500 font-mono">
            {formatDate(item.date_from || item.periodStart || '')} - {formatDate(item.date_to || item.periodEnd || '')}
          </span>
        </div>
      ),
    },
    {
      key: 'totalEmployees',
      header: 'Headcount',
      align: 'center',
      accessor: (item) => <span className="font-semibold text-slate-800">{item.totalEmployees || (item.payslips ? item.payslips.length : 0)}</span>,
    },
    {
      key: 'totalGross',
      header: 'Total Gross',
      align: 'right',
      accessor: (item) => <span className="font-medium text-slate-700">{formatCurrency(item.totalGross || 0)}</span>,
    },
    {
      key: 'totalNet',
      header: 'Total Net',
      align: 'right',
      accessor: (item) => <span className="font-bold text-blue-600">{formatCurrency(item.totalNet || 0)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => <StatusBadge status={item.status} />,
    },
  ];

  const { canPerformAction } = usePermissions();
  const canManagePayroll = canPerformAction('manage_payroll');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payrun Batches"
        subtitle="Manage batch payroll execution, computations, and disbursement workflows."
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Payruns' },
        ]}
        actions={
          canManagePayroll ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenWizard}>
              New Payrun
            </Button>
          ) : undefined
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search payrun ref, structure..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/payroll/payruns/${item.id}`)}
        actions={(item) => (
          <IconButton
            icon={<ExternalLink className="w-4 h-4" />}
            label="View payrun details"
            onClick={() => navigate(`/payroll/payruns/${item.id}`)}
          />
        )}
      />

      {/* 2-Step Payrun Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Payrun Batch Wizard</h3>
                <p className="text-xs text-slate-500">Step {step} of 2 — {step === 1 ? 'Structure & Period' : 'Select Employees'}</p>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Step 1 Form */}
            {step === 1 && (
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Structure</label>
                  <select
                    value={selectedStructureId}
                    onChange={(e) => setSelectedStructureId(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {structures.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Period From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Period To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsWizardOpen(false)}>
                    Cancel
                  </Button>
                  <Button rightIcon={<ArrowRight className="w-4 h-4" />} onClick={handleNextStep}>
                    Next: Select Employees
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 Form */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Target Employees ({selectedEmpIds.length} of {employees.length} selected)
                  </span>
                  <button
                    onClick={handleSelectAllEmployees}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {selectedEmpIds.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-2 space-y-1">
                  {employees.map((emp) => {
                    const empIdNum = Number(emp.id);
                    const isChecked = selectedEmpIds.includes(empIdNum);
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleEmployee(empIdNum)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {(emp as any).first_name || emp.firstName} {(emp as any).last_name || emp.lastName}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">{(emp as any).employee_code || emp.code}</span>
                          </div>
                        </div>
                        <span className="text-slate-500 font-medium">{emp.department || 'General'}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                  <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button onClick={handleCreatePayrunSubmit} isLoading={isSubmitting}>
                    Create Payrun Batch
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

