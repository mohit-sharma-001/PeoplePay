import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/Button';
import { timeOffApi } from '../../services/api/timeoff';
import { TimeOffAllocation } from '../../types/timeoff';

export const TimeOffAllocationsPage: React.FC = () => {
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await timeOffApi.getAllocations();
      setAllocations(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const columns: Column<TimeOffAllocation>[] = [
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
      accessor: (item) => <span className="font-medium text-blue-600">{item.timeOffTypeName}</span>,
    },
    {
      key: 'allocatedDays',
      header: 'Allocated Days',
      sortable: true,
      align: 'right',
      accessor: (item) => <span className="font-bold text-slate-900">{item.allocatedDays} days</span>,
    },
    {
      key: 'usedDays',
      header: 'Used Days',
      sortable: true,
      align: 'right',
      accessor: (item) => <span className="font-semibold text-rose-600">{item.usedDays} days</span>,
    },
    {
      key: 'remainingDays',
      header: 'Remaining Days',
      sortable: true,
      align: 'right',
      accessor: (item) => <span className="font-bold text-emerald-600">{item.remainingDays} days</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Allocations"
        subtitle="Manage yearly employee leave entitlements and balance tracking."
        breadcrumbs={[
          { label: 'Time Off', href: '/time-off' },
          { label: 'Allocations' },
        ]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            New Allocation
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={allocations}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
      />
    </div>
  );
};
