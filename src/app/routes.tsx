import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { RegionsPage } from './pages/RegionsPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { PostsPage } from './pages/PostsPage';
import { BlogsPage } from './pages/BlogsPage';
import { ChurchesPage } from './pages/ChurchesPage';
import { GalleryPage } from './pages/GalleryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
{
    path: '/accept-invite',
    element: <AcceptInvitePage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'regions',
        element: (
          <ProtectedRoute requireSuperAdmin>
            <RegionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'invitations',
        element: (
          <ProtectedRoute requireSuperAdmin>
            <InvitationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'posts',
        element: <PostsPage />,
      },
      {
        path: 'blogs',
        element: (
          <ProtectedRoute requireSuperAdmin>
            <BlogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'churches',
        element: (
          <ProtectedRoute requireSuperAdmin>
            <ChurchesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'gallery',
        element: <GalleryPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);