import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/shared/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginScreen } from './components/auth/LoginScreen';
import { AccessDeniedScreen } from './components/auth/AccessDeniedScreen';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { Employee360Page } from './pages/Employee360Page';
import { PreviewPage } from './pages/PreviewPage';
import { AuditPage } from './pages/AuditPage';
import { GovernancePage } from './pages/GovernancePage';
import { ArchiveHealthPage } from './pages/ArchiveHealthPage';
import { PERMISSIONS } from './utils/constants';

/**
 * Application router configuration using React Router v6 createBrowserRouter.
 * Defines all application routes with protected route wrappers and
 * permission requirements based on RBAC roles.
 *
 * Route structure:
 *   /login          — Public login screen
 *   /access-denied  — Access denied screen for unauthorized users
 *   /               — Protected layout wrapper (Layout)
 *     /dashboard       — Main dashboard (requires 'dashboard' permission)
 *     /search          — Employee search (requires 'search' permission)
 *     /employee/:employeeId — Employee 360 view (requires 'search' permission)
 *     /document/:documentId — Document preview (requires 'preview' permission)
 *     /audit           — Audit log view (requires 'audit' permission)
 *     /governance      — Governance dashboard (requires 'governance' permission)
 *     /archive-health  — Archive health view (requires 'dashboard' permission)
 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginScreen />,
  },
  {
    path: '/access-denied',
    element: <AccessDeniedScreen />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'search',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.SEARCH}>
            <SearchPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'employee/:employeeId',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.SEARCH}>
            <Employee360Page />
          </ProtectedRoute>
        ),
      },
      {
        path: 'document/:documentId',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.PREVIEW}>
            <PreviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.AUDIT}>
            <AuditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'governance',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.GOVERNANCE}>
            <GovernancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'archive-health',
        element: (
          <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD}>
            <ArchiveHealthPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;