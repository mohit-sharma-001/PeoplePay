import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  actionsHeader?: string;
  rowClassName?: (item: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current filter criteria.',
  onRowClick,
  actions,
  actionsHeader = 'Actions',
  rowClassName,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const comparison = valA < valB ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  if (isLoading) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs">
        <LoadingSkeleton count={5} height="h-12" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full bg-white border border-stone-200 rounded-xl shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider select-none">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3.5',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer hover:bg-stone-100 transition-colors'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-stone-400">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#714B67]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#714B67]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3.5 text-right font-semibold text-stone-600 uppercase tracking-wider">{actionsHeader}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {sortedData.map((item) => {
              const id = keyExtractor(item);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={cn(
                    'transition-colors hover:bg-stone-50/90',
                    onRowClick && 'cursor-pointer',
                    rowClassName && rowClassName(item)
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 align-middle',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.accessor ? col.accessor(item) : item[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className="px-4 py-3.5 align-middle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(item)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
        <span>Showing {sortedData.length} records</span>
        <span className="text-stone-400 font-mono">PEOPLEPAY360 Core Engine</span>
      </div>
    </div>
  );
}
