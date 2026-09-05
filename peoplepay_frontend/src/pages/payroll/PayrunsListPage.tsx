import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Banknote, ExternalLink, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { payrollApi } from '../../services/api/payroll';
import { Payrun } from '../../types/payroll';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const PayrunsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await payrollApi.getPayruns();
      setPayruns(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filtered = payruns.filter(
    (p) =>
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
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
      header: 'Batch Description',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.name}</span>
          <span className="text-xs text-slate-500 font-mono">
            {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
          </span>
        </div>
      ),
    },
    {
      key: 'totalEmployees',
      header: 'Headcount',
      align: 'center',
      accessor: (item) => <span className="font-semibold text-slate-800">{item.totalEmployees}</span>,
    },
    {
      key: 'totalGross',
      header: 'Total Gross',
      align: 'right',
      accessor: (item) => <span className="font-medium text-slate-700">{formatCurrency(item.totalGross)}</span>,
    },
    {
      key: 'totalNet',
      header: 'Total Net',
      align: 'right',
      accessor: (item) => <span className="font-bold text-blue-600">{formatCurrency(item.totalNet)}</span>,
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
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Demo data — backend not yet connected</span>
      </div>
      <PageHeader
        title="Payrun Batches"
        subtitle="Manage batch payroll execution, computations, and disbursement workflows."
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Payruns' },
        ]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/payroll/payruns/new')}>
            New Payrun
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search payrun ref, name..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
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
    </div>
  );
};
