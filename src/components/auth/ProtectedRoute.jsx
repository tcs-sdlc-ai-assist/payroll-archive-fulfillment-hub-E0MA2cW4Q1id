import { useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useRBAC } from '../../contexts/RBACContext';
import { AccessDeniedScreen } from './AccessDeniedScreen';

/**
 * Route guard component that checks if the current user is authenticated
 * and has the required permissions. Renders children if authorized,
 * otherwise redirects to login or renders AccessDeniedScreen.
 *
 * Implements:
 *   - SCRUM-261: Simulated RBAC login and access denied
 *   - SCRUM-265: Permission-aware UI flows
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected content to render if authorized
 * @param {string} [props.requiredPermission] - Optional permission string required to access the route
 */
export function ProtectedRoute({ children, requiredPermission }) {
  const { currentUser, isAuthorized, isLoading, hasPermission } = useRBAC();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-kelly-gray-50 px-4">
        <svg
          className="animate-spin w-8 h-8 text-kelly-green"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-3 text-sm text-kelly-gray-500 font-medium">
          Loading…
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <AccessDeniedScreen />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedScreen />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredPermission: PropTypes.string,
};

ProtectedRoute.defaultProps = {
  requiredPermission: undefined,
};

export default ProtectedRoute;