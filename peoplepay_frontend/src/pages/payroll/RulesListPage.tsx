import React, { useEffect, useState } from 'react';
import { Award, Plus, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { usePermissions } from '../../hooks/usePermissions';
import { payrollApi } from '../../services/api/payroll';
import { ApiError } from '../../services/api/client';
import { SalaryRule, SalaryStructure } from '../../types/payroll';

const CATEGORY_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'allowance', label: 'Allowance' },
  { value: 'gross', label: 'Gross' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'net', label: 'Net' },
];

const AMOUNT_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Amount (₹)' },
  { value: 'percentage', label: 'Percentage (%)' },
];

export const RulesListPage: React.FC = () => {
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Modal State
  const [deletingRule, setDeletingRule] = useState<SalaryRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [structureId, setStructureId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('allowance');
  const [sequence, setSequence] = useState('10');
  const [amountType, setAmountType] = useState('fixed');

  // Conditional fields
  const [fixedAmount, setFixedAmount] = useState('');
  const [percentageValue, setPercentageValue] = useState('');
  const [formula, setFormula] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [rRes, sRes] = await Promise.all([
      payrollApi.getRules(),
      payrollApi.getStructures(),
    ]);
    setRules(rRes.data || []);
    setStructures(sRes.data || []);
    if (sRes.data && sRes.data.length > 0 && !structureId) {
      setStructureId(sRes.data[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    if (structures.length > 0) setStructureId(structures[0].id);
    setName('');
    setCode('');
    setCategory('allowance');
    setSequence('10');
    setAmountType('fixed');
    setFixedAmount('');
    setPercentageValue('');
    setFormula('');
    setGlobalError(null);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureId) {
      setGlobalError('Please select a salary structure.');
      return;
    }
    if (!name.trim() || !code.trim()) {
      setGlobalError('Rule Description Name and Code are required.');
      return;
    }
    setSubmitting(true);
    setGlobalError(null);

    const payload: any = {
      structure: parseInt(structureId, 10),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      amount_type: amountType,
      amount: amountType === 'fixed' ? parseFloat(fixedAmount || '0') : (amountType === 'percentage' ? parseFloat(percentageValue || '0') : 0),
      percentage_basis_code: '',
      formula: amountType === 'formula' ? formula.trim() : '',
    };

    try {
      await payrollApi.createRule(payload);
      setToastMessage('Salary Rule created successfully!');
      setIsModalOpen(false);
      resetForm();
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setGlobalError(err.message || 'Failed to create salary rule.');
      } else {
        setGlobalError(err?.message || 'Failed to create salary rule.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRule) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await payrollApi.deleteRule(deletingRule.id);
      setToastMessage(`Salary Rule "${deletingRule.name}" deleted successfully.`);
      setDeletingRule(null);
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete salary rule. It may be referenced by existing contracts or structures.');
    } finally {
      setIsDeleting(false);
    }
  };

  const structureOptions = structures.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }));

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
          {item.amountType === 'Percentage' ? '%' : '₹'})
        </span>
      ),
    },
  ];

  const { canPerformAction } = usePermissions();
  const canManageRules = canPerformAction('manage_structures');

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
        title="Salary Rules"
        subtitle="Manage payroll allowance formulas, statutory tax withholdings, and provident fund rules."
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Salary Rules' },
        ]}
        actions={
          canManageRules ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              New Rule
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={rules}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        actions={
          canManageRules ? (item) => (
            <IconButton
              icon={<Trash2 className="w-4 h-4 text-rose-600" />}
              label="Delete rule"
              onClick={() => setDeletingRule(item)}
            />
          ) : undefined
        }
      />

      {/* Delete Rule Confirmation Modal */}
      <Modal
        isOpen={!!deletingRule}
        onClose={() => {
          if (!isDeleting) setDeletingRule(null);
        }}
        title="Delete Salary Rule"
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

          {deletingRule && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono">
              <span className="font-bold text-slate-900">{deletingRule.code}</span> — {deletingRule.name} ({deletingRule.category})
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingRule(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteRule}
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
        title="Create Salary Rule"
        description="Configure allowance, deduction, or tax withholding formula."
        maxWidth="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={submitting} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {submitting ? 'Saving...' : 'Create Rule'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRule} className="space-y-4 text-left">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          <Select
            label="Salary Structure *"
            options={structureOptions}
            value={structureId}
            onChange={(e) => setStructureId(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rule Name *"
              placeholder="e.g. House Rent Allowance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Rule Code *"
              placeholder="e.g. HRA"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              helperText="Uppercase identifier code"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category *"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Select
              label="Computation Type *"
              options={AMOUNT_TYPE_OPTIONS}
              value={amountType}
              onChange={(e) => setAmountType(e.target.value)}
            />
          </div>

          {/* Conditional Inputs Based on Amount Type */}
          {amountType === 'fixed' && (
            <Input
              label="Fixed Amount (₹) *"
              type="number"
              step="0.01"
              placeholder="e.g. 500"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              required
            />
          )}

          {amountType === 'percentage' && (
            <Input
              label="Percentage Value (%) *"
              type="number"
              step="0.01"
              placeholder="e.g. 40"
              value={percentageValue}
              onChange={(e) => setPercentageValue(e.target.value)}
              required
            />
          )}

          {amountType === 'formula' && (
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Formula Expression *
              </label>
              <textarea
                rows={3}
                className="w-full p-3 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                placeholder="e.g. contract.wage * 0.40 if contract.wage > 50000 else contract.wage * 0.30"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                required
              />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
