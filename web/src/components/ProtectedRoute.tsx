import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';

export default function ProtectedRoute({ role, children }: { role?: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'STAFF' ? '/admin/users' : '/app/profile'} replace />;
  }
  return <>{children}</>;
}
