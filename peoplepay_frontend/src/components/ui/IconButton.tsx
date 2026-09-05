import React from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#714B67] hover:bg-[#5B3D54] text-white focus:ring-[#714B67] shadow-xs',
    secondary: 'bg-stone-800 hover:bg-stone-900 text-white focus:ring-stone-700',
    accent: 'bg-[#F59E0B] hover:bg-[#D97706] text-white focus:ring-[#F59E0B]',
    outline: 'border border-stone-300 hover:bg-stone-100 text-stone-700 focus:ring-stone-400 bg-white',
    ghost: 'text-stone-600 hover:bg-[#F3EDF2] hover:text-[#714B67] focus:ring-stone-400',
    danger: 'text-rose-600 hover:bg-rose-50 focus:ring-rose-500',
  };

  const sizes = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  return (
    <button
      aria-label={label}
      title={label}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
    </button>
  );
};
