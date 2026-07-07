import { ArchiveHealthView } from '../components/governance/ArchiveHealthView';

/**
 * Archive health page wrapper that renders the ArchiveHealthView component
 * within the protected layout. Displays archive ingestion status, data quality
 * metrics, and unresolved exceptions.
 *
 * Implements:
 *   - SCRUM-260: Monitor Archive Completeness
 */
export function ArchiveHealthPage() {
  return <ArchiveHealthView />;
}

export default ArchiveHealthPage;