import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Eagerly load critical above-the-fold pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Lazy-load route groups
const DoctorsPage = lazy(() => import('./pages/DoctorsPage').then(m => ({ default: m.DoctorsPage })));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const StaticPages = lazy(() => import('./pages/StaticPages'));

// Patient portal
const PatientDashboard = lazy(() => import('./pages/PatientDashboard').then(m => ({ default: m.PatientDashboard })));

// Doctor portal
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));

// Admin portal
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// 404
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]" aria-label="Loading page">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading…</p>
      </div>
    </div>
  );
}

/** Force the user to change their password before accessing anything else */
function MustChangePasswordGuard({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return children;
}

/** Require authentication; optionally restrict to specific roles */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard instead of a dead-end
    const dashboardPaths = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={dashboardPaths[user.role] || '/'} replace />;
  }

  return children;
}

/** Redirect already-authenticated users away from auth pages */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    const dashboardPaths = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={dashboardPaths[user.role] || '/'} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <MustChangePasswordGuard>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/privacy" element={<StaticPages page="privacy" />} />
          <Route path="/terms" element={<StaticPages page="terms" />} />

          {/* Auth — redirect if already logged in */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Password change — requires auth, no role restriction */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Patient Portal */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Doctor Portal */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy redirect shims (old paths from earlier implementation) */}
          <Route path="/patient-dashboard" element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="/doctor-dashboard" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </MustChangePasswordGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <ErrorBoundary>
                <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
                  <Navbar />
                  <main className="flex-1">
                    <AppRoutes />
                  </main>
                  <Footer />
                </div>
              </ErrorBoundary>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}
