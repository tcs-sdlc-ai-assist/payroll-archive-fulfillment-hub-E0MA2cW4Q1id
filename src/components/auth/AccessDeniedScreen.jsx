import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRBAC } from '../../contexts/RBACContext';
import { useAudit } from '../../contexts/AuditContext';
import { ACTION_TYPES } from '../../utils/constants';

/**
 * Full-page access denied screen shown when an unauthorized user
 * attempts to access a protected view. Displays a lock icon,
 * 'Access Denied' message, user's current role, and a link to
 * return to login. Logs the denied access attempt via useAudit().
 *
 * Implements:
 *   - SCRUM-261: Simulated RBAC login and access denied
 *   - SCRUM-266: Audit log event for denied access
 */
export function AccessDeniedScreen() {
  const { currentUser, logout } = useRBAC();
  const { logEvent } = useAudit();
  const navigate = useNavigate();
  const hasLoggedRef = useRef(false);

  /**
   * Log the denied access attempt once when the component mounts.
   * Uses a ref to prevent duplicate logging on re-renders.
   */
  useEffect(() => {
    if (hasLoggedRef.current) {
      return;
    }

    hasLoggedRef.current = true;

    logEvent({
      userId: currentUser ? currentUser.userId : 'unknown',
      userName: currentUser ? currentUser.displayName : 'Unknown User',
      userRole: currentUser ? currentUser.role : 'Unauthorized',
      actionType: ACTION_TYPES.DENIED,
      documentId: null,
      employeeId: null,
      details: {
        documentType: null,
        employeeName: null,
        recipient: null,
        status: 'denied',
        reason: 'Unauthorized role — access denied',
      },
    });
  }, [currentUser, logEvent]);

  /**
   * Handles the "Return to Login" button click.
   * Logs the user out and navigates to the login page.
   */
  const handleReturnToLogin = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const userRole = currentUser ? currentUser.role : 'Unknown';
  const userName = currentUser ? currentUser.displayName : 'Unknown User';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kelly-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Lock Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-kelly-gray-900 mb-2">
          Access Denied
        </h1>

        {/* Message */}
        <p className="text-sm text-kelly-gray-600 mb-6">
          You do not have permission to access this application. Your current role does not include the required authorization.
        </p>

        {/* User Info Card */}
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                User
              </span>
              <span className="text-sm font-medium text-kelly-gray-900">
                {userName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                Role
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                {userRole}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                Denied
              </span>
            </div>
          </div>
        </div>

        {/* Audit Notice */}
        <p className="text-xs text-kelly-gray-500 flex items-center justify-center space-x-1 mb-6">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <span>This access attempt has been recorded in the audit log.</span>
        </p>

        {/* Return to Login Button */}
        <button
          type="button"
          onClick={handleReturnToLogin}
          className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-md text-white bg-kelly-green hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          Return to Login
        </button>

        {/* Help Text */}
        <p className="mt-6 text-xs text-kelly-gray-400">
          If you believe this is an error, please contact your supervisor or the system administrator.
        </p>
      </div>
    </div>
  );
}

export default AccessDeniedScreen;