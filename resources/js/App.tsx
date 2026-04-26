import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load pages
const Landing = React.lazy(() => import('@/pages/Landing'));
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const AppLayout = React.lazy(() => import('@/layouts/AppLayout'));
const LearningHub = React.lazy(() => import('@/pages/LearningHub'));
const ModuleDetail = React.lazy(() => import('@/pages/ModuleDetail'));
const MyProgress = React.lazy(() => import('@/pages/MyProgress'));
const Bookmarks = React.lazy(() => import('@/pages/Bookmarks'));
const CertificatePage = React.lazy(() => import('@/pages/Certificate'));
const ContentManager = React.lazy(() => import('@/pages/ContentManager'));
const ContentManagerEdit = React.lazy(() => import('@/pages/ContentManagerEdit'));
const Users = React.lazy(() => import('@/pages/Users'));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const KeyTakeaways = React.lazy(() => import('@/pages/KeyTakeaways'));
const FeedbackAnalytics = React.lazy(() => import('@/pages/FeedbackAnalytics'));
const PendingApproval = React.lazy(() => import('@/pages/PendingApproval'));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));
const PendingApprovals = React.lazy(() => import('@/pages/PendingApprovals'));
const Profile = React.lazy(() => import('@/pages/Profile'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const PrivateRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, token, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (!token || !user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/learning-hub" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, token, loading } = useAuth();
  const spinner = <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (loading) return spinner;

  return (
    <React.Suspense fallback={spinner}>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={token && user ? <Navigate to="/learning-hub" /> : <Landing />} />
        <Route path="/login" element={token && user ? <Navigate to="/learning-hub" /> : <Login />} />
        <Route path="/register" element={token && user ? <Navigate to="/learning-hub" /> : <Register />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected layout — PrivateRoute guards all children, redirects to /login if unauthenticated */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/learning-hub" element={<LearningHub />} />
          <Route path="/learning-hub/:slug" element={<ModuleDetail />} />
          <Route path="/my-progress" element={<MyProgress />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/takeaways" element={<KeyTakeaways />} />
          <Route path="/certificate" element={<CertificatePage />} />
          <Route path="/content-manager" element={<PrivateRoute roles={['ADMIN', 'TRAINER']}><ContentManager /></PrivateRoute>} />
          <Route path="/content-manager/:id" element={<PrivateRoute roles={['ADMIN', 'TRAINER']}><ContentManagerEdit /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute roles={['ADMIN']}><Users /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/pending-approvals" element={<PrivateRoute roles={['ADMIN']}><PendingApprovals /></PrivateRoute>} />
          <Route path="/feedback-analytics" element={<PrivateRoute roles={['ADMIN', 'TRAINER']}><FeedbackAnalytics /></PrivateRoute>} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider><AppRoutes /></AuthProvider>
    </ErrorBoundary>
  );
}
