import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children?: ReactNode;
  requiredPermission?: string;
}

export default function PrivateRoute({ children, requiredPermission }: PrivateRouteProps) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredPermission) {
    const userPermissions = currentUser.permissions || [];
    if (!userPermissions.includes(requiredPermission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children || <Outlet />;
}