import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'U';
  };

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center font-semibold bg-slate-200 text-slate-700 shrink-0 border border-slate-300/50 select-none',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to text initials on image error
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : null}
      <span className={src ? 'hidden' : 'block'}>{getInitials(name)}</span>
    </div>
  );
};
