import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, DollarSign, AlertTriangle, Edit, X, Check, Users, Calendar, ArrowRight, Mail } from 'lucide-react';

import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/shared/DataTable';
import { payrollApi } from '../../services/api/payroll';
import { employeesApi } from '../../services/api/employees';
import { Payrun, Payslip, SalaryStructure } from '../../types/payroll';
import { Employee } from '../../types/employee';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { usePermissions } from '../../hooks/usePermissions';

export const PayrunDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canPerformAction } = usePermissions();
  const canManage = canPerformAction('manage_payroll');
  const canApprove = canPerformAction('approve_payroll');

  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  // Edit Modal State (Draft Payruns)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStep, setEditStep] = useState<1 | 2>(1);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editStructureId, setEditStructureId] = useState<string>('');
  const [editDateFrom, setEditDateFrom] = useState<string>('');
  const [editDateTo, setEditDateTo] = useState<string>('');
  const [editEmpIds, setEditEmpIds] = useState<number[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    if (id) {
      const prRes = await payrollApi.getPayrunById(id);
      if (prRes.data) {
        setPayrun(prRes.data);
        if (prRes.data.payslips) {
          setPayslips(prRes.data.payslips);
        } else {
          const psRes = await payrollApi.getPayslips(id);
          setPayslips(psRes.data);
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenEditModal = async () => {
    if (!payrun) return;
    setEditStep(1);
    setEditErrorMsg('');
    setIsProcessing(true);
    try {
      const [structRes, empRes] = await Promise.all([
        payrollApi.getStructures(),
        employeesApi.getAll(),
      ]);
      setStructures(structRes.data);
      const empList = Array.isArray(empRes.data) ? empRes.data : [];
      setEmployees(empList);

      setEditStructureId(String(payrun.structure || ''));
      setEditDateFrom(payrun.date_from || '');
      setEditDateTo(payrun.date_to || '');

      const currentEmpIds = payslips.map((ps) => Number(ps.employee));
      setEditEmpIds(currentEmpIds.length > 0 ? currentEmpIds : empList.map((e) => Number(e.id)));

      setIsEditModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load payrun edit options.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditNextStep = () => {
    if (!editStructureId) {
      setEditErrorMsg('Please select a salary structure.');
      return;
    }
    if (!editDateFrom || !editDateTo) {
      setEditErrorMsg('Please enter a valid date range.');
      return;
    }
    setEditErrorMsg('');
    setEditStep(2);
  };

  const handleToggleEditEmployee = (empIdNum: number) => {
    setEditEmpIds((prev) =>
      prev.includes(empIdNum) ? prev.filter((eid) => eid !== empIdNum) : [...prev, empIdNum]
    );
  };

  const handleSelectAllEditEmployees = () => {
    if (editEmpIds.length === employees.length) {
      setEditEmpIds([]);
    } else {
      setEditEmpIds(employees.map((e) => Number(e.id)));
    }
  };

  const handleUpdatePayrunSubmit = async () => {
    if (editEmpIds.length === 0) {
      setEditErrorMsg('Please select at least one employee for the payrun.');
      return;
    }
    setIsSubmittingEdit(true);
    setEditErrorMsg('');
    try {
      await payrollApi.updatePayrun(payrun!.id, {
        structure: Number(editStructureId),
        date_from: editDateFrom,
        date_to: editDateTo,
        employee_ids: editEmpIds,
      });
      setIsSubmittingEdit(false);
      setIsEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      setIsSubmittingEdit(false);
      setEditErrorMsg(err.message || 'Failed to update payrun.');
    }
  };

  const handleCompute = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await payrollApi.computePayrun(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Compute failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidate = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await payrollApi.validatePayrun(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Validation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await payrollApi.markPaidPayrun(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Mark Paid failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendPayslips = async () => {
    if (!id || !payrun) return;
    const confirmed = window.confirm("Send payslip emails to all employees in this payrun?");
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await payrollApi.sendPayslips(id);
      if (res.data) {
        const { sent, skipped } = res.data;
        let summaryMsg = `Sent to ${sent} employee${sent === 1 ? '' : 's'}.`;
        if (skipped > 0) {
          summaryMsg += ` ${skipped} skipped (no email on file / excluded).`;
        }
        setToastMessage(summaryMsg);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(res.message || 'Failed to send payslips.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while sending payslips.');
    } finally {
      setIsProcessing(false);
    }
  };


  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading payrun details...</div>;

  if (!payrun) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Payrun Not Found</h2>
        <Button onClick={() => navigate('/payroll/payruns')} className="mt-4">
          Back to Payruns
        </Button>
      </div>
    );
  }

  const columns: Column<Payslip>[] = [
    {
      key: 'reference',
      header: 'Payslip Ref',
      accessor: (item) => <span className="font-mono font-semibold text-slate-900">{item.reference}</span>,
    },
    {
      key: 'employeeName',
      header: 'Employee',
      accessor: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.employeeName}</span>
          <span className="text-xs text-slate-400 font-mono">{item.employeeCode}</span>
        </div>
      ),
    },
    {
      key: 'grossWage',
      header: 'Gross Wage',
      align: 'right',
      accessor: (item) => (item.is_excluded ? '-' : formatCurrency(Number(item.grossWage || item.gross) || 0)),
    },
    {
      key: 'totalDeductions',
      header: 'Deductions',
      align: 'right',
      accessor: (item) =>
        item.is_excluded ? (
          '-'
        ) : (
          <span className="text-rose-600">{formatCurrency(Number(item.totalDeductions || item.total_deductions) || 0)}</span>
        ),
    },
    {
      key: 'netWage',
      header: 'Net Wage',
      align: 'right',
      accessor: (item) =>
        item.is_excluded ? (
          '-'
        ) : (
          <span className="font-bold text-blue-600">{formatCurrency(Number(item.netWage || item.net) || 0)}</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (item) => (
        <div className="space-y-1">
          <StatusBadge status={item.status} size="sm" />
          {item.is_excluded && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              {item.warning || '⚠ No active contract'}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payrun: ${payrun.reference}`}
        subtitle={payrun.structure_name ? `${payrun.structure_name} Batch` : payrun.name}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Payruns', href: '/payroll/payruns' },
          { label: payrun.reference },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {canManage && payrun.status === 'draft' && (
              <>
                <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />} onClick={handleOpenEditModal} disabled={isProcessing}>
                  Edit
                </Button>
                <Button leftIcon={<Play className="w-4 h-4" />} onClick={handleCompute} isLoading={isProcessing}>
                  Compute Payrun
                </Button>
              </>
            )}

            {canApprove && payrun.status === 'computed' && (
              <Button leftIcon={<CheckCircle className="w-4 h-4" />} onClick={handleValidate} isLoading={isProcessing}>
                Validate Payrun
              </Button>
            )}

            {canApprove && payrun.status === 'validated' && (
              <Button leftIcon={<DollarSign className="w-4 h-4" />} onClick={handleMarkPaid} isLoading={isProcessing}>
                Mark Paid
              </Button>
            )}

            {canApprove && payrun.status !== 'draft' && (
              <Button
                variant="outline"
                leftIcon={<Mail className="w-4 h-4" />}
                onClick={handleSendPayslips}
                isLoading={isProcessing}
                disabled={isProcessing}
              >
                Send Payslips
              </Button>
            )}

            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/payroll/payruns')}>
              Back to Payruns
            </Button>
          </div>
        }
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg shadow-sm flex items-center justify-between font-medium text-sm">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 font-bold ml-4">✕</button>
        </div>
      )}


      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">Edit Payrun Configuration</h2>
              <button onClick={() => setIsEditModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {editStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Salary Structure</label>
                    <select className="w-full border p-2 rounded" value={editStructureId} onChange={(e) => setEditStructureId(e.target.value)}>
                      <option value="">Select structure...</option>
                      {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Period From</label>
                      <input type="date" className="w-full border p-2 rounded" value={editDateFrom} onChange={(e) => setEditDateFrom(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Period To</label>
                      <input type="date" className="w-full border p-2 rounded" value={editDateTo} onChange={(e) => setEditDateTo(e.target.value)} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">Select Employees ({editEmpIds.length} selected)</h3>
                    <Button variant="outline" size="sm" onClick={handleSelectAllEditEmployees}>Toggle All</Button>
                  </div>
                  <div className="border rounded h-64 overflow-y-auto p-2 space-y-1">
                    {employees.map(e => (
                      <label key={e.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={editEmpIds.includes(Number(e.id))} onChange={() => handleToggleEditEmployee(Number(e.id))} />
                        <span className="text-sm">
                          {(e as any).first_name || e.firstName || (e as any).name} {(e as any).last_name || e.lastName || ''} ({(e as any).employee_code || e.code})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {editErrorMsg && <p className="text-rose-600 text-sm mt-2">{editErrorMsg}</p>}
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              {editStep === 2 && <Button variant="outline" onClick={() => setEditStep(1)}>Back</Button>}
              {editStep === 1 ? (
                <Button onClick={handleEditNextStep}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
              ) : (
                <Button onClick={handleUpdatePayrunSubmit} isLoading={isSubmittingEdit}>Save Changes</Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Batch Summary</CardTitle>
          <StatusBadge status={payrun.status} />
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500 block">Period</span>
              <span className="font-semibold text-slate-900">
                {formatDate(payrun.date_from || payrun.periodStart || '')} - {formatDate(payrun.date_to || payrun.periodEnd || '')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Employees</span>
              <span className="font-bold text-slate-900 text-sm">{payrun.totalEmployees || payslips.length}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Gross</span>
              <span className="font-semibold text-slate-800 text-sm">{formatCurrency(payrun.totalGross || 0)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Net Payout</span>
              <span className="font-bold text-blue-600 text-base">{formatCurrency(payrun.totalNet || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included Employee Payslips ({payslips.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={payslips}
            keyExtractor={(item) => String(item.id)}
            onRowClick={(item) => navigate(`/payroll/payslips/${item.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

