import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../../hooks/useEmployees';
import { useRBAC } from '../../contexts/RBACContext';
import { useAudit } from '../../contexts/AuditContext';
import { DataTable } from '../shared/DataTable';
import { MaskedField } from '../shared/MaskedField';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { FilterBar } from '../shared/FilterBar';
import { ACTION_TYPES, DEPARTMENTS, LOCATIONS, EMPLOYEE_STATUS } from '../../utils/constants';

/**
 * Employee search page component with search input (KellyID, name, last 4 SSN),
 * filter controls, and results table. Uses useEmployees() hook for data and search logic.
 * Displays masked PII via MaskedField. Clicking a result navigates to Employee360 view.
 * Logs search actions via useAudit().
 *
 * Implements:
 *   - SCRUM-255: Search Employee
 */
export function EmployeeSearch() {
  const { employees, searchResults, searchEmployees, loading, error } = useEmployees();
  const { currentUser } = useRBAC();
  const { logEvent } = useAudit();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filterValues, setFilterValues] = useState({
    department: '',
    location: '',
    status: '',
  });

  /**
   * Handles the search input change.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  /**
   * Handles the search form submission.
   * @param {React.FormEvent} e
   */
  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const trimmed = searchQuery.trim();
      searchEmployees(trimmed);
      setHasSearched(true);

      if (currentUser) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: 'search',
          documentId: null,
          employeeId: null,
          details: {
            query: trimmed || '(all)',
            status: 'success',
          },
        });
      }
    },
    [searchQuery, searchEmployees, currentUser, logEvent]
  );

  /**
   * Handles clearing the search input and resetting results.
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setHasSearched(false);
    searchEmployees('');
    setFilterValues({
      department: '',
      location: '',
      status: '',
    });
  }, [searchEmployees]);

  /**
   * Handles filter value changes from the FilterBar.
   * @param {string} key - The filter field key
   * @param {string} value - The new filter value
   */
  const handleFilterChange = useCallback((key, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Handles resetting all filters.
   */
  const handleFilterReset = useCallback(() => {
    setFilterValues({
      department: '',
      location: '',
      status: '',
    });
  }, []);

  /**
   * Handles clicking a row in the results table.
   * Navigates to the employee detail / Employee360 view.
   * @param {Object} row - The employee row data
   */
  const handleRowClick = useCallback(
    (row) => {
      if (row && row.employeeId) {
        if (currentUser) {
          logEvent({
            userId: currentUser.userId,
            userName: currentUser.displayName,
            userRole: currentUser.role,
            actionType: ACTION_TYPES.PREVIEW,
            documentId: null,
            employeeId: row.employeeId,
            details: {
              employeeName: row.name,
              status: 'success',
              action: 'view_employee',
            },
          });
        }
        navigate(`/employee/${row.employeeId}`);
      }
    },
    [navigate, currentUser, logEvent]
  );

  /**
   * Filter fields configuration for the FilterBar.
   * @type {Array}
   */
  const filterFields = useMemo(
    () => [
      {
        key: 'department',
        label: 'Department',
        type: 'select',
        options: DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
        placeholder: 'All Departments',
      },
      {
        key: 'location',
        label: 'Location',
        type: 'select',
        options: LOCATIONS.map((loc) => ({ value: loc, label: loc })),
        placeholder: 'All Locations',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: EMPLOYEE_STATUS.ACTIVE, label: 'Active' },
          { value: EMPLOYEE_STATUS.TERMINATED, label: 'Terminated' },
          { value: EMPLOYEE_STATUS.ON_LEAVE, label: 'On Leave' },
        ],
        placeholder: 'All Statuses',
      },
    ],
    []
  );

  /**
   * Applies local filters (department, location, status) on top of search results.
   * @type {Object[]}
   */
  const filteredResults = useMemo(() => {
    let results = searchResults;

    if (filterValues.department) {
      results = results.filter(
        (emp) => emp.department === filterValues.department
      );
    }

    if (filterValues.location) {
      results = results.filter(
        (emp) => emp.location === filterValues.location
      );
    }

    if (filterValues.status) {
      results = results.filter(
        (emp) => emp.status === filterValues.status
      );
    }

    return results;
  }, [searchResults, filterValues]);

  /**
   * Table column configuration for the DataTable.
   * @type {Array}
   */
  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Employee Name',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-kelly-gray-900">{value || '—'}</span>
        ),
      },
      {
        key: 'kellyId',
        label: 'Kelly ID',
        sortable: true,
        render: (value) => (
          <span className="font-mono text-sm text-kelly-gray-700">{value || '—'}</span>
        ),
      },
      {
        key: 'maskedTaxId',
        label: 'Tax ID',
        sortable: false,
        render: (value) => (
          <MaskedField value={value} fieldType="maskedTaxId" allowReveal={true} />
        ),
      },
      {
        key: 'email',
        label: 'Email',
        sortable: false,
        render: (value) => (
          <MaskedField value={value} fieldType="email" allowReveal={true} />
        ),
      },
      {
        key: 'department',
        label: 'Department',
        sortable: true,
      },
      {
        key: 'location',
        label: 'Location',
        sortable: true,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value || 'Unknown'} dot />,
      },
    ],
    []
  );

  if (loading) {
    return <LoadingSpinner message="Loading employee data…" size="lg" />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Error Loading Employees"
        message={`An error occurred while loading employee data: ${error}`}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-kelly-gray-900">Employee Search</h1>
        <p className="mt-1 text-sm text-kelly-gray-500">
          Search for employees by name, Kelly ID, or last 4 SSN digits. Click a result to view their documents.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-4">
        <form onSubmit={handleSearchSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="employee-search-input"
              className="block text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1.5"
            >
              Search Employees
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-kelly-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="employee-search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Enter name, Kelly ID (e.g., K100234), or last 4 SSN…"
                className="block w-full rounded-md border border-kelly-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm text-kelly-gray-700 shadow-sm placeholder:text-kelly-gray-400 focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-kelly-green hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search
          </button>
          {(hasSearched || searchQuery) && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-kelly-gray-700 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Filters */}
      <FilterBar
        fields={filterFields}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Results Summary */}
      {hasSearched && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-kelly-gray-600">
            {filteredResults.length === 0 ? (
              'No employees found matching your criteria.'
            ) : (
              <>
                Found{' '}
                <span className="font-semibold text-kelly-gray-900">
                  {filteredResults.length}
                </span>{' '}
                employee{filteredResults.length !== 1 ? 's' : ''}{' '}
                {searchQuery.trim() && (
                  <>
                    matching &quot;<span className="font-medium">{searchQuery.trim()}</span>&quot;
                  </>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* Results Table or Empty State */}
      {hasSearched && filteredResults.length === 0 ? (
        <EmptyState
          variant="search"
          title="No Results Found"
          message={
            searchQuery.trim()
              ? `No employees match "${searchQuery.trim()}". Try adjusting your search or filters.`
              : 'No employees match the current filters. Try resetting your filters.'
          }
          actionLabel="Clear Search"
          onAction={handleClearSearch}
        />
      ) : (
        <DataTable
          columns={columns}
          data={hasSearched ? filteredResults : employees}
          onRowClick={handleRowClick}
          rowKey="employeeId"
          pageSize={10}
          emptyMessage="No employee records available."
        />
      )}

      {/* Help Text */}
      {!hasSearched && (
        <div className="bg-kelly-gray-50 border border-kelly-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-kelly-gray-900 mb-2">Search Tips</h3>
          <ul className="space-y-1 text-sm text-kelly-gray-600">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
              <span>Search by <strong>employee name</strong> (e.g., &quot;John Smith&quot;)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
              <span>Search by <strong>Kelly ID</strong> (e.g., &quot;K100234&quot;)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
              <span>Search by <strong>last 4 SSN digits</strong> (e.g., &quot;6789&quot;)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
              <span>Use the <strong>filters</strong> above to narrow results by department, location, or status</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
              <span><strong>Click a row</strong> to view the employee&apos;s documents and details</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default EmployeeSearch;