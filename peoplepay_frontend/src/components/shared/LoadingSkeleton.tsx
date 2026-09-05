import React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 3,
  height = 'h-10',
  className,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            'w-full bg-slate-200/70 animate-pulse rounded-lg',
            height,
            className
          )}
        />
      ))}
    </div>
  );
};
