import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';

import LoginPage from './app/onboarding/LoginPage';
import ClaimPage from './app/onboarding/ClaimPage';
import CompleteProfilePage from './app/onboarding/CompleteProfilePage';

import ProfilePage from './app/profile/ProfilePage';
import VisibilityPage from './app/profile/VisibilityPage';

import DirectoryPage from './app/directory/DirectoryPage';
import ProfileDetailPage from './app/directory/ProfileDetailPage';

import MentorshipPage from './app/mentorship/MentorshipPage';
import OpportunitiesPage from './app/opportunities/OpportunitiesPage';

import MessagesPage from './app/messages/MessagesPage';
import ConversationPage from './app/messages/ConversationPage';

import AdminUsersPage from './admin/users/AdminUsersPage';
import AdminUserDetailPage from './admin/users/AdminUserDetailPage';
import AdminOpportunitiesPage from './admin/content/AdminOpportunitiesPage';
import AdminAnalyticsPage from './admin/analytics/AdminAnalyticsPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === 'STAFF' ? '/admin/users' : '/app/profile') : '/login'} replace />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'STAFF' ? '/admin/users' : '/app/profile'} replace /> : <LoginPage />} />
      <Route path="/claim" element={user ? <Navigate to="/app/profile" replace /> : <ClaimPage />} />
      <Route
        path="/onboarding/complete-profile"
        element={
          <ProtectedRoute role="ALUMNUS">
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute role="ALUMNUS">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/visibility" element={<VisibilityPage />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route path="directory/:profileId" element={<ProfileDetailPage />} />
        <Route path="mentorship" element={<MentorshipPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:profileId" element={<ConversationPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="STAFF">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="opportunities" element={<AdminOpportunitiesPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
