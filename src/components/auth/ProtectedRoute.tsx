import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute]', { isLoading, isAuthenticated, role, path: location.pathname });

  // Show loading spinner while checking auth
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // In dev mode (no Supabase), allow all access
  if (!isSupabaseConfigured) {
    console.log('[ProtectedRoute] Dev mode - allowing access');
    if (allowedRoles && !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated - redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.log('[ProtectedRoute] Role not allowed:', role, allowedRoles);
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] Rendering children');
  return <>{children}</>;
};
