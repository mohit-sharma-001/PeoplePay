import React, { useEffect, useState } from 'react';
import { Plus, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { usePermissions } from '../../hooks/usePermissions';
import { timeOffApi } from '../../services/api/timeoff';
import { TimeOffType } from '../../types/timeoff';
import { ApiError } from '../../services/api/client';

export const TimeOffTypesPage: React.FC = () => {
  const { canPerformAction } = usePermissions();
  const canManageTimeOff = canPerformAction('manage_timeoff');

  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Leave Type Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'days' | 'hours'>('days');
  const [requiresAllocation, setRequiresAllocation] = useState(true);
  const [isPaid, setIsPaid] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(true);

  // Bulk Allocate Modal State
  const [bulkType, setBulkType] = useState<TimeOffType | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [allocatedAmount, setAllocatedAmount] = useState('12');
  const [validFrom, setValidFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [validUntil, setValidUntil] = useState(() => `${new Date().getFullYear()}-12-31`);

  const loadData = async () => {
    setIsLoading(true);
    const res = await timeOffApi.getTypes();
    setTypes(res.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetCreateForm = () => {
    setName('');
    setUnit('days');
    setRequiresAllocation(true);
    setIsPaid(true);
    setRequiresApproval(true);
    setCreateError(null);
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError('Please enter a leave type name.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await timeOffApi.createType({
        name: name.trim(),
        unit,
        requires_allocation: requiresAllocation,
        is_paid: isPaid,
        requires_approval: requiresApproval,
      });

      setToastMessage(`Leave type '${name.trim()}' created successfully!`);
      setIsCreateModalOpen(false);
      resetCreateForm();
      await loadData();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        let msg = err.message || 'Failed to create leave type.';
        if (err.errors && typeof err.errors === 'object') {
          const vals = Object.values(err.errors).flatMap((v) => (Array.isArray(v) ? v : [v]));
          if (vals.length > 0) msg = vals.join(' ');
        }
        setCreateError(msg);
      } else {
        setCreateError(err?.message || 'Failed to create leave type.');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleBulkAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkType) return;

    const amt = parseFloat(allocatedAmount);
    if (isNaN(amt) || amt <= 0) {
      setBulkError('Please enter a valid positive allocation amount.');
      return;
    }
    if (!validFrom) {
      setBulkError('Please select a valid from date.');
      return;
    }

    setBulkSubmitting(true);
    setBulkError(null);
    try {
      const res = await timeOffApi.bulkAllocateType(bulkType.id, {
        allocated_amount: amt,
        valid_from: validFrom,
        valid_until: validUntil || undefined,
      });

      const resObj = res.data || ({} as any);
      const created = resObj.created ?? 0;
      const skipped = resObj.skipped ?? 0;

      setToastMessage(`Allocated to ${created} employees (${skipped} already had this leave type).`);
      setBulkType(null);
      await loadData();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        let msg = err.message || 'Failed to bulk-allocate leave.';
        if (err.errors && typeof err.errors === 'object') {
          const vals = Object.values(err.errors).flatMap((v) => (Array.isArray(v) ? v : [v]));
          if (vals.length > 0) msg = vals.join(' ');
        }
        setBulkError(msg);
      } else {
        setBulkError(err?.message || 'Failed to bulk-allocate leave.');
      }
    } finally {
      setBulkSubmitting(false);
    }
  };

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
        title="Time Off Types"
        subtitle="Configure company leave categories, approval policies, and accrual modes."
        breadcrumbs={[
          { label: 'Time Off', href: '/time-off' },
          { label: 'Leave Types' },
        ]}
        actions={
          canManageTimeOff ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
              New Leave Type
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((type) => (
          <Card key={type.id} hoverable className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                <CardTitle>{type.name}</CardTitle>
              </div>
              <Badge variant="stone" size="sm">
                {type.code}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Unit</span>
                  <span className="font-semibold text-slate-900 capitalize">{type.unit || 'days'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Paid Status</span>
                  <span className="font-semibold text-slate-900">{type.isPaid ?? true ? 'Paid Leave' : 'Unpaid Leave'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Requires Approval</span>
                  <span className="font-semibold text-slate-900">{type.requiresApproval ? 'Yes (Manager & Admin)' : 'No (Auto)'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Allocation Mode</span>
                  <span className="font-semibold text-blue-600">{type.allocationMode}</span>
                </div>
              </div>

              {canManageTimeOff && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs flex items-center justify-center gap-1.5"
                    leftIcon={<Users className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setBulkType(type);
                      setBulkError(null);
                    }}
                  >
                    Grant to All Employees
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Leave Type Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!createSubmitting) {
            setIsCreateModalOpen(false);
            resetCreateForm();
          }
        }}
        title="Create Time Off Type"
        description="Add a new leave category with custom policies."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }} disabled={createSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateType} disabled={createSubmitting} leftIcon={createSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {createSubmitting ? 'Creating...' : 'Create Leave Type'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateType} className="space-y-4 text-left">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          <Input
            label="Leave Type Name *"
            placeholder="e.g. Paternity Leave"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Unit of Measure *"
            options={[
              { value: 'days', label: 'Days' },
              { value: 'hours', label: 'Hours' },
            ]}
            value={unit}
            onChange={(e) => setUnit(e.target.value as any)}
          />

          <Select
            label="Requires Allocation Balance *"
            options={[
              { value: 'true', label: 'Yes — Requires Granted Allocation Balance (Fixed)' },
              { value: 'false', label: 'No — Unlimited / No Pre-allocation Required' },
            ]}
            value={String(requiresAllocation)}
            onChange={(e) => setRequiresAllocation(e.target.value === 'true')}
          />

          <Select
            label="Is Paid Leave *"
            options={[
              { value: 'true', label: 'Yes — Paid Leave' },
              { value: 'false', label: 'No — Unpaid Leave' },
            ]}
            value={String(isPaid)}
            onChange={(e) => setIsPaid(e.target.value === 'true')}
          />

          <Select
            label="Requires Approval *"
            options={[
              { value: 'true', label: 'Yes — Explicit Approval Required' },
              { value: 'false', label: 'No — Auto-Approved' },
            ]}
            value={String(requiresApproval)}
            onChange={(e) => setRequiresApproval(e.target.value === 'true')}
          />
        </form>
      </Modal>

      {/* Bulk Allocate Modal */}
      {bulkType && (
        <Modal
          isOpen={!!bulkType}
          onClose={() => {
            if (!bulkSubmitting) setBulkType(null);
          }}
          title={`Bulk Allocate Leave: ${bulkType.name}`}
          description="Grant leave balance to all active employees who do not already have an allocation for this period."
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setBulkType(null)} disabled={bulkSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleBulkAllocate} disabled={bulkSubmitting} leftIcon={bulkSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {bulkSubmitting ? 'Allocating...' : 'Grant to All Employees'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleBulkAllocate} className="space-y-4 text-left">
            {bulkError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bulkError}</span>
              </div>
            )}

            <Input
              label="Allocated Days/Amount *"
              type="number"
              step="0.5"
              min="0.5"
              placeholder="e.g. 12"
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Valid From *"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
              <Input
                label="Valid Until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
