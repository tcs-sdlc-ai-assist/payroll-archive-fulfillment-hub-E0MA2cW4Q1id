import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Main application layout component.
 * Wraps Header, Sidebar, and main content area (children via Outlet).
 * Provides consistent page structure with responsive grid layout.
 */
export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-kelly-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;