import React, { useEffect, useState } from 'react';
import { Award, Plus } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { payrollApi } from '../../services/api/payroll';
import { SalaryRule } from '../../types/payroll';

export const RulesListPage: React.FC = () => {
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await payrollApi.getRules();
      setRules(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const columns: Column<SalaryRule>[] = [
    {
      key: 'sequence',
      header: 'Seq',
      sortable: true,
      align: 'center',
      accessor: (item) => <span className="font-mono text-slate-500 font-bold">{item.sequence}</span>,
    },
    {
      key: 'code',
      header: 'Rule Code',
      sortable: true,
      accessor: (item) => <span className="font-mono font-bold text-slate-900">{item.code}</span>,
    },
    {
      key: 'name',
      header: 'Rule Description',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.name}</span>
          <span className="text-xs text-slate-500">{item.description}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      accessor: (item) => (
        <Badge variant={item.category === 'Deduction' ? 'rose' : item.category === 'Basic' ? 'emerald' : 'blue'}>
          {item.category}
        </Badge>
      ),
    },
    {
      key: 'amountType',
      header: 'Computation Type',
      accessor: (item) => (
        <span className="font-medium text-slate-700">
          {item.amountType} ({item.amountValue}
          {item.amountType === 'Percentage' ? '%' : '$'})
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Rules"
        subtitle="Manage payroll allowance formulas, statutory tax withholdings, and provident fund rules."
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Salary Rules' },
        ]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            New Rule
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rules}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
      />
    </div>
  );
};
