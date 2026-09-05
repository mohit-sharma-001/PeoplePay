import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, FileText, Layers, Award, Plus, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { payrollApi } from '../../services/api/payroll';
import { Payrun, Payslip } from '../../types/payroll';
import { formatCurrency } from '../../utils/formatters';

export const PayrollDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [prRes, psRes] = await Promise.all([
        payrollApi.getPayruns(),
        payrollApi.getPayslips(),
      ]);
      setPayruns(prRes.data);
      setPayslips(psRes.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const latestPayrun = payruns[payruns.length - 1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        subtitle="Process monthly payruns, calculate salary structures, generate payslips, and review rules."
        breadcrumbs={[{ label: 'Payroll' }]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/payroll/payruns/new')}>
            New Payrun
          </Button>
        }
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable className="cursor-pointer" onClick={() => navigate('/payroll/payruns')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payruns</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{payruns.length}</h2>
              <span className="text-xs text-slate-500 mt-0.5 inline-block">Executed & Drafts</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Banknote className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable className="cursor-pointer" onClick={() => navigate('/payroll/payslips')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Payslips</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{payslips.length}</h2>
              <span className="text-xs text-emerald-600 font-semibold mt-0.5 inline-block">Verified slips</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable className="cursor-pointer" onClick={() => navigate('/payroll/structures')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary Structures</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">3 Active</h2>
              <span className="text-xs text-slate-500 mt-0.5 inline-block">Standard & Executive</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable className="cursor-pointer" onClick={() => navigate('/payroll/rules')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary Rules</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">6 Rules</h2>
              <span className="text-xs text-slate-500 mt-0.5 inline-block">Allowances & Deductions</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payruns List Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payruns</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/payroll/payruns')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            View All Payruns
          </Button>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100 text-xs">
          {payruns.map((pr) => (
            <div key={pr.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">{pr.reference}</span>
                  <StatusBadge status={pr.status} size="sm" />
                </div>
                <p className="text-slate-500 mt-0.5">{pr.name} ({pr.totalEmployees} employees)</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-slate-900">{formatCurrency(pr.totalNet)}</p>
                <p className="text-slate-400">Total Net Payout</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
