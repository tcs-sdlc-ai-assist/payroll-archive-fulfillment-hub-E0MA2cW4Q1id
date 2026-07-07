import { AuditLogView } from '../components/audit/AuditLogView';

/**
 * Audit log page wrapper that renders the AuditLogView component
 * within the protected layout. Displays all simulated audit events
 * in a filterable, sortable table.
 *
 * Implements:
 *   - SCRUM-263: Audit logging of all sensitive actions
 *   - SCRUM-264: Governance/audit dashboards
 */
export function AuditPage() {
  return <AuditLogView />;
}

export default AuditPage;