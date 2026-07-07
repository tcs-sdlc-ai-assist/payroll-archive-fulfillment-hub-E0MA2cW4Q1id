import { RouterProvider } from 'react-router-dom';
import { RBACProvider } from './contexts/RBACContext';
import { AuditProvider } from './contexts/AuditContext';
import { AssistantProvider } from './contexts/AssistantContext';
import { AssistantPanel } from './components/assistant/AssistantPanel';
import router from './router';

/**
 * Root application component.
 * Wraps the RouterProvider with RBACProvider, AuditProvider, and
 * AssistantProvider contexts. Renders the AssistantPanel globally
 * (visible on all authenticated pages).
 *
 * Context hierarchy (outermost → innermost):
 *   RBACProvider → AuditProvider → AssistantProvider → RouterProvider + AssistantPanel
 *
 * The AssistantPanel includes its own toggle button (FAB) in the
 * bottom-right corner, so a separate AssistantToggle is not needed here.
 */
export default function App() {
  return (
    <RBACProvider>
      <AuditProvider>
        <AssistantProvider>
          <RouterProvider router={router} />
          <AssistantPanel />
        </AssistantProvider>
      </AuditProvider>
    </RBACProvider>
  );
}