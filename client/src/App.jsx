import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminRoute, StudentRoute, PublicRoute } from './components/RouteGuards';
import { ThemeProvider } from 'styled-components';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Messages from './pages/Messages';

// Student pages
import Dashboard from './pages/Dashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// ✅ Define your theme
const theme = {
  colors: {
    primary: '#0f1b2d',
    secondary: '#c9a84c',
    text: '#f5f0e8',
  },
};

export default function App() {
  return (
    <ThemeProvider theme={theme}> {/* ✅ WRAPPED HERE */}
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Root */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

              {/* Student dashboard */}
              <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>}>
                <Route path="messages" element={<Messages />} />
              </Route>

              {/* Admin dashboard */}
              <Route
                path="/admin"
                element={<AdminRoute><AdminDashboard /></AdminRoute>}
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}