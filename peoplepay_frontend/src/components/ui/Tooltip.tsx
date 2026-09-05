import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: '-top-8 left-1/2 -translate-x-1/2 mb-1',
    bottom: '-bottom-8 left-1/2 -translate-x-1/2 mt-1',
    left: '-left-2 top-1/2 -translate-y-1/2 -translate-x-full mr-1',
    right: '-right-2 top-1/2 -translate-y-1/2 translate-x-full ml-1',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 rounded shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150',
            positions[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
