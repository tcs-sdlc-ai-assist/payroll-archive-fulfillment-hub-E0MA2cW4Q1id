import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRBAC } from '../../contexts/RBACContext';

/**
 * Mock login screen allowing user to select a role/user from a dropdown
 * of available mock users (loaded from users.json via RBACContext).
 * On selection, sets the current user in RBACContext and navigates
 * to the dashboard. Styled with Kelly branding.
 *
 * Implements:
 *   - SCRUM-261: Simulated RBAC login and access denied
 */
export function LoginScreen() {
  const { users, login, isLoading, isAuthorized, currentUser } = useRBAC();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loginError, setLoginError] = useState(null);

  /**
   * Handles the change event on the user select dropdown.
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleUserChange = useCallback((e) => {
    setSelectedUserId(e.target.value);
    setLoginError(null);
  }, []);

  /**
   * Handles the login form submission.
   * Attempts to log in with the selected user ID and navigates
   * to the appropriate route based on authorization.
   * @param {React.FormEvent} e
   */
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!selectedUserId) {
        setLoginError('Please select a user to continue.');
        return;
      }

      const success = login(selectedUserId);

      if (!success) {
        setLoginError('Login failed. Please try again.');
        return;
      }

      const selectedUser = users.find((u) => u.userId === selectedUserId);

      if (selectedUser && selectedUser.role === 'Unauthorized') {
        navigate('/access-denied');
      } else if (
        selectedUser &&
        Array.isArray(selectedUser.permissions) &&
        selectedUser.permissions.length === 0
      ) {
        navigate('/access-denied');
      } else {
        navigate('/dashboard');
      }
    },
    [selectedUserId, login, users, navigate]
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kelly-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-kelly-green rounded-xl mb-4 shadow-md">
            <span className="text-white font-bold text-3xl leading-none">K</span>
          </div>
          <h1 className="text-2xl font-bold text-kelly-gray-900">
            Payroll Archive &amp; Fulfillment Hub
          </h1>
          <p className="mt-1 text-sm text-kelly-gray-500">
            Kelly Services
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-kelly-gray-900">
              Sign In
            </h2>
            <p className="mt-1 text-sm text-kelly-gray-500">
              Select a user profile to simulate role-based access.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* User Select */}
            <div className="mb-4">
              <label
                htmlFor="user-select"
                className="block text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1.5"
              >
                User Profile
              </label>
              {isLoading ? (
                <div className="flex items-center space-x-2 py-2">
                  <svg
                    className="animate-spin w-5 h-5 text-kelly-green"
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
                  <span className="text-sm text-kelly-gray-500">Loading users…</span>
                </div>
              ) : (
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={handleUserChange}
                  className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-2.5 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
                >
                  <option value="">— Select a user —</option>
                  {Array.isArray(users) &&
                    users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.displayName} — {user.role}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Selected User Info */}
            {selectedUserId && !isLoading && (
              <div className="mb-4 bg-kelly-gray-50 border border-kelly-gray-200 rounded-md p-3">
                {(() => {
                  const user = users.find((u) => u.userId === selectedUserId);
                  if (!user) return null;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                          Name
                        </span>
                        <span className="text-sm font-medium text-kelly-gray-900">
                          {user.displayName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                          Role
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            user.role === 'Unauthorized'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                          Email
                        </span>
                        <span className="text-sm text-kelly-gray-700">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                          Permissions
                        </span>
                        <span className="text-sm text-kelly-gray-700">
                          {Array.isArray(user.permissions) && user.permissions.length > 0
                            ? user.permissions.length
                            : 'None'}
                        </span>
                      </div>
                      {user.role === 'Unauthorized' && (
                        <div className="mt-1 flex items-center space-x-1 text-xs text-red-600">
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
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                          </svg>
                          <span>This user has no permissions and will be denied access.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Error Message */}
            {loginError && (
              <div className="mb-4 flex items-center space-x-2 text-sm text-red-600">
                <svg
                  className="w-4 h-4 flex-shrink-0"
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
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !selectedUserId}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-kelly-green hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              Sign In
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-kelly-gray-400">
          This is a simulated login for demonstration purposes. Select any user profile to explore role-based access controls.
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;