import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';

// Lazy load pages
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const PendingApproval = React.lazy(() => import('@/pages/PendingApproval'));
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
const PendingApprovals = React.lazy(() => import('@/pages/PendingApprovals'));
const KeyTakeaways = React.lazy(() => import('@/pages/KeyTakeaways'));
const FeedbackAnalytics = React.lazy(() => import('@/pages/FeedbackAnalytics'));

const PrivateRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, token, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (!token || !user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/learning-hub" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, token } = useAuth();
  return (
    <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
      <Routes>
        <Route path="/login" element={token && user ? <Navigate to="/learning-hub" /> : <Login />} />
        <Route path="/register" element={token && user ? <Navigate to="/learning-hub" /> : <Register />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/learning-hub" />} />
          <Route path="learning-hub" element={<LearningHub />} />
          <Route path="learning-hub/:slug" element={<ModuleDetail />} />
          <Route path="my-progress" element={<MyProgress />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="takeaways" element={<KeyTakeaways />} />
          <Route path="certificate" element={<CertificatePage />} />
          <Route path="content-manager" element={<PrivateRoute roles={['ADMIN', 'TRAINER']}><ContentManager /></PrivateRoute>} />
          <Route path="content-manager/:id" element={<PrivateRoute roles={['ADMIN', 'TRAINER']}><ContentManagerEdit /></PrivateRoute>} />
          <Route path="users" element={<PrivateRoute roles={['ADMIN']}><Users /></PrivateRoute>} />
          <Route path="pending-approvals" element={<PrivateRoute roles={['ADMIN']}><PendingApprovals /></PrivateRoute>} />
          <Route path="admin" element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
          <Route path="feedback-analytics" element={<PrivateRoute roles={['ADMIN', 'TRAINER']}><FeedbackAnalytics /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/learning-hub" />} />
      </Routes>
    </React.Suspense>
  );
};

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
