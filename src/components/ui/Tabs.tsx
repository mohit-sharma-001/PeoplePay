import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1',
        variant === 'underline' && 'border-b border-stone-200'
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none',
                isActive
                  ? 'bg-[#714B67] text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px]',
                    isActive ? 'bg-[#5B3D54] text-white' : 'bg-stone-200 text-stone-700'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        // Default: underline
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors cursor-pointer select-none',
              isActive
                ? 'border-[#714B67] text-[#714B67]'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  isActive ? 'bg-[#F3EDF2] text-[#714B67]' : 'bg-stone-100 text-stone-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
