import { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useRBAC } from '../../contexts/RBACContext';
import { PERMISSIONS } from '../../utils/constants';

/**
 * Navigation sidebar with role-based menu items.
 * Highlights the active route. Collapsible on mobile via hamburger toggle.
 * Shows/hides menu items based on user role permissions via useRBAC().
 */
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { currentUser, hasPermission } = useRBAC();
  const location = useLocation();

  /**
   * Toggles the sidebar collapsed state on mobile.
   */
  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  /**
   * Closes the sidebar on mobile after a link is clicked.
   */
  const closeSidebar = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  /**
   * Navigation items configuration.
   * Each item has a label, path, icon (SVG path), and required permission.
   * @type {Array<{label: string, path: string, icon: string, permission: string}>}
   */
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      permission: PERMISSIONS.DASHBOARD,
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
    },
    {
      label: 'Employee Search',
      path: '/search',
      permission: PERMISSIONS.SEARCH,
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    },
    {
      label: 'Audit Log',
      path: '/audit',
      permission: PERMISSIONS.AUDIT,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
    {
      label: 'Governance',
      path: '/governance',
      permission: PERMISSIONS.GOVERNANCE,
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      label: 'Archive Health',
      path: '/archive-health',
      permission: PERMISSIONS.DASHBOARD,
      icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01',
    },
  ];

  /**
   * Filters nav items based on user permissions.
   * @type {Array<{label: string, path: string, icon: string, permission: string}>}
   */
  const visibleNavItems = navItems.filter((item) => hasPermission(item.permission));

  if (!currentUser) {
    return null;
  }

  /**
   * Returns the className for a NavLink based on active state.
   * @param {boolean} isActive - Whether the link is currently active
   * @returns {string} The className string
   */
  function getLinkClassName(isActive) {
    const base = 'flex items-center space-x-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors';
    if (isActive) {
      return `${base} bg-kelly-green text-white`;
    }
    return `${base} text-kelly-gray-700 hover:bg-kelly-gray-100 hover:text-kelly-gray-900`;
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="lg:hidden fixed top-[4.5rem] left-4 z-40 inline-flex items-center justify-center w-10 h-10 rounded-md bg-white shadow-md border border-kelly-gray-200 text-kelly-gray-700 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
        aria-label={isCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
      >
        {isCollapsed ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-kelly-gray-200 shadow-sm flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Nav header */}
        <div className="px-4 py-4 border-b border-kelly-gray-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-kelly-gray-500">
            Navigation
          </h2>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Main navigation">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) => getLinkClassName(isActive)}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {visibleNavItems.length === 0 && (
            <div className="px-4 py-3 text-sm text-kelly-gray-500">
              No menu items available for your role.
            </div>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-3 border-t border-kelly-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-kelly-green/10 flex items-center justify-center">
              <span className="text-kelly-green text-sm font-semibold">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-kelly-gray-900 truncate">
                {currentUser.displayName}
              </span>
              <span className="text-xs text-kelly-gray-500 truncate">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;