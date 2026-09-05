import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { attendanceApi } from '../../services/api/attendance';
import { Attendance } from '../../types/attendance';
import { formatDate } from '../../utils/formatters';

export const AttendanceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await attendanceApi.getAll();
      setAttendance(res.data || []);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filtered = (attendance || []).filter(
    (a) =>
      (a.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Attendance>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      accessor: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block">{item.employeeName || 'Employee'}</span>
          <span className="text-xs text-slate-500">{item.department || 'Engineering'}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      accessor: (item) => formatDate(item.date || new Date().toISOString()),
    },
    {
      key: 'checkIn',
      header: 'Check In',
      accessor: (item) => <span className="font-mono text-xs">{item.checkIn || '-'}</span>,
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      accessor: (item) => <span className="font-mono text-xs">{item.checkOut || '-'}</span>,
    },
    {
      key: 'workedHours',
      header: 'Worked Hours',
      sortable: true,
      align: 'right',
      accessor: (item) => <span className="font-bold text-slate-900">{item.workedHours || 0} hrs</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => <StatusBadge status={item.status || 'Present'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Records"
        subtitle="Track daily employee check-ins, check-outs, worked hours, and overtime."
        breadcrumbs={[{ label: 'Attendance' }]}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Record Attendance
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search employee name, department..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/attendance/${item.id}`)}
        actions={(item) => (
          <IconButton
            icon={<ExternalLink className="w-4 h-4" />}
            label="View details"
            onClick={() => navigate(`/attendance/${item.id}`)}
          />
        )}
      />
    </div>
  );
};
