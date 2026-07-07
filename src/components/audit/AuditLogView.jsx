import { useState, useCallback, useMemo } from 'react';
import { useAudit } from '../../contexts/AuditContext';
import { useRBAC } from '../../contexts/RBACContext';
import { DataTable } from '../shared/DataTable';
import { FilterBar } from '../shared/FilterBar';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatTimestamp } from '../../utils/dateUtils';
import {
  ACTION_TYPES,
  ROLES,
} from '../../utils/constants';

/**
 * Audit log page displaying all simulated audit events in a filterable,
 * sortable DataTable. Filters include user, date range, employee, document
 * type, and action type (via FilterBar). Each row shows eventId, userId,
 * userName, timestamp, documentId, actionType, and status. Uses useAudit()
 * context for data. Accessible to Supervisor and authorized roles only.
 *
 * Implements:
 *   - SCRUM-263: Audit logging of all sensitive actions
 *   - SCRUM-264: Governance/audit dashboards
 */
export function AuditLogView() {
  const { events, isLoading, error, filterEvents } = useAudit();
  const { currentUser } = useRBAC();

  const [filterValues, setFilterValues] = useState({
    userName: '',
    userRole: '',
    actionType: '',
    status: '',
    startDate: '',
    endDate: '',
    query: '',
  });

  /**
   * Unique user roles from the audit events.
   * @type {string[]}
   */
  const availableRoles = useMemo(() => {
    const roles = new Set();
    for (const event of events) {
      if (event.userRole) {
        roles.add(event.userRole);
      }
    }
    return [...roles].sort();
  }, [events]);

  /**
   * Unique action types from the audit events.
   * @type {string[]}
   */
  const availableActionTypes = useMemo(() => {
    const types = new Set();
    for (const event of events) {
      if (event.actionType) {
        types.add(event.actionType);
      }
    }
    return [...types].sort();
  }, [events]);

  /**
   * Unique user names from the audit events.
   * @type {string[]}
   */
  const availableUserNames = useMemo(() => {
    const names = new Set();
    for (const event of events) {
      if (event.userName) {
        names.add(event.userName);
      }
    }
    return [...names].sort();
  }, [events]);

  /**
   * Filter fields configuration for the FilterBar.
   * @type {Array}
   */
  const filterFields = useMemo(
    () => [
      {
        key: 'userName',
        label: 'User',
        type: 'select',
        options: availableUserNames.map((name) => ({ value: name, label: name })),
        placeholder: 'All Users',
      },
      {
        key: 'userRole',
        label: 'Role',
        type: 'select',
        options: availableRoles.map((role) => ({ value: role, label: role })),
        placeholder: 'All Roles',
      },
      {
        key: 'actionType',
        label: 'Action',
        type: 'select',
        options: availableActionTypes.map((type) => ({ value: type, label: type })),
        placeholder: 'All Actions',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'success', label: 'Success' },
          { value: 'denied', label: 'Denied' },
        ],
        placeholder: 'All Statuses',
      },
      {
        key: 'query',
        label: 'Search',
        type: 'text',
        placeholder: 'Search events…',
      },
    ],
    [availableUserNames, availableRoles, availableActionTypes]
  );

  /**
   * Date range fields configuration for the FilterBar.
   * @type {Array}
   */
  const dateRangeFields = useMemo(
    () => [
      {
        startKey: 'startDate',
        endKey: 'endDate',
        label: 'Date Range',
      },
    ],
    []
  );

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
      userName: '',
      userRole: '',
      actionType: '',
      status: '',
      startDate: '',
      endDate: '',
      query: '',
    });
  }, []);

  /**
   * Filtered audit events based on current filter values.
   * @type {Object[]}
   */
  const filteredEvents = useMemo(() => {
    const filters = {};

    if (filterValues.userName) {
      filters.userName = filterValues.userName;
    }

    if (filterValues.userRole) {
      filters.userRole = filterValues.userRole;
    }

    if (filterValues.actionType) {
      filters.actionType = filterValues.actionType;
    }

    if (filterValues.status) {
      filters.status = filterValues.status;
    }

    if (filterValues.startDate) {
      filters.startDate = filterValues.startDate;
    }

    if (filterValues.endDate) {
      filters.endDate = filterValues.endDate;
    }

    if (filterValues.query) {
      filters.query = filterValues.query;
    }

    if (Object.keys(filters).length === 0) {
      return [...events].sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return bTime - aTime;
      });
    }

    const results = filterEvents(filters);
    return results.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
  }, [events, filterValues, filterEvents]);

  /**
   * Summary statistics for the audit events.
   * @type {{ total: number, success: number, denied: number, previews: number, downloads: number, emails: number, packages: number }}
   */
  const summary = useMemo(() => {
    const total = events.length;
    const success = events.filter((e) => e.details && e.details.status === 'success').length;
    const denied = events.filter((e) => e.details && e.details.status === 'denied').length;
    const previews = events.filter((e) => e.actionType === ACTION_TYPES.PREVIEW).length;
    const downloads = events.filter((e) => e.actionType === ACTION_TYPES.DOWNLOAD).length;
    const emails = events.filter((e) => e.actionType === ACTION_TYPES.EMAIL).length;
    const packages = events.filter((e) => e.actionType === ACTION_TYPES.PACKAGE).length;
    return { total, success, denied, previews, downloads, emails, packages };
  }, [events]);

  /**
   * Returns a display-friendly label for an action type.
   * @param {string} actionType - The action type string
   * @returns {string} The display label
   */
  function getActionLabel(actionType) {
    switch (actionType) {
      case ACTION_TYPES.PREVIEW:
        return 'Preview';
      case ACTION_TYPES.DOWNLOAD:
        return 'Download';
      case ACTION_TYPES.EMAIL:
        return 'Email';
      case ACTION_TYPES.PACKAGE:
        return 'Package';
      case ACTION_TYPES.DENIED:
        return 'Denied Access';
      default:
        return actionType || '—';
    }
  }

  /**
   * Returns the color classes for an action type badge.
   * @param {string} actionType - The action type string
   * @returns {string} The Tailwind CSS classes
   */
  function getActionBadgeClass(actionType) {
    switch (actionType) {
      case ACTION_TYPES.PREVIEW:
        return 'bg-blue-100 text-blue-800';
      case ACTION_TYPES.DOWNLOAD:
        return 'bg-indigo-100 text-indigo-800';
      case ACTION_TYPES.EMAIL:
        return 'bg-green-100 text-green-800';
      case ACTION_TYPES.PACKAGE:
        return 'bg-purple-100 text-purple-800';
      case ACTION_TYPES.DENIED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-kelly-gray-100 text-kelly-gray-600';
    }
  }

  /**
   * Table column configuration for the DataTable.
   * @type {Array}
   */
  const columns = useMemo(
    () => [
      {
        key: 'eventId',
        label: 'Event ID',
        sortable: true,
        render: (value) => (
          <span className="font-mono text-xs text-kelly-gray-600">{value || '—'}</span>
        ),
      },
      {
        key: 'timestamp',
        label: 'Timestamp',
        sortable: true,
        render: (value) => (
          <span className="text-kelly-gray-700 text-xs whitespace-nowrap">
            {formatTimestamp(value)}
          </span>
        ),
      },
      {
        key: 'userName',
        label: 'User',
        sortable: true,
        render: (value, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-kelly-gray-900 text-sm">{value || '—'}</span>
            <span className="text-xs text-kelly-gray-500">{row.userRole || '—'}</span>
          </div>
        ),
      },
      {
        key: 'actionType',
        label: 'Action',
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getActionBadgeClass(value)}`}
          >
            {getActionLabel(value)}
          </span>
        ),
      },
      {
        key: 'employeeId',
        label: 'Employee ID',
        sortable: true,
        render: (value, row) => (
          <div className="flex flex-col">
            <span className="font-mono text-xs text-kelly-gray-700">{value || '—'}</span>
            {row.details && row.details.employeeName && (
              <span className="text-xs text-kelly-gray-500">{row.details.employeeName}</span>
            )}
          </div>
        ),
      },
      {
        key: 'documentId',
        label: 'Document ID',
        sortable: true,
        render: (value, row) => (
          <div className="flex flex-col">
            <span className="font-mono text-xs text-kelly-gray-700">{value || '—'}</span>
            {row.details && row.details.documentType && (
              <span className="text-xs text-kelly-gray-500">
                {row.details.documentType}
                {row.details.year ? ` ${row.details.year}` : ''}
                {row.details.period ? ` ${row.details.period}` : ''}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Status',
        sortable: false,
        render: (value) => {
          const status = value && value.status ? value.status : 'Unknown';
          return <StatusBadge status={status} dot />;
        },
      },
    ],
    []
  );

  /**
   * Whether any filters are currently active.
   * @type {boolean}
   */
  const hasActiveFilters = useMemo(() => {
    return Object.values(filterValues).some((val) => val != null && val !== '');
  }, [filterValues]);

  if (isLoading) {
    return <LoadingSpinner message="Loading audit log…" size="lg" />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Error Loading Audit Log"
        message={`An error occurred while loading the audit log: ${error}`}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-kelly-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-kelly-gray-500">
          View and filter all document access events, fulfillment actions, and access attempts.
          {currentUser && (
            <span className="ml-1">
              Logged in as <span className="font-medium">{currentUser.displayName}</span> ({currentUser.role}).
            </span>
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.total}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Total Events</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.success}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Success</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.denied}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Denied</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.previews}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Previews</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{summary.downloads}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Downloads</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-green">{summary.emails}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Emails</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{summary.packages}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Packages</p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        fields={filterFields}
        dateRanges={dateRangeFields}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-kelly-gray-600">
          Showing{' '}
          <span className="font-semibold text-kelly-gray-900">{filteredEvents.length}</span>{' '}
          event{filteredEvents.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleFilterReset}
            className="text-sm font-medium text-kelly-green hover:text-kelly-dark transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Audit Events Table */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          variant="audit"
          title="No Audit Events Found"
          message={
            hasActiveFilters
              ? 'No audit events match the current filters. Try adjusting or resetting your filters.'
              : 'No audit events have been recorded yet. Actions such as previewing, downloading, emailing, or packaging documents will appear here.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
          onAction={hasActiveFilters ? handleFilterReset : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredEvents}
          rowKey="eventId"
          pageSize={15}
          emptyMessage="No audit events available."
        />
      )}

      {/* Audit Notice */}
      <div className="bg-kelly-gray-50 border border-kelly-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-kelly-gray-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-kelly-gray-900 mb-1">About the Audit Log</h3>
            <ul className="space-y-1 text-sm text-kelly-gray-600">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>All document access events (preview, download, email, package) are automatically recorded.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Denied access attempts are logged with the reason for denial.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Use the filters above to narrow results by user, role, action type, status, or date range.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Audit data is session-local and resets on page reload (simulated environment).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogView;