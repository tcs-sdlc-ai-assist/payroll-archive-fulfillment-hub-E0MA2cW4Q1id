import { useState, useCallback, useMemo } from 'react';
import { useAudit } from '../../contexts/AuditContext';
import { useRBAC } from '../../contexts/RBACContext';
import { useArchiveHealth } from '../../hooks/useArchiveHealth';
import { DataTable } from '../shared/DataTable';
import { FilterBar } from '../shared/FilterBar';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatTimestamp } from '../../utils/dateUtils';
import {
  ACTION_TYPES,
  PERMISSIONS,
  EXCEPTION_STATUS,
} from '../../utils/constants';

/**
 * Governance dashboard page with summary cards (total events, denied access
 * count, email fulfillments, downloads), recent audit events table, and
 * exception highlights. Uses useAudit() for event data. Filterable by date
 * range and action type. Accessible to Supervisor role only.
 *
 * Implements:
 *   - SCRUM-264: Governance/audit dashboards
 */
export function GovernanceDashboard() {
  const { events, isLoading: auditLoading, error: auditError, filterEvents } = useAudit();
  const { currentUser, hasPermission } = useRBAC();
  const { healthData, unresolvedExceptions, loading: healthLoading, error: healthError } = useArchiveHealth();

  const [filterValues, setFilterValues] = useState({
    actionType: '',
    userRole: '',
    status: '',
    startDate: '',
    endDate: '',
  });

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
   * Filter fields configuration for the FilterBar.
   * @type {Array}
   */
  const filterFields = useMemo(
    () => [
      {
        key: 'actionType',
        label: 'Action',
        type: 'select',
        options: availableActionTypes.map((type) => ({ value: type, label: type })),
        placeholder: 'All Actions',
      },
      {
        key: 'userRole',
        label: 'Role',
        type: 'select',
        options: availableRoles.map((role) => ({ value: role, label: role })),
        placeholder: 'All Roles',
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
    ],
    [availableActionTypes, availableRoles]
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
      actionType: '',
      userRole: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  }, []);

  /**
   * Filtered audit events based on current filter values.
   * @type {Object[]}
   */
  const filteredEvents = useMemo(() => {
    const filters = {};

    if (filterValues.actionType) {
      filters.actionType = filterValues.actionType;
    }

    if (filterValues.userRole) {
      filters.userRole = filterValues.userRole;
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
   * Summary statistics for the governance dashboard.
   * @type {{ total: number, denied: number, downloads: number, emails: number, packages: number, previews: number, uniqueUsers: number }}
   */
  const summary = useMemo(() => {
    const total = events.length;
    const denied = events.filter(
      (e) =>
        (e.details && e.details.status === 'denied') ||
        e.actionType === ACTION_TYPES.DENIED
    ).length;
    const downloads = events.filter((e) => e.actionType === ACTION_TYPES.DOWNLOAD).length;
    const emails = events.filter((e) => e.actionType === ACTION_TYPES.EMAIL).length;
    const packages = events.filter((e) => e.actionType === ACTION_TYPES.PACKAGE).length;
    const previews = events.filter((e) => e.actionType === ACTION_TYPES.PREVIEW).length;
    const successfulActions = events.filter(
      (e) => e.details && e.details.status === 'success'
    ).length;

    const userIds = new Set();
    for (const event of events) {
      if (event.userId) {
        userIds.add(event.userId);
      }
    }
    const uniqueUsers = userIds.size;

    return { total, denied, downloads, emails, packages, previews, successfulActions, uniqueUsers };
  }, [events]);

  /**
   * Recent denied access events for the highlights section.
   * @type {Object[]}
   */
  const recentDeniedEvents = useMemo(() => {
    return events
      .filter(
        (e) =>
          (e.details && e.details.status === 'denied') ||
          e.actionType === ACTION_TYPES.DENIED
      )
      .sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
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
   * Table column configuration for the audit events DataTable.
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
        label: 'Employee',
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

  const isLoading = auditLoading || healthLoading;
  const error = auditError || healthError;

  if (isLoading) {
    return <LoadingSpinner message="Loading governance dashboard…" size="lg" />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Error Loading Governance Data"
        message={`An error occurred while loading governance data: ${error}`}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!hasPermission(PERMISSIONS.GOVERNANCE)) {
    return (
      <EmptyState
        variant="error"
        title="Access Restricted"
        message="The Governance Dashboard is accessible to Supervisor role only. Your current role does not have the required authorization."
        actionLabel="Go to Dashboard"
        onAction={() => window.location.assign('/dashboard')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-kelly-gray-900">Governance Dashboard</h1>
        <p className="mt-1 text-sm text-kelly-gray-500">
          Compliance overview, audit event summaries, and exception highlights.
          {currentUser && (
            <span className="ml-1">
              Logged in as <span className="font-medium">{currentUser.displayName}</span> ({currentUser.role}).
            </span>
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.total}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Total Events</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.successfulActions}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Successful</p>
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
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.uniqueUsers}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Unique Users</p>
        </div>
      </div>

      {/* Compliance Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Denied Access Highlights */}
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-kelly-gray-900">Recent Denied Access Attempts</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
              {summary.denied} total
            </span>
          </div>
          {recentDeniedEvents.length === 0 ? (
            <div className="py-6 text-center text-sm text-kelly-gray-500">
              No denied access attempts recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeniedEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-start justify-between p-3 bg-red-50 border border-red-100 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-kelly-gray-900">
                        {event.userName || 'Unknown User'}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                        {event.userRole || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-kelly-gray-600 mt-0.5">
                      {event.details && event.details.reason
                        ? event.details.reason
                        : 'Access denied'}
                    </p>
                    <p className="text-[10px] text-kelly-gray-400 mt-0.5">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-red-400 flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exception Highlights */}
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-kelly-gray-900">Unresolved Archive Exceptions</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
              {unresolvedExceptions.length} unresolved
            </span>
          </div>
          {unresolvedExceptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-kelly-gray-500">
              No unresolved exceptions. The archive is in good health.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {unresolvedExceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="flex items-start justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-kelly-gray-900">
                        {exception.type || 'Unknown'}
                      </span>
                      <StatusBadge status={exception.status || 'open'} dot />
                    </div>
                    <p className="text-xs text-kelly-gray-600 mt-0.5 line-clamp-2">
                      {exception.description || '—'}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      {exception.employeeId && (
                        <span className="text-[10px] text-kelly-gray-400 font-mono">
                          {exception.employeeId}
                        </span>
                      )}
                      {exception.documentId && (
                        <span className="text-[10px] text-kelly-gray-400 font-mono">
                          {exception.documentId}
                        </span>
                      )}
                      <span className="text-[10px] text-kelly-gray-400">
                        {formatTimestamp(exception.timestamp)}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-yellow-500 flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Archive Health Summary */}
      {healthData && (
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold text-kelly-gray-900 mb-4">Archive Health Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-kelly-gray-900">
                {healthData.totalFilesIngested
                  ? healthData.totalFilesIngested.toLocaleString()
                  : '—'}
              </p>
              <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
                Files Ingested
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                {healthData.ingestionSuccessRate != null
                  ? `${healthData.ingestionSuccessRate}%`
                  : '—'}
              </p>
              <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
                Success Rate
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">
                {healthData.failedRecords != null
                  ? healthData.failedRecords.toLocaleString()
                  : '—'}
              </p>
              <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
                Failed Records
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-600">
                {healthData.missingMetadataCount != null
                  ? healthData.missingMetadataCount.toLocaleString()
                  : '—'}
              </p>
              <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
                Missing Metadata
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-kelly-gray-900">
                {healthData.archiveSizeGB != null
                  ? `${healthData.archiveSizeGB.toLocaleString()} GB`
                  : '—'}
              </p>
              <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
                Archive Size
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-kelly-gray-900">
                {unresolvedExceptions.length}
              </p>
              <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
                Open Exceptions
              </p>
            </div>
          </div>

          {/* Document Types Breakdown */}
          {healthData.documentTypes && (
            <div className="mt-4 pt-4 border-t border-kelly-gray-100">
              <h3 className="text-xs font-semibold text-kelly-gray-700 uppercase tracking-wider mb-3">
                Document Types
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(healthData.documentTypes).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between bg-kelly-gray-50 rounded-md px-3 py-2"
                  >
                    <span className="text-sm font-medium text-kelly-gray-700">{type}</span>
                    <span className="text-sm font-bold text-kelly-gray-900">
                      {typeof count === 'number' ? count.toLocaleString() : count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Year Coverage */}
          {healthData.yearCoverage && (
            <div className="mt-4 pt-4 border-t border-kelly-gray-100">
              <h3 className="text-xs font-semibold text-kelly-gray-700 uppercase tracking-wider mb-3">
                Year Coverage
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Object.entries(healthData.yearCoverage)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([year, count]) => (
                    <div
                      key={year}
                      className="text-center bg-kelly-gray-50 rounded-md px-3 py-2"
                    >
                      <p className="text-xs font-medium text-kelly-gray-500">{year}</p>
                      <p className="text-sm font-bold text-kelly-gray-900">
                        {typeof count === 'number' ? count.toLocaleString() : count}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Events Section */}
      <div>
        <h2 className="text-lg font-semibold text-kelly-gray-900 mb-4">Audit Events</h2>

        {/* Filters */}
        <FilterBar
          fields={filterFields}
          dateRanges={dateRangeFields}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-4 mb-4">
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
                : 'No audit events have been recorded yet.'
            }
            actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
            onAction={hasActiveFilters ? handleFilterReset : undefined}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredEvents}
            rowKey="eventId"
            pageSize={10}
            emptyMessage="No audit events available."
          />
        )}
      </div>

      {/* Governance Notice */}
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-kelly-gray-900 mb-1">About the Governance Dashboard</h3>
            <ul className="space-y-1 text-sm text-kelly-gray-600">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>This dashboard provides a compliance overview of all document access and fulfillment actions.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Denied access attempts are highlighted for security review.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Unresolved archive exceptions are surfaced for data quality monitoring.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Use the filters above to narrow audit events by action type, role, status, or date range.</span>
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

export default GovernanceDashboard;