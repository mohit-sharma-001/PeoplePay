import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { canAccessModule } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'Admin';

  if (!canAccessModule(location.pathname) || (location.pathname.startsWith('/admin') && !isAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
