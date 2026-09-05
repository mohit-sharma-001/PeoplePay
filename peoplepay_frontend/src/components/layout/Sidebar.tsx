import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Clock,
  Banknote,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Sliders,
  Layers,
  Award,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../ui/Logo';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: { label: string; path: string; icon?: React.ReactNode }[];
}

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const { themeMode } = useTheme();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    payroll: location.pathname.startsWith('/payroll'),
    timeoff: location.pathname.startsWith('/time-off'),
    employees: location.pathname.startsWith('/employees') || location.pathname.startsWith('/schedules'),
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { canAccessModule } = usePermissions();
  const userRole = user?.role || (user?.roles && user.roles[0]);

  const rawNavItems: NavItem[] = [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: <Users className="w-4 h-4" />,
      children: [
        { label: 'All Employees', path: '/employees', icon: <Users className="w-3.5 h-3.5" /> },
        { label: 'Contracts', path: '/contracts', icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Working Schedules', path: '/schedules', icon: <Calendar className="w-3.5 h-3.5" /> },
      ],
    },
    {
      label: 'Contracts',
      path: '/contracts',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: 'Time Off',
      path: '/time-off',
      icon: <Calendar className="w-4 h-4" />,
      children: [
        { label: 'Dashboard', path: '/time-off', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { label: 'Requests', path: '/time-off/requests', icon: <Clock className="w-3.5 h-3.5" /> },
        { label: 'Allocations', path: '/time-off/allocations', icon: <Layers className="w-3.5 h-3.5" /> },
        { label: 'Types', path: '/time-off/types', icon: <Sliders className="w-3.5 h-3.5" /> },
      ],
    },
    {
      label: 'Payroll',
      path: '/payroll',
      icon: <Banknote className="w-4 h-4" />,
      children: [
        { label: 'Dashboard', path: '/payroll', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { label: 'Payruns', path: '/payroll/payruns', icon: <Banknote className="w-3.5 h-3.5" /> },
        { label: 'Payslips', path: '/payroll/payslips', icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Salary Structures', path: '/payroll/structures', icon: <Layers className="w-3.5 h-3.5" /> },
        { label: 'Salary Rules', path: '/payroll/rules', icon: <Award className="w-3.5 h-3.5" /> },
      ],
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    ...(userRole === 'Admin'
      ? [
          {
            label: 'Manage Users',
            path: '/admin/users',
            icon: <ShieldCheck className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  const navItems = rawNavItems.filter((item) => {
    if (item.path === '/admin/users') return userRole === 'Admin';
    return canAccessModule(item.path);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-2xs"
        />
      )}

      {/* Clean Enterprise Sidebar Panel (Uses Theme Variables) */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-[var(--bg-sidebar)] text-[var(--text-primary)] border-r border-[var(--border-color)] flex flex-col transition-all duration-300 ease-in-out shadow-2xs',
          collapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
          <NavLink to="/dashboard" onClick={onCloseMobile} className="flex items-center overflow-hidden">
            <Logo variant={collapsed ? 'icon' : 'full'} size="md" theme={themeMode === 'light' ? 'light' : 'dark'} />
          </NavLink>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const key = item.label.toLowerCase().replace(/\s+/g, '');
            const isSubmenuOpen = openSubmenus[key];
            const isActive =
              location.pathname === item.path ||
              (hasChildren && item.children?.some((c) => location.pathname === c.path));

            if (hasChildren && !collapsed) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(key)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer',
                      isActive
                        ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {isSubmenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {isSubmenuOpen && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-[var(--border-color)] ml-4 my-1">
                      {item.children?.map((sub) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={onCloseMobile}
                            className={cn(
                              'px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors',
                              isSubActive
                                ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-2xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                            )}
                          >
                            {sub.icon}
                            <span>{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors',
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={cn('shrink-0', isActive ? 'text-white' : 'text-[var(--text-muted)]')}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Role Indicator */}
        {!collapsed && (
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface-elevated)] text-xs">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium">
              <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
              <div className="truncate">
                <span className="text-[var(--text-primary)] block font-semibold truncate">{user?.role || 'Admin'}</span>
                <span className="text-[10px] text-[var(--text-muted)] block truncate">PeoplePay360 Engine v1.0</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
