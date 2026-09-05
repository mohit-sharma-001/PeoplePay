import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Check, X, CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { timeOffApi } from '../../services/api/timeoff';
import { ApiError } from '../../services/api/client';
import { TimeOffRequest, TimeOffAllocation, TimeOffType } from '../../types/timeoff';
import { formatDate } from '../../utils/formatters';

export const TimeOffRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const userEmployeeId = user?.employee_id ? String(user.employee_id) : null;
  const hasEmployeeProfile = Boolean(userEmployeeId);

  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [splitWarning, setSplitWarning] = useState<{ paid: number; unpaid: number; msg: string } | null>(null);

  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [allocationId, setAllocationId] = useState('');
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const { canPerformAction } = usePermissions();
  const canApproveTimeOff = canPerformAction('approve_timeoff');

  const loadData = async () => {
    setIsLoading(true);
    const [reqRes, typRes] = await Promise.all([
      timeOffApi.getRequests(statusParam ? { status: statusParam } : undefined),
      timeOffApi.getTypes(),
    ]);
    setRequests(reqRes.data || []);
    setTypes(typRes.data || []);

    if (typRes.data && typRes.data.length > 0 && !timeOffTypeId) {
      setTimeOffTypeId(typRes.data[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, statusParam]);

  // Auto-detect active allocation for the logged-in user's employee_id and selected leave type
  useEffect(() => {
    async function updateAllocations() {
      if (!userEmployeeId) {
        setAllocations([]);
        setAllocationId('');
        return;
      }
      const res = await timeOffApi.getAllocationsByEmployee(userEmployeeId, timeOffTypeId || undefined);
      const fetchedAllocations = res.data || [];
      setAllocations(fetchedAllocations);

      if (fetchedAllocations.length > 0) {
        setAllocationId(fetchedAllocations[0].id);
      } else {
        setAllocationId('');
      }
    }
    updateAllocations();
  }, [userEmployeeId, timeOffTypeId]);

  const resetForm = () => {
    if (types.length > 0) setTimeOffTypeId(types[0].id);
    setDateFrom(new Date().toISOString().split('T')[0]);
    setDateTo(new Date().toISOString().split('T')[0]);
    setReason('');
    setGlobalError(null);
    setSplitWarning(null);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmployeeId) {
      setGlobalError('Your user account is not linked to an employee profile.');
      return;
    }
    if (!timeOffTypeId) {
      setGlobalError('Please select a time off type.');
      return;
    }

    const selectedType = types.find((t) => String(t.id) === String(timeOffTypeId));
    if (selectedType && selectedType.allocationMode === 'Fixed' && !allocationId) {
      setGlobalError(`Time off type '${selectedType.name}' requires an active confirmed leave allocation, but none was found for your account.`);
      return;
    }

    if (!reason.trim()) {
      setGlobalError('Please specify a reason for taking time off.');
      return;
    }

    setSubmitting(true);
    setGlobalError(null);
    setSplitWarning(null);

    const payload: any = {
      employee: parseInt(userEmployeeId, 10),
      time_off_type: parseInt(timeOffTypeId, 10),
      date_from: dateFrom,
      date_to: dateTo,
      reason: reason.trim(),
    };
    if (allocationId) {
      payload.allocation = parseInt(allocationId, 10);
    }

    try {
      const res = await timeOffApi.createRequest(payload);
      const resObj = res.data?.data || res.data || {};
      const unpaid = parseFloat(resObj.unpaid_duration || '0');
      const paid = parseFloat(resObj.paid_duration || '0');

      if (unpaid > 0) {
        setSplitWarning({
          paid,
          unpaid,
          msg: resObj.warning_message || `Leave balance exceeded. ${paid} day(s) allocated as paid and ${unpaid} day(s) added as Unpaid Leave.`
        });
        setToastMessage('Request submitted with automatic unpaid leave split!');
      } else {
        setToastMessage('Time off request submitted successfully!');
        setIsModalOpen(false);
        resetForm();
      }
      await loadData();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        let msg = err.message || 'Failed to submit time off request.';
        if (err.errors && typeof err.errors === 'object') {
          const vals = Object.values(err.errors).flatMap((v) => (Array.isArray(v) ? v : [v]));
          if (vals.length > 0) msg = vals.join(' ');
        }
        setGlobalError(msg);
      } else {
        setGlobalError(err?.message || 'Failed to submit time off request.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await timeOffApi.approveRequest(id);
      setToastMessage('Time off request approved!');
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to approve request.');
    }
  };

  const handleRefuse = async (id: string) => {
    try {
      await timeOffApi.refuseRequest(id);
      setToastMessage('Time off request refused.');
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to refuse request.');
    }
  };

  const filtered = (requests || []).filter((r) => {
    const matchesSearch =
      (r.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.timeOffTypeName || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusParam) {
      const s = (r.status || '').toLowerCase();
      const target = statusParam.toLowerCase();
      if (target === 'submitted' || target === 'to_approve' || target === 'to approve') {
        return s === 'to approve' || s === 'submitted' || s === 'draft';
      }
      return s.includes(target);
    }

    return true;
  });

  const typeOptions = types.map((t) => ({ value: String(t.id), label: t.name }));
  const allocationOptions = allocations.length > 0
    ? allocations.map((a) => ({
        value: String(a.id),
        label: `${a.timeOffTypeName} (${a.remainingDays} days remaining)`,
      }))
    : [{ value: '', label: 'No active allocation for this leave type' }];

  const columns: Column<TimeOffRequest>[] = [
    {
      key: 'reference',
      header: 'Request Ref',
      sortable: true,
      accessor: (item) => <span className="font-mono font-bold text-slate-900">{item.reference || 'REQ-000'}</span>,
    },
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
      key: 'timeOffTypeName',
      header: 'Leave Type',
      sortable: true,
      accessor: (item) => <span className="text-xs font-semibold text-blue-600">{item.timeOffTypeName || 'Leave'}</span>,
    },
    {
      key: 'durationDays',
      header: 'Duration',
      sortable: true,
      accessor: (item) => <span className="font-bold text-slate-900">{item.durationDays || 1} day(s)</span>,
    },
    {
      key: 'startDate',
      header: 'Period',
      accessor: (item) => (
        <span className="text-xs font-mono">
          {formatDate(item.startDate || new Date().toISOString())} - {formatDate(item.endDate || new Date().toISOString())}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => <StatusBadge status={item.status || 'To Approve'} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Info Banner for Accounts Without Employee Profiles */}
      {!hasEmployeeProfile && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>This account has no employee profile linked — time off creation is only available for employee accounts.</span>
        </div>
      )}

      <PageHeader
        title="Time Off Requests"
        subtitle="Review, approve, or refuse employee leave applications."
        breadcrumbs={[
          { label: 'Time Off', href: '/time-off' },
          { label: 'Requests' },
        ]}
        actions={
          hasEmployeeProfile ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              Create Request
            </Button>
          ) : undefined
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search by request ref, employee, leave type..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        actions={canApproveTimeOff ? (item) => (
          <div className="flex items-center gap-1.5">
            {item.status === 'To Approve' || item.status === 'Draft' ? (
              <>
                <IconButton
                  icon={<Check className="w-4 h-4 text-emerald-600" />}
                  label="Approve leave request"
                  onClick={() => handleApprove(item.id)}
                />
                <IconButton
                  icon={<X className="w-4 h-4 text-rose-600" />}
                  label="Refuse leave request"
                  onClick={() => handleRefuse(item.id)}
                />
              </>
            ) : null}
          </div>
        ) : undefined}
      />

      {/* New Time Off Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
        title="Create Time Off Request"
        description="Apply for annual, sick, or unpaid leave."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={submitting}>
              {splitWarning ? 'Close' : 'Cancel'}
            </Button>
            {!splitWarning && (
              <Button onClick={handleCreateRequest} disabled={submitting} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </>
        }
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-left">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          {splitWarning && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Leave Balance Exceeded - Auto-Unpaid Overflow</span>
              </div>
              <p className="leading-relaxed font-medium">{splitWarning.msg}</p>
              <div className="p-2.5 bg-amber-100/60 rounded-lg flex justify-between font-mono font-bold text-amber-900">
                <span>Paid Duration: {splitWarning.paid} day(s)</span>
                <span>Unpaid Duration: {splitWarning.unpaid} day(s)</span>
              </div>
            </div>
          )}

          {!splitWarning && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Leave Type *"
                  options={typeOptions}
                  value={timeOffTypeId}
                  onChange={(e) => setTimeOffTypeId(e.target.value)}
                  required
                />
                <Select
                  label="Allocation Balance *"
                  options={allocationOptions}
                  value={allocationId}
                  onChange={(e) => setAllocationId(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date *"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  required
                />
                <Input
                  label="End Date *"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Reason / Note *"
                placeholder="Explain why you are taking leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};
