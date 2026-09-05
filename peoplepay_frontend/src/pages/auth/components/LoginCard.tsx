import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Logo } from '../../../components/ui/Logo';
import { LoginForm } from './LoginForm';
import { cn } from '../../../lib/utils';

export interface LoginCardProps {
  onLogin: (emailOrUsername: string, pass: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
  className?: string;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onLogin,
  isLoading,
  error,
  className,
}) => {
  const { themeMode, customBg } = useTheme();

  const cardContainerClass =
    themeMode === 'custom' && customBg === 'void'
      ? 'bg-[#0A0A0A] border border-[#262626] shadow-none text-white'
      : themeMode === 'custom' && customBg === 'cinematic'
      ? 'bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl text-white'
      : themeMode === 'dark'
      ? 'bg-[#171417] border border-white/10 shadow-2xl text-white'
      : 'bg-white border border-stone-200 shadow-xl text-stone-900';

  const headingClass =
    themeMode === 'custom' && customBg === 'cinematic'
      ? 'text-white'
      : themeMode === 'dark' || (themeMode === 'custom' && customBg === 'void')
      ? 'text-white'
      : 'text-stone-900';

  const subtitleClass =
    themeMode === 'custom' && customBg === 'cinematic'
      ? 'text-stone-300'
      : themeMode === 'dark' || (themeMode === 'custom' && customBg === 'void')
      ? 'text-stone-400'
      : 'text-stone-600';

  const footerTextClass =
    themeMode === 'custom' && customBg === 'cinematic'
      ? 'text-stone-400'
      : themeMode === 'dark' || (themeMode === 'custom' && customBg === 'void')
      ? 'text-stone-500'
      : 'text-stone-500';

  return (
    <div className={cn('w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6 transition-all', cardContainerClass, className)}>
      {/* Brand & Heading Header */}
      <div className="space-y-4 text-left">
        <Logo
          variant="full"
          size="lg"
          theme={themeMode === 'dark' || themeMode === 'custom' ? 'dark' : 'light'}
        />
        <div>
          <h1 className={cn('text-2xl sm:text-3xl font-extrabold tracking-tight', headingClass)}>
            Welcome back
          </h1>
          <p className={cn('text-xs sm:text-sm mt-1 font-medium', subtitleClass)}>
            Sign in to continue to PeoplePay360
          </p>
        </div>
      </div>

      {/* Form Component */}
      <LoginForm onSubmit={onLogin} isLoading={isLoading} error={error} />

      {/* Footer Secondary Text */}
      <div className="pt-2 border-t border-white/10 text-center">
        <p className={cn('text-xs', footerTextClass)}>
          Don't have an account? <span className="font-semibold underline cursor-pointer hover:text-[var(--brand-primary)]">Contact your administrator</span>.
        </p>
      </div>
    </div>
  );
};
