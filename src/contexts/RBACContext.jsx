import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { loadUsers } from '../utils/fixtureLoader';
import { ROLE_PERMISSIONS, ROLES } from '../utils/constants';

const LOCAL_STORAGE_KEY = 'payroll_archive_hub_user';

/**
 * @typedef {Object} RBACContextValue
 * @property {Object|null} currentUser - The currently logged-in user object
 * @property {boolean} isAuthorized - Whether the current user has a valid authorized role
 * @property {boolean} isLoading - Whether user data is still loading
 * @property {Function} login - Function to log in as a specific user by userId
 * @property {Function} logout - Function to log out the current user
 * @property {Function} hasPermission - Function to check if current user has a specific permission
 */

const RBACContext = createContext(null);

/**
 * RBAC Context Provider — manages mock authentication and authorization.
 * Loads users from users.json, manages current user state,
 * and persists selected user in localStorage.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function RBACProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const data = await loadUsers();
        if (!cancelled) {
          setUsers(data);

          const storedUserId = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (storedUserId) {
            const found = data.find((u) => u.userId === storedUserId);
            if (found) {
              setCurrentUser(found);
            }
          }

          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load users');
          setIsLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Log in as a specific user by userId.
   * @param {string} userId - The userId to log in as
   * @returns {boolean} True if login was successful, false otherwise
   */
  const login = useCallback(
    (userId) => {
      if (!userId || typeof userId !== 'string') {
        return false;
      }

      const user = users.find((u) => u.userId === userId);
      if (!user) {
        return false;
      }

      setCurrentUser(user);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, userId);
      } catch {
        // localStorage may be unavailable in some environments
      }

      return true;
    },
    [users]
  );

  /**
   * Log out the current user.
   */
  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, []);

  /**
   * Check if the current user has a specific permission.
   * @param {string} action - The permission/action to check (e.g., 'search', 'preview', 'download')
   * @returns {boolean} True if the current user has the permission
   */
  const hasPermission = useCallback(
    (action) => {
      if (!currentUser) {
        return false;
      }

      if (!action || typeof action !== 'string') {
        return false;
      }

      if (Array.isArray(currentUser.permissions)) {
        return currentUser.permissions.includes(action);
      }

      const rolePerms = ROLE_PERMISSIONS[currentUser.role];
      if (Array.isArray(rolePerms)) {
        return rolePerms.includes(action);
      }

      return false;
    },
    [currentUser]
  );

  /**
   * Whether the current user has a valid authorized role (not Unauthorized).
   */
  const isAuthorized = useMemo(() => {
    if (!currentUser) {
      return false;
    }

    if (currentUser.role === ROLES.UNAUTHORIZED) {
      return false;
    }

    const permissions = currentUser.permissions;
    if (Array.isArray(permissions) && permissions.length === 0) {
      return false;
    }

    return true;
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      isAuthorized,
      isLoading,
      error,
      login,
      logout,
      hasPermission,
    }),
    [currentUser, users, isAuthorized, isLoading, error, login, logout, hasPermission]
  );

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

RBACProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the RBAC context.
 * Must be used within an RBACProvider.
 * @returns {RBACContextValue} The RBAC context value
 */
export function useRBAC() {
  const context = useContext(RBACContext);

  if (context === null) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }

  return context;
}

export default RBACContext;