import { EmployeeSearch } from '../components/search/EmployeeSearch';

/**
 * Search page wrapper that renders the EmployeeSearch component
 * within the protected layout. Passes route context and handles
 * navigation to Employee360 on result selection.
 *
 * Implements:
 *   - SCRUM-255: Search Employee
 */
export function SearchPage() {
  return <EmployeeSearch />;
}

export default SearchPage;