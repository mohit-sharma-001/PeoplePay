import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Banknote, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/shared/DataTable';
import { payrollApi } from '../../services/api/payroll';
import { Payrun, Payslip } from '../../types/payroll';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const PayrunDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (id) {
        const [prRes, psRes] = await Promise.all([
          payrollApi.getPayrunById(id),
          payrollApi.getPayslips(id),
        ]);
        setPayrun(prRes.data);
        setPayslips(psRes.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

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
      accessor: (item) => formatCurrency(item.grossWage),
    },
    {
      key: 'totalDeductions',
      header: 'Deductions',
      align: 'right',
      accessor: (item) => <span className="text-rose-600">{formatCurrency(item.totalDeductions)}</span>,
    },
    {
      key: 'netWage',
      header: 'Net Wage',
      align: 'right',
      accessor: (item) => <span className="font-bold text-blue-600">{formatCurrency(item.netWage)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payrun: ${payrun.reference}`}
        subtitle={payrun.name}
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Payruns', href: '/payroll/payruns' },
          { label: payrun.reference },
        ]}
        actions={
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/payroll/payruns')}>
            Back to Payruns
          </Button>
        }
      />

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
                {formatDate(payrun.periodStart)} - {formatDate(payrun.periodEnd)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Employees</span>
              <span className="font-bold text-slate-900 text-sm">{payrun.totalEmployees}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Gross</span>
              <span className="font-semibold text-slate-800 text-sm">{formatCurrency(payrun.totalGross)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Net Payout</span>
              <span className="font-bold text-blue-600 text-base">{formatCurrency(payrun.totalNet)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included Employee Payslips</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={payslips}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => navigate(`/payroll/payslips/${item.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
