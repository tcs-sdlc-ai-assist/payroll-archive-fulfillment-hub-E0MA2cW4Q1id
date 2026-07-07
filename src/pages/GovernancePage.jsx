import { GovernanceDashboard } from '../components/governance/GovernanceDashboard';

/**
 * Governance page wrapper that renders the GovernanceDashboard component
 * within the protected layout. Displays compliance overview, audit event
 * summaries, and exception highlights. Accessible to Supervisor role only.
 *
 * Implements:
 *   - SCRUM-264: Governance/audit dashboards
 */
export function GovernancePage() {
  return <GovernanceDashboard />;
}

export default GovernancePage;