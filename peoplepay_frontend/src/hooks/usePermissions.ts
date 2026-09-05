import { useAuth } from './useAuth';
import { hasPermission, canAccessModule, canPerformAction } from '../utils/permissions';
import { Permission } from '../types/auth';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    role,
    can: (permission: Permission) => hasPermission(role, permission),
    canAccessModule: (modulePath: string) => canAccessModule(role, modulePath),
    canPerformAction: (actionPermission: Permission) => canPerformAction(role, actionPermission),
  };
}
