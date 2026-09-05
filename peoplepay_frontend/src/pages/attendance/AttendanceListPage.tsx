import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { usePermissions } from '../../hooks/usePermissions';
import { attendanceApi } from '../../services/api/attendance';
import { employeesApi } from '../../services/api/employees';
import { ApiError } from '../../services/api/client';
import { Attendance } from '../../types/attendance';
import { Employee } from '../../types/employee';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'on_leave', label: 'On Leave' },
];

export const AttendanceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [statusVal, setStatusVal] = useState('present');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [attRes, empRes] = await Promise.all([
      attendanceApi.getAll(),
      employeesApi.getAll(),
    ]);
    setAttendance(attRes.data || []);
    setEmployees(empRes.data || []);
    if (empRes.data && empRes.data.length > 0 && !employeeId) {
      setEmployeeId(empRes.data[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // Default checkIn to current ISO string formatted for datetime-local
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setCheckIn(now.toISOString().slice(0, 16));
  }, []);

  const resetForm = () => {
    if (employees.length > 0) {
      setEmployeeId(employees[0].id);
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setCheckIn(now.toISOString().slice(0, 16));
    setCheckOut('');
    setStatusVal('present');
    setNotes('');
    setGlobalError(null);
  };

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setGlobalError('Please select an employee.');
      return;
    }
    if (!checkIn) {
      setGlobalError('Check-in date and time is required.');
      return;
    }
    setSubmitting(true);
    setGlobalError(null);

    const payload: any = {
      employee: parseInt(employeeId, 10),
      check_in: new Date(checkIn).toISOString(),
      status: statusVal,
      notes: notes.trim(),
    };
    if (checkOut) {
      payload.check_out = new Date(checkOut).toISOString();
    }

    try {
      await attendanceApi.create(payload);
      setToastMessage('Attendance entry recorded successfully!');
      setIsModalOpen(false);
      resetForm();
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setGlobalError(err.message || 'Failed to record attendance entry.');
      } else {
        setGlobalError(err?.message || 'Failed to record attendance entry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = (attendance || []).filter(
    (a) =>
      (a.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} (${e.code})`,
  }));

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

  const { canPerformAction } = usePermissions();
  const canManageAttendance = canPerformAction('manage_attendance');

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Attendance Records"
        subtitle="Track daily employee check-ins, check-outs, worked hours, and overtime."
        breadcrumbs={[{ label: 'Attendance' }]}
        actions={
          canManageAttendance ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              Record Attendance
            </Button>
          ) : undefined
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

      {/* Record Attendance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
        title="Record Attendance (HR Manual Entry)"
        description="Manually record check-in/out timestamps for an employee."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleRecordAttendance} disabled={submitting} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {submitting ? 'Saving...' : 'Record Attendance'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordAttendance} className="space-y-4 text-left">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          <Select
            label="Employee *"
            options={employeeOptions}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Check In Time *"
              type="datetime-local"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
            <Input
              label="Check Out Time (Optional)"
              type="datetime-local"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              helperText="Leave blank if employee is still checked in"
            />
          </div>

          <Select
            label="Attendance Status *"
            options={STATUS_OPTIONS}
            value={statusVal}
            onChange={(e) => setStatusVal(e.target.value)}
          />

          <Input
            label="Notes / Reason (Optional)"
            placeholder="e.g. Manual correction, approved doctor appointment"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
