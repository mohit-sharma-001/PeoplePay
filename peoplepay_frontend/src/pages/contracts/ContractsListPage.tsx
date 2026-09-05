import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { contractsApi } from '../../services/api/contracts';
import { Contract } from '../../types/contract';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const ContractsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await contractsApi.getAll();
      setContracts(res.data || []);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filtered = (contracts || []).filter(
    (c) =>
      (c.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.department || '').toLowerCase().includes(search.toLowerCase())
  );

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
      <PageHeader
        title="Employment Contracts"
        subtitle="Manage salary agreements, contract terms, structures, and validity periods."
        breadcrumbs={[{ label: 'Contracts' }]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
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
    </div>
  );
};
