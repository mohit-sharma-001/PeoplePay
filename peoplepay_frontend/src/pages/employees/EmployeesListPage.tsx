import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Mail, Phone, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { employeesApi } from '../../services/api/employees';
import { Employee } from '../../types/employee';

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await employeesApi.getAll();
      setEmployees(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filtered = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <Avatar src={item.avatarUrl} name={`${item.firstName} ${item.lastName}`} size="md" />
          <div>
            <span className="font-semibold text-slate-900 block">{item.firstName} {item.lastName}</span>
            <span className="text-xs text-slate-400 font-mono">{item.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job Title & Department',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-medium text-slate-900 block">{item.jobTitle}</span>
          <span className="text-xs text-slate-500">{item.department}</span>
        </div>
      ),
    },
    {
      key: 'workLocation',
      header: 'Work Location',
      sortable: true,
    },
    {
      key: 'workingScheduleName',
      header: 'Working Schedule',
      accessor: (item) => <span className="text-xs font-medium text-slate-600">{item.workingScheduleName}</span>,
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
        title="Employees Directory"
        subtitle="Manage employee records, organizational roles, contracts, and schedules."
        breadcrumbs={[{ label: 'Employees' }]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            New Employee
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, department..." />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="No employees found"
        emptyDescription="No employee records match your search criteria."
        onRowClick={(item) => navigate(`/employees/${item.id}`)}
        actions={(item) => (
          <IconButton
            icon={<ExternalLink className="w-4 h-4" />}
            label="View profile"
            onClick={() => navigate(`/employees/${item.id}`)}
          />
        )}
      />
    </div>
  );
};
