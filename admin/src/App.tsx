import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import LoginPage from './app/onboarding/LoginPage';
import AdminUsersPage from './app/users/AdminUsersPage';
import AdminUserDetailPage from './app/users/AdminUserDetailPage';
import AdminOpportunitiesPage from './app/content/AdminOpportunitiesPage';
import AdminAnalyticsPage from './app/analytics/AdminAnalyticsPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/users' : '/login'} replace />} />
      <Route path="/login" element={user ? <Navigate to="/users" replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/users" element={<AdminUsersPage />} />
        <Route path="/users/:id" element={<AdminUserDetailPage />} />
        <Route path="/opportunities" element={<AdminOpportunitiesPage />} />
        <Route path="/analytics" element={<AdminAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
