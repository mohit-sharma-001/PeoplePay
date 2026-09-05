import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { payrollApi } from '../../services/api/payroll';
import { Payslip } from '../../types/payroll';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { usePermissions } from '../../hooks/usePermissions';

export const PayslipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = usePermissions();

  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // PDF Download State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Adjustment Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjLabel, setAdjLabel] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState(false);
  const [adjError, setAdjError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    if (id) {
      const res = await payrollApi.getPayslipById(id);
      setPayslip(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id || !payslip) return;
    setIsDownloadingPdf(true);
    try {
      const empCode = payslip.employeeCode || payslip.employee_code || payslip.employee;
      const ref = payslip.reference || payslip.id;
      const filename = `payslip_${empCode}_${ref}.pdf`;
      await payrollApi.downloadPayslipPdf(id, filename);
    } catch (err: any) {
      alert(err.message || 'Failed to download payslip PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleAddAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !adjLabel || !adjAmount) {
      setAdjError('Please enter label and amount.');
      return;
    }
    setIsSubmittingAdj(true);
    setAdjError('');
    try {
      await payrollApi.addPayslipAdjustment(id, {
        label: adjLabel,
        amount: parseFloat(adjAmount),
      });
      setIsSubmittingAdj(false);
      setIsAdjModalOpen(false);
      setAdjLabel('');
      setAdjAmount('');
      await loadData();
    } catch (err: any) {
      setIsSubmittingAdj(false);
      setAdjError(err.message || 'Failed to add adjustment.');
    }
  };

  const handleDeleteAdjustment = async (adjId: string | number) => {
    if (!id) return;
    if (!window.confirm('Remove this adjustment?')) return;
    try {
      await payrollApi.deletePayslipAdjustment(id, adjId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete adjustment.');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading payslip details...</div>;

  if (!payslip) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Payslip Not Found</h2>
        <Button onClick={() => navigate('/payroll/payslips')} className="mt-4">
          Back to Payslips
        </Button>
      </div>
    );
  }

  const { canPerformAction } = usePermissions();
  const canManagePayroll = canPerformAction('manage_payroll');
  const canAdjust =
    canManagePayroll &&
    !payslip.is_excluded &&
    (payslip.status === 'draft' || payslip.status === 'computed');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payslip: ${payslip.reference || payslip.id}`}
        subtitle={`${payslip.employeeName || payslip.employee_name} (${payslip.employeeCode || payslip.employee_code})`}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Payslips', href: '/payroll/payslips' },
          { label: String(payslip.reference || payslip.id) },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button leftIcon={<Download className="w-4 h-4" />} onClick={handleDownloadPdf} isLoading={isDownloadingPdf}>
              Download PDF
            </Button>
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/payroll/payslips')}>
              Back to List
            </Button>
          </div>
        }
      />

      {payslip.is_excluded && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Payslip Excluded from Processing</p>
            <p className="text-amber-700 font-normal">{payslip.warning || 'No active running contract found for this employee during the pay period.'}</p>
          </div>
        </div>
      )}

      {/* Official Payslip Printable Document Layout */}
      <Card className="max-w-3xl mx-auto border-2 border-slate-200">
        <CardContent className="p-8 space-y-6">
          {/* Header Branding */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">PEOPLEPAY360</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Official Payroll Payslip Document</p>
              <p className="text-xs text-slate-400 mt-1">
                Period: {formatDate(payslip.date_from || payslip.periodStart || '')} to {formatDate(payslip.date_to || payslip.periodEnd || '')}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-base text-slate-900 block">{payslip.reference || payslip.id}</span>
              <StatusBadge status={payslip.status} size="sm" />
            </div>
          </div>

          {/* Employee & Structure Info */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Employee Name</span>
              <span className="font-bold text-sm text-slate-900">{payslip.employeeName || payslip.employee_name}</span>
              <span className="text-slate-400 block font-mono mt-0.5">{payslip.employeeCode || payslip.employee_code}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Payrun Reference</span>
              <span className="font-semibold text-purple-700">{payslip.payrun_reference || payslip.payrunName || 'Batch'}</span>
              <span className="text-slate-500 block mt-0.5">Status: {payslip.status}</span>
            </div>
          </div>

          {/* Attendance-Based Proration Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1 text-xs text-slate-700">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Attendance-Based Proration</h4>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <span>
                Expected Hours: <strong className="text-slate-900">{payslip.expected_hours !== null && payslip.expected_hours !== undefined ? `${payslip.expected_hours}h` : 'N/A (No Schedule)'}</strong>
              </span>
              <span>
                Actual Hours: <strong className="text-slate-900">{payslip.actual_hours !== null && payslip.actual_hours !== undefined ? `${payslip.actual_hours}h` : '0.0h'}</strong>
              </span>
              <span>
                Worked: <strong className="text-blue-600">{payslip.worked_percentage !== null && payslip.worked_percentage !== undefined ? `${(Number(payslip.worked_percentage) * 100).toFixed(1)}%` : '100.0%'}</strong>
              </span>
            </div>
          </div>

          {/* Itemized Salary Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">Component / Rule Code</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {payslip.line_items && Object.keys(payslip.line_items).length > 0 ? (
                  Object.entries(payslip.line_items).map(([code, val]) => (
                    <tr key={code}>
                      <td className="p-3 font-mono font-semibold text-slate-900">
                        {code === 'CONTRACT_WAGE' ? 'Contract Wage (Reference)' : code}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(val as number)}</td>
                    </tr>
                  ))
                ) : payslip.lines && payslip.lines.length > 0 ? (
                  payslip.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-3 font-mono font-semibold text-slate-900">{line.ruleCode} ({line.ruleName})</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {line.category === 'Deduction' ? `-${formatCurrency(line.amount)}` : formatCurrency(line.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-slate-400">
                      No computed salary components yet. Click "Compute Payrun" from the Payrun details page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ad-hoc Adjustments Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ad-hoc Payslip Adjustments</h4>
              {canAdjust && (
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAdjModalOpen(true)}>
                  Add Adjustment
                </Button>
              )}
            </div>

            {payslip.adjustments && payslip.adjustments.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                {payslip.adjustments.map((adj) => {
                  const amtNum = parseFloat(String(adj.amount));
                  return (
                    <div key={adj.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-900 block">{adj.label}</span>
                        {adj.added_by_name && <span className="text-[10px] text-slate-400">Added by {adj.added_by_name}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold ${amtNum >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {amtNum >= 0 ? `+${formatCurrency(amtNum)}` : formatCurrency(amtNum)}
                        </span>
                        {canAdjust && (
                          <button
                            onClick={() => handleDeleteAdjustment(adj.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="Remove adjustment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No manual adjustments added.</p>
            )}
          </div>

          {/* Totals Box */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Basic Wage:</span>
                <span className="font-semibold">{formatCurrency(Number(payslip.basicWage || payslip.basic) || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gross Earnings:</span>
                <span className="font-semibold">{formatCurrency(Number(payslip.grossWage || payslip.gross) || 0)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Deductions:</span>
                <span className="font-semibold">-{formatCurrency(Number(payslip.totalDeductions || payslip.total_deductions) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Net Take-Home Pay:</span>
                <span className="text-blue-600 text-base">{formatCurrency(Number(payslip.netWage || payslip.net) || 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Adjustment Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add Payslip Adjustment</h3>
              <button onClick={() => setIsAdjModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdjustmentSubmit} className="p-6 space-y-4">
              {adjError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {adjError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Description / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Overtime Pay, Festival Incentive - Diwali"
                  value={adjLabel}
                  onChange={(e) => setAdjLabel(e.target.value)}
                  required
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount (₹) — positive for addition, negative for deduction
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2000 or -500"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  required
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setIsAdjModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmittingAdj}>
                  Save Adjustment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

