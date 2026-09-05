import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { payrollApi } from '../../services/api/payroll';
import { Payslip } from '../../types/payroll';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const PayslipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (id) {
        const res = await payrollApi.getPayslipById(id);
        setPayslip(res.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

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

  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Demo data — backend not yet connected</span>
      </div>
      <PageHeader
        title={`Payslip: ${payslip.reference}`}
        subtitle={`${payslip.employeeName} (${payslip.employeeCode})`}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Payslips', href: '/payroll/payslips' },
          { label: payslip.reference },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Print Payslip
            </Button>
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/payroll/payslips')}>
              Back to List
            </Button>
          </div>
        }
      />

      {/* Official Payslip Printable Document Layout */}
      <Card className="max-w-3xl mx-auto border-2 border-slate-200">
        <CardContent className="p-8 space-y-6">
          {/* Header Branding */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">PEOPLEPAY360</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Official Payroll Payslip Document</p>
              <p className="text-xs text-slate-400 mt-1">Period: {formatDate(payslip.periodStart)} to {formatDate(payslip.periodEnd)}</p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-base text-slate-900 block">{payslip.reference}</span>
              <StatusBadge status={payslip.status} size="sm" />
            </div>
          </div>

          {/* Employee & Structure Info */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Employee Name</span>
              <span className="font-bold text-sm text-slate-900">{payslip.employeeName}</span>
              <span className="text-slate-400 block font-mono mt-0.5">{payslip.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Salary Structure</span>
              <span className="font-semibold text-purple-700">{payslip.salaryStructureName}</span>
              <span className="text-slate-500 block mt-0.5">Payrun: {payslip.payrunName}</span>
            </div>
          </div>

          {/* Itemized Salary Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">Rule Code</th>
                  <th className="p-3">Description / Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {payslip.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="p-3 font-mono font-semibold text-slate-900">{line.ruleCode}</td>
                    <td className="p-3 font-medium">{line.ruleName}</td>
                    <td className="p-3">
                      <span className={line.category === 'Deduction' ? 'text-rose-600 font-medium' : 'text-slate-700'}>
                        {line.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {line.category === 'Deduction' ? `-${formatCurrency(line.amount)}` : formatCurrency(line.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Box */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Monthly Earnings:</span>
                <span className="font-semibold">{formatCurrency(payslip.grossWage)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Deductions:</span>
                <span className="font-semibold">-{formatCurrency(payslip.totalDeductions)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Net Take-Home Pay:</span>
                <span className="text-blue-600 text-base">{formatCurrency(payslip.netWage)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
