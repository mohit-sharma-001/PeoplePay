import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, UserCheck, Search, Filter, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, Column } from '../../components/shared/DataTable';
import { SearchInput } from '../../components/shared/SearchInput';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { ManagedUser, Role } from '../../types/auth';

export const ManageUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, reloadUser } = useAuth();

  const isAdmin = user?.roles?.includes('Admin') || user?.role === 'Admin';

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Assign Role
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('Employee');
  const [isAssigning, setIsAssigning] = useState(false);
  const [modalError, setModalError] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const availableRoles: Role[] = ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'];

  const [totalUserCount, setTotalUserCount] = useState<number>(0);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadUsers();
  }, [isAdmin, activeTab]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const filter = activeTab === 'unassigned' ? 'Employee' : undefined;
      const [res, allRes] = await Promise.all([
        authService.getUsers(filter),
        authService.getUsers(),
      ]);
      if (res.success) {
        setUsers(res.data);
      }
      if (allRes.success) {
        setTotalUserCount(allRes.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignModal = (targetUser: ManagedUser) => {
    setSelectedUser(targetUser);
    const currentPrimary = (targetUser.roles?.[0] as Role) || 'Employee';
    setSelectedRole(currentPrimary);
    setModalError(undefined);
  };

  const handleConfirmRoleAssign = async () => {
    if (!selectedUser) return;
    setIsAssigning(true);
    setModalError(undefined);

    try {
      const res = await authService.assignRole(selectedUser.id, selectedRole);
      if (res.success) {
        // Optimistic local state update
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, roles: [selectedRole] } : u
          )
        );

        setToastMessage(`Successfully assigned role "${selectedRole}" to ${selectedUser.username}.`);
        setSelectedUser(null);

        // If self was updated, reload user context
        if (String(user?.id) === String(selectedUser.id)) {
          reloadUser();
        }

        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setModalError(res.error || 'Failed to assign role. Please try again.');
      }
    } catch {
      setModalError('An unexpected network error occurred.');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.employee_name && u.employee_name.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<ManagedUser>[] = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      accessor: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/20">
            {item.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-[var(--text-primary)] block">{item.username}</span>
            <span className="text-xs text-[var(--text-secondary)] font-mono">ID: #{item.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email Address',
      sortable: true,
      accessor: (item) => (
        <span className="text-xs text-[var(--text-secondary)] font-mono">{item.email}</span>
      ),
    },
    {
      key: 'roles',
      header: 'Current Role(s)',
      accessor: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.roles && item.roles.length > 0 ? (
            item.roles.map((r) => (
              <Badge
                key={r}
                variant={
                  r === 'Admin'
                    ? 'purple'
                    : r.includes('Payroll')
                    ? 'orange'
                    : r.includes('HR')
                    ? 'blue'
                    : 'stone'
                }
                size="sm"
              >
                {r}
              </Badge>
            ))
          ) : (
            <Badge variant="stone" size="sm">
              Employee
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'employee_name',
      header: 'Linked Employee',
      accessor: (item) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] block">
            {item.employee_name || 'Unlinked'}
          </span>
          {item.employee_id && (
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              {item.employee_code || `EMP${String(item.employee_id).padStart(4, '0')}`}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage System Users"
        subtitle="Assign roles, manage access privileges, and inspect registered user accounts."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Manage Users' }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadUsers} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Users
          </Button>
        }
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All System Users ({totalUserCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unassigned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'unassigned'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Unassigned (Employee Only)
          </button>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search by username, email, or employee name..." />
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        emptyTitle="No matching users found"
        emptyDescription="There are no system users matching your current filter criteria."
        actions={(item) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAssignModal(item)}
            leftIcon={<Shield className="w-3.5 h-3.5" />}
          >
            Assign Role
          </Button>
        )}
      />

      {/* Role Assignment Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Assign User System Role"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} disabled={isAssigning}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmRoleAssign} isLoading={isAssigning}>
              Confirm Role Assignment
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-4 text-left">
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--text-secondary)]">Target User:</div>
              <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                {selectedUser.username} ({selectedUser.email})
              </div>
              {selectedUser.employee_name && (
                <div className="text-xs text-[var(--brand-primary)] mt-1 font-medium">
                  Linked Employee: {selectedUser.employee_name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                SELECT NEW ROLE:
              </label>
              <div className="space-y-2">
                {availableRoles.map((roleOpt) => (
                  <label
                    key={roleOpt}
                    onClick={() => setSelectedRole(roleOpt)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedRole === roleOpt
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="assignRoleRadio"
                        checked={selectedRole === roleOpt}
                        onChange={() => setSelectedRole(roleOpt)}
                        className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">{roleOpt}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {roleOpt === 'Admin'
                            ? 'Full system access & user administration privileges'
                            : roleOpt === 'HR Manager'
                            ? 'Employee lifecycle, attendance, contracts, & leave management'
                            : roleOpt === 'HR Payroll Manager'
                            ? 'Full payroll processing, salary structures, & payrun lock authority'
                            : roleOpt === 'HR Payroll User'
                            ? 'Operational payroll view & payrun computation'
                            : 'Standard employee self-service portal access'}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        roleOpt === 'Admin'
                          ? 'purple'
                          : roleOpt.includes('Payroll')
                          ? 'orange'
                          : roleOpt.includes('HR')
                          ? 'blue'
                          : 'stone'
                      }
                      size="sm"
                    >
                      {roleOpt}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
