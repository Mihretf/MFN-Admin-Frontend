import { Navigate } from 'react-router';
import { useAppSelector } from '../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && user?.role !== 'super') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}