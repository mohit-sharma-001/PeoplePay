import React from 'react';
import { Menu, Search, Shield, LogOut, User as UserIcon, Palette, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { AttendanceWidget } from './AttendanceWidget';

export interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { themeMode, openSettings } = useTheme();

  const getThemeIcon = () => {
    if (themeMode === 'dark') return <Moon className="w-4 h-4 text-purple-400" />;
    if (themeMode === 'custom') return <Sparkles className="w-4 h-4 text-[#F59E0B]" />;
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  const displayRoles = Array.isArray(user?.roles) && user.roles.length > 0
    ? user.roles.join(', ')
    : (user?.role || 'Employee');

  return (
    <header className="h-16 bg-[var(--header-bg)] border-b border-[var(--border-color)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      {/* Left: Mobile menu toggle & Global Search */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden md:flex items-center w-64 lg:w-80">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, payslips, contracts (Cmd + K)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:bg-[var(--bg-surface)] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
          />
        </div>
      </div>

      {/* Right: Appearance Button, Role Badge, User Profile */}
      <div className="flex items-center gap-3">
        {/* Global Appearance / Theme Trigger Button */}
        <button
          type="button"
          onClick={openSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
          title="Change Theme & Appearance"
        >
          {getThemeIcon()}
          <span className="hidden sm:inline capitalize">{themeMode}</span>
        </button>

        {/* Real User Role Badge (Role Switcher Removed) */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[var(--brand-primary-light)] px-2.5 py-1.5 rounded-lg border border-[var(--brand-primary-border)] text-xs">
          <Shield className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
          <span className="text-[var(--text-secondary)] font-medium">Role:</span>
          <span className="font-bold text-[var(--brand-primary)] truncate max-w-[140px]" title={displayRoles}>
            {displayRoles}
          </span>
        </div>

        {/* Live Attendance Check-In / Check-Out Widget */}
        <AttendanceWidget />

        <div className="h-5 w-px bg-[var(--border-color)] mx-1" />


        {/* User Profile Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2.5 cursor-pointer p-1 rounded-lg hover:bg-[var(--bg-surface-elevated)] transition-colors">
              <Avatar src={user?.avatarUrl} name={user?.name || user?.username || 'User'} size="sm" />
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-[var(--text-primary)]">{user?.name || user?.username}</span>
                <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">{displayRoles}</span>
              </div>
            </div>
          }
          items={[
            {
              id: 'profile',
              label: user?.email || user?.username || '',
              icon: <UserIcon className="w-4 h-4" />,
              disabled: true,
            },
            'separator',
            {
              id: 'appearance',
              label: 'Appearance & Theme',
              icon: <Palette className="w-4 h-4 text-[var(--brand-primary)]" />,
              onClick: openSettings,
            },
            {
              id: 'role-info',
              label: `Role: ${displayRoles}`,
              icon: <Shield className="w-4 h-4 text-[var(--brand-primary)]" />,
              disabled: true,
            },
            'separator',
            {
              id: 'logout',
              label: 'Sign Out',
              icon: <LogOut className="w-4 h-4" />,
              danger: true,
              onClick: logout,
            },
          ]}
        />
      </div>
    </header>
  );
};
