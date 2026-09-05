import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface LoginFormProps {
  onSubmit: (emailOrUsername: string, pass: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  error,
  className,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('admin@peoplepay360.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);
    const errors: { email?: string; password?: string } = {};

    if (!emailOrUsername.trim()) {
      errors.email = 'Please enter your email or username.';
    }
    if (!password.trim()) {
      errors.password = 'Please enter your password.';
    }

    setFieldError(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    onSubmit(emailOrUsername, password);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoMessage('Password recovery is managed by your system administrator.');
  };

  return (
    <div className={cn('w-full max-w-[460px] mx-auto p-6 sm:p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-[#175A67]/20 shadow-2xl shadow-[#175A67]/10 transition-all', className)}>
      <form onSubmit={handleSubmit} className="space-y-4 text-left w-full" noValidate>
        {/* Top Error Alert Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Message Banner */}
        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-[#175A67]/10 border border-[#175A67]/30 text-xs text-[#175A67] font-medium flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#175A67]" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Email / Username Field */}
        <div className="space-y-1.5">
          <label htmlFor="emailOrUsername" className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
            EMAIL OR USERNAME
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 absolute left-4 text-[#175A67]/60 pointer-events-none" />
            <input
              id="emailOrUsername"
              type="text"
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                if (fieldError.email) setFieldError((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="Enter your email or username"
              className={cn(
                'w-full pl-11 pr-4 h-[54px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] transition-all outline-none',
                fieldError.email && 'border-rose-500 focus:border-rose-500'
              )}
              autoComplete="username"
            />
          </div>
          {fieldError.email && <p className="text-xs text-rose-600 font-medium mt-1">{fieldError.email}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#175A67]">
              PASSWORD
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-semibold text-[#175A67] hover:underline focus:outline-none cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 absolute left-4 text-[#175A67]/60 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldError.password) setFieldError((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              className={cn(
                'w-full pl-11 pr-12 h-[54px] text-sm rounded-xl border bg-white/90 border-[#175A67]/25 text-[#175A67] placeholder:text-[#175A67]/45 focus:border-[#175A67] focus:ring-1 focus:ring-[#175A67] transition-all outline-none',
                fieldError.password && 'border-rose-500 focus:border-rose-500'
              )}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-[#175A67]/60 hover:text-[#175A67] focus:outline-none cursor-pointer p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldError.password && <p className="text-xs text-rose-600 font-medium mt-1">{fieldError.password}</p>}
        </div>

        {/* Primary Log In Pill Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full h-[54px] px-6 mt-4 rounded-full font-bold text-sm tracking-wider uppercase text-white bg-[#714B67] hover:bg-[#5B3D54] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#714B67]/25 cursor-pointer select-none',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>LOG IN</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Secondary Text Link to Register */}
        <div className="pt-3 text-center border-t border-[#175A67]/10">
          <p className="text-xs text-[#2A707C]">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#175A67] underline hover:text-[#714B67]">
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
