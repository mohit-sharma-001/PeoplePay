import React from 'react';
import { Badge, BadgeProps } from '../ui/Badge';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeConfig = (statusStr: string): { variant: BadgeProps['variant']; label: string } => {
    const s = statusStr.toLowerCase();

    // Success / Running / Approved / Active / Paid
    if (['active', 'running', 'approved', 'paid', 'done', 'present'].includes(s)) {
      return { variant: 'emerald', label: statusStr };
    }

    // Warning / Pending / To Approve / In Progress / Late / Half Day
    if (['pending', 'to approve', 'in progress', 'late', 'half day', 'probation'].includes(s)) {
      return { variant: 'orange', label: statusStr };
    }

    // Danger / Refused / Terminated / Expired / Cancelled / Absent
    if (['refused', 'terminated', 'expired', 'cancelled', 'absent', 'rejected'].includes(s)) {
      return { variant: 'rose', label: statusStr };
    }

    // Special / Overtime / Premium Structure
    if (['overtime', 'executive'].includes(s)) {
      return { variant: 'purple', label: statusStr };
    }

    // Neutral / Draft
    return { variant: 'stone', label: statusStr };
  };

  const { variant, label } = getBadgeConfig(status);

  return (
    <Badge variant={variant} size={size}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </Badge>
  );
};
