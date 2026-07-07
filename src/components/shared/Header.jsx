import { useRBAC } from '../../contexts/RBACContext';

/**
 * Application header component with Kelly Services branding,
 * app title, current user display with role badge, and logout button.
 * Uses Kelly green (#00AE42) background with responsive layout.
 */
export function Header() {
  const { currentUser, logout } = useRBAC();

  return (
    <header className="bg-kelly-green text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-white rounded-md">
              <span className="text-kelly-green font-bold text-lg leading-none">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-semibold leading-tight tracking-wide">
                Payroll Archive &amp; Fulfillment Hub
              </span>
              <span className="hidden sm:block text-xs text-white/70 leading-tight">
                Kelly Services
              </span>
            </div>
          </div>

          {/* User Info & Logout */}
          {currentUser && (
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium leading-tight">
                    {currentUser.displayName}
                  </span>
                  <span className="text-xs text-white/70 leading-tight">
                    {currentUser.email}
                  </span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/20 text-white border border-white/30">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={logout}
                type="button"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-kelly-dark text-white hover:bg-kelly-dark/80 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                Logout
              </button>
            </div>
          )}

          {!currentUser && (
            <div className="text-sm text-white/70">
              Not logged in
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;