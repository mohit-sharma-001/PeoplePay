import React, { useEffect, useState } from 'react';
import { Layers, Plus, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { payrollApi } from '../../services/api/payroll';
import { ApiError } from '../../services/api/client';
import { SalaryStructure } from '../../types/payroll';

export const StructuresListPage: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Modal State
  const [deletingStructure, setDeletingStructure] = useState<SalaryStructure | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const res = await payrollApi.getStructures();
    setStructures(res.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName('');
    setCode('');
    setGlobalError(null);
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setGlobalError('Both Structure Name and Code are required.');
      return;
    }
    setSubmitting(true);
    setGlobalError(null);

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
    };

    try {
      await payrollApi.createStructure(payload);
      setToastMessage('Salary Structure created successfully!');
      setIsModalOpen(false);
      resetForm();
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setGlobalError(err.message || 'Failed to create salary structure.');
      } else {
        setGlobalError(err?.message || 'Failed to create salary structure.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStructure = async () => {
    if (!deletingStructure) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await payrollApi.deleteStructure(deletingStructure.id);
      setToastMessage(`Salary Structure "${deletingStructure.name}" deleted successfully.`);
      setDeletingStructure(null);
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete salary structure. It may be referenced by existing contracts or rules.');
    } finally {
      setIsDeleting(false);
    }
  };

  const { user } = useAuth();
  const canManagePayroll = user?.role === 'Admin' || user?.role === 'HR Payroll Manager';

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
        title="Salary Structures"
        subtitle="Define salary computation profiles and associate rule sequences."
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Salary Structures' },
        ]}
        actions={
          canManagePayroll ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              New Structure
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {structures.map((struct) => (
          <Card key={struct.id} hoverable>
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>{struct.name}</CardTitle>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{struct.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="purple">{struct.type}</Badge>
                {canManagePayroll && (
                  <IconButton
                    icon={<Trash2 className="w-4 h-4 text-rose-600" />}
                    label="Delete structure"
                    onClick={() => setDeletingStructure(struct)}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="font-semibold text-slate-700">Included Rules ({struct.rules?.length || 0}):</p>
              <div className="flex flex-wrap gap-1.5">
                {struct.rules?.map((r) => (
                  <Badge key={r.id} variant={r.category === 'Deduction' ? 'rose' : 'blue'}>
                    {r.code}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Structure Confirmation Modal */}
      <Modal
        isOpen={!!deletingStructure}
        onClose={() => {
          if (!isDeleting) setDeletingStructure(null);
        }}
        title="Delete Salary Structure"
        description="Are you sure you want to delete this? This cannot be undone."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {deletingStructure && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono">
              <span className="font-bold text-slate-900">{deletingStructure.code}</span> — {deletingStructure.name}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingStructure(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteStructure}
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Structure Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
        title="Create Salary Structure"
        description="Add a new salary computation profile to payroll configuration."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateStructure} disabled={submitting} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {submitting ? 'Saving...' : 'Create Structure'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStructure} className="space-y-4 text-left">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          <Input
            label="Structure Name *"
            placeholder="e.g. Executive Regular Salary Structure"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Structure Code *"
            placeholder="e.g. EXEC_STD"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            helperText="Short uppercase reference code"
            required
          />
        </form>
      </Modal>
    </div>
  );
};
