import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { IconButton } from '../../components/ui/IconButton';
import { payrollApi } from '../../services/api/payroll';
import { Payslip } from '../../types/payroll';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const PayslipsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await payrollApi.getPayslips();
      setPayslips(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filtered = payslips.filter(
    (ps) =>
      (ps.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      (ps.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (ps.employeeCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Payslip>[] = [
    {
      key: 'reference',
      header: 'Payslip Ref',
      sortable: true,
      accessor: (item) => <span className="font-mono font-bold text-slate-900">{item.reference}</span>,
    },
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.employeeName}</span>
          <span className="text-xs text-slate-400 font-mono">{item.employeeCode}</span>
        </div>
      ),
    },
    {
      key: 'payrunName',
      header: 'Payrun Batch',
      accessor: (item) => <span className="text-xs font-medium text-slate-600">{item.payrunName}</span>,
    },
    {
      key: 'grossWage',
      header: 'Gross Wage',
      align: 'right',
      accessor: (item) => formatCurrency(Number(item.grossWage || item.gross) || 0),
    },
    {
      key: 'netWage',
      header: 'Net Wage',
      align: 'right',
      accessor: (item) => <span className="font-bold text-blue-600">{formatCurrency(Number(item.netWage || item.net) || 0)}</span>,
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
      <PageHeader
        title="Employee Payslips"
        subtitle="View and download individual computed salary slips and deduction itemizations."
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Payslips' },
        ]}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search payslip ref, employee..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/payroll/payslips/${item.id}`)}
        actions={(item) => (
          <IconButton
            icon={<ExternalLink className="w-4 h-4" />}
            label="View payslip detail"
            onClick={() => navigate(`/payroll/payslips/${item.id}`)}
          />
        )}
      />
    </div>
  );
};
