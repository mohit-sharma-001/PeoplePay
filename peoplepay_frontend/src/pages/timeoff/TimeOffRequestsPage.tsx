import React, { useEffect, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { timeOffApi } from '../../services/api/timeoff';
import { TimeOffRequest } from '../../types/timeoff';
import { formatDate } from '../../utils/formatters';

export const TimeOffRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await timeOffApi.getRequests();
      setRequests(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filtered = requests.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.timeOffTypeName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<TimeOffRequest>[] = [
    {
      key: 'reference',
      header: 'Request Ref',
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
          <span className="text-xs text-slate-500">{item.department}</span>
        </div>
      ),
    },
    {
      key: 'timeOffTypeName',
      header: 'Leave Type',
      sortable: true,
      accessor: (item) => <span className="text-xs font-semibold text-blue-600">{item.timeOffTypeName}</span>,
    },
    {
      key: 'durationDays',
      header: 'Duration',
      sortable: true,
      accessor: (item) => <span className="font-bold text-slate-900">{item.durationDays} day(s)</span>,
    },
    {
      key: 'startDate',
      header: 'Period',
      accessor: (item) => (
        <span className="text-xs font-mono">
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </span>
      ),
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
        title="Time Off Requests"
        subtitle="Review, approve, or refuse employee leave applications."
        breadcrumbs={[
          { label: 'Time Off', href: '/time-off' },
          { label: 'Requests' },
        ]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create Request
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search by request ref, employee, leave type..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
      />
    </div>
  );
};
