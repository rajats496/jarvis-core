/**
 * App - Router and basic layout. Frontend Part 1.
 */

import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';

const router = createBrowserRouter(
  [
    {
      element: (
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              <Outlet />
            </SettingsProvider>
          </AuthProvider>
        </ErrorBoundary>
      ),
      children: [
        { path: '/', element: <Landing /> },
        { path: '/login', element: <Login /> },
        { path: '/register', element: <Register /> },
        {
          path: '/dashboard',
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ),
        },
        { path: '/verify-email', element: <VerifyEmail /> },
        { path: '/reset-password', element: <ResetPassword /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasGoogle = googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

  const app = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <RouterProvider router={router} />
    </div>
  );

  return hasGoogle
    ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    : app;
}
