import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const dateId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={dateId} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={dateId}
          type="date"
          className={cn(
            'w-full px-3.5 py-2 pr-10 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 transition-colors shadow-xs',
            'focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
      </div>
      {error ? (
        <span className="text-xs text-rose-600 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
};
