import React, { useEffect, useState } from 'react';
import { Clock, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { employeesApi } from '../../services/api/employees';
import { usePermissions } from '../../hooks/usePermissions';
import { WorkingSchedule } from '../../types/employee';

const DEFAULT_WEEKDAYS = [
  { day_of_week: 0, name: 'Monday' },
  { day_of_week: 1, name: 'Tuesday' },
  { day_of_week: 2, name: 'Wednesday' },
  { day_of_week: 3, name: 'Thursday' },
  { day_of_week: 4, name: 'Friday' },
];

export const SchedulesPage: React.FC = () => {
  const { canPerformAction } = usePermissions();
  const canManageSchedules = canPerformAction('manage_schedules');

  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkingSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState('fixed');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await employeesApi.getSchedules();
    setSchedules(res.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSchedule(null);
    setName('');
    setScheduleType('fixed');
    setStartTime('09:00');
    setEndTime('18:00');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sch: WorkingSchedule) => {
    setEditingSchedule(sch);
    setName(sch.name);
    setScheduleType(sch.flexible ? 'flexible' : 'fixed');
    const firstDay = sch.days && sch.days.length > 0 ? sch.days[0] : null;
    setStartTime(firstDay?.startTime || '09:00');
    setEndTime(firstDay?.endTime || '18:00');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please provide a schedule name.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const lines = DEFAULT_WEEKDAYS.map((d) => ({
      day_of_week: d.day_of_week,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      break_minutes: 60,
    }));

    const payload = {
      name: name.trim(),
      schedule_type: scheduleType,
      company_name: 'PeoplePay Inc.',
      lines,
    };

    try {
      if (editingSchedule) {
        await employeesApi.updateSchedule(editingSchedule.id, payload);
        setToastMessage('Working schedule updated successfully!');
      } else {
        await employeesApi.createSchedule(payload);
        setToastMessage('New working schedule created successfully!');
      }
      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save working schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await employeesApi.deleteSchedule(deletingId);
      setToastMessage('Working schedule deleted.');
      setIsDeleteModalOpen(false);
      await loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete schedule.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Working Schedules"
        subtitle="Manage company working hours, shift patterns, and weekly schedules."
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: 'Working Schedules' },
        ]}
        actions={
          canManageSchedules ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              New Working Schedule
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((sch) => (
            <Card key={sch.id} hoverable className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle className="text-base text-[var(--text-primary)]">{sch.name}</CardTitle>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{sch.timeZone || 'Asia/Kolkata (IST)'}</p>
                    </div>
                    <Badge variant={sch.flexible ? 'purple' : 'blue'}>
                      {sch.flexible ? 'Flexible' : 'Fixed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between font-medium text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] p-2.5 rounded-lg border border-[var(--border-color)]">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Weekly Work Target
                    </span>
                    <span className="font-bold text-[var(--brand-primary)]">{sch.hoursPerWeek} hrs/week</span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Day Schedule Breakdown</p>
                    {sch.days && sch.days.length > 0 ? (
                      sch.days.map((day) => (
                        <div key={day.day} className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)] last:border-0">
                          <span className="font-semibold text-[var(--text-primary)]">{day.day}</span>
                          <span className="font-mono text-xs text-[var(--text-secondary)] font-medium">
                            {day.startTime} - {day.endTime} ({day.workHours}h)
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] italic">Mon-Fri (09:00 - 18:00)</p>
                    )}
                  </div>
                </CardContent>
              </div>

              {canManageSchedules && (
                <div className="p-3 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-color)] flex items-center justify-end gap-2 rounded-b-xl">
                  <IconButton
                    icon={<Edit3 className="w-4 h-4 text-blue-600" />}
                    label="Edit schedule"
                    onClick={() => openEditModal(sch)}
                  />
                  <IconButton
                    icon={<Trash2 className="w-4 h-4 text-rose-600" />}
                    label="Delete schedule"
                    onClick={() => openDeleteModal(sch.id)}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { if (!submitting) setIsModalOpen(false); }}
        title={editingSchedule ? 'Edit Working Schedule' : 'Create Working Schedule'}
        description="Configure shift timings, weekly targets, and working days."
        maxWidth="md"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Schedule Name"
            placeholder="e.g. Standard 40h Shift, Night Shift"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Schedule Type"
            value={scheduleType}
            onChange={(e) => setScheduleType(e.target.value)}
            options={[
              { value: 'fixed', label: 'Fixed Working Hours' },
              { value: 'flexible', label: 'Flexible Schedule' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shift Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="Shift End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] italic">
            Applies shift pattern to weekdays (Monday through Friday) with 1-hour lunch break.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {editingSchedule ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { if (!isDeleting) setIsDeleteModalOpen(false); }}
        title="Delete Working Schedule"
        description="Are you sure you want to delete this schedule?"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSchedule} isLoading={isDeleting}>
              Delete Schedule
            </Button>
          </>
        }
      >
        <p className="text-xs text-[var(--text-secondary)] py-2">
          This will permanently remove the working schedule pattern. Employees assigned to this schedule will revert to standard hours.
        </p>
      </Modal>
    </div>
  );
};
