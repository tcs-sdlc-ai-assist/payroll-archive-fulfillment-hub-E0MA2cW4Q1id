import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudit } from '../contexts/AuditContext';
import { useRBAC } from '../contexts/RBACContext';
import { useArchiveHealth } from '../hooks/useArchiveHealth';
import { useEmployees } from '../hooks/useEmployees';
import { useDocuments } from '../hooks/useDocuments';
import { StatusBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { formatTimestamp } from '../utils/dateUtils';
import { ACTION_TYPES, PERMISSIONS } from '../utils/constants';

/**
 * Main dashboard page showing summary metrics cards (total employees,
 * total documents, recent activity count, archive health status),
 * quick action links (Search Employee, View Audit Log, Archive Health),
 * and recent audit events preview. Uses useAudit() and useArchiveHealth()
 * hooks. Entry point after login.
 *
 * Implements:
 *   - SCRUM-258: Audit Logging of Retrieval Events
 *   - SCRUM-260: Monitor Archive Completeness
 */
export function DashboardPage() {
  const { events, isLoading: auditLoading, error: auditError } = useAudit();
  const { currentUser, hasPermission } = useRBAC();
  const { healthData, unresolvedExceptions, loading: healthLoading, error: healthError } = useArchiveHealth();
  const { employees, loading: empLoading } = useEmployees();
  const { documents, loading: docsLoading } = useDocuments();
  const navigate = useNavigate();

  /**
   * Summary statistics for the dashboard.
   * @type {{ totalEmployees: number, totalDocuments: number, availableDocuments: number, missingDocuments: number, recentActivityCount: number, totalAuditEvents: number, deniedCount: number, successCount: number }}
   */
  const summary = useMemo(() => {
    const totalEmployees = Array.isArray(employees) ? employees.length : 0;
    const totalDocuments = Array.isArray(documents) ? documents.length : 0;
    const availableDocuments = Array.isArray(documents)
      ? documents.filter((d) => d.status === 'available').length
      : 0;
    const missingDocuments = Array.isArray(documents)
      ? documents.filter((d) => d.status === 'missing').length
      : 0;
    const totalAuditEvents = events.length;
    const deniedCount = events.filter(
      (e) =>
        (e.details && e.details.status === 'denied') ||
        e.actionType === ACTION_TYPES.DENIED
    ).length;
    const successCount = events.filter(
      (e) => e.details && e.details.status === 'success'
    ).length;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentActivityCount = events.filter((e) => {
      try {
        return new Date(e.timestamp).getTime() >= oneDayAgo;
      } catch {
        return false;
      }
    }).length;

    return {
      totalEmployees,
      totalDocuments,
      availableDocuments,
      missingDocuments,
      recentActivityCount,
      totalAuditEvents,
      deniedCount,
      successCount,
    };
  }, [employees, documents, events]);

  /**
   * Recent audit events for the preview section (last 10).
   * @type {Object[]}
   */
  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return bTime - aTime;
      })
      .slice(0, 10);
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
   * Handles navigating to the employee search page.
   */
  const handleGoToSearch = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  /**
   * Handles navigating to the audit log page.
   */
  const handleGoToAudit = useCallback(() => {
    navigate('/audit');
  }, [navigate]);

  /**
   * Handles navigating to the archive health page.
   */
  const handleGoToArchiveHealth = useCallback(() => {
    navigate('/archive-health');
  }, [navigate]);

  /**
   * Handles navigating to the governance dashboard.
   */
  const handleGoToGovernance = useCallback(() => {
    navigate('/governance');
  }, [navigate]);

  const isLoading = auditLoading || healthLoading || empLoading || docsLoading;
  const error = auditError || healthError;

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard…" size="lg" />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Error Loading Dashboard"
        message={`An error occurred while loading dashboard data: ${error}`}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-kelly-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-kelly-gray-500">
          Welcome back
          {currentUser && (
            <span>
              , <span className="font-medium">{currentUser.displayName}</span> ({currentUser.role})
            </span>
          )}
          . Here&apos;s an overview of the Payroll Archive &amp; Fulfillment Hub.
        </p>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.totalEmployees}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Employees</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.totalDocuments}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Documents</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.availableDocuments}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Available</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.missingDocuments}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Missing</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.totalAuditEvents}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Audit Events</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.successCount}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Successful</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.deniedCount}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Denied</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.recentActivityCount}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Recent (24h)</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Employee */}
        {hasPermission(PERMISSIONS.SEARCH) && (
          <button
            type="button"
            onClick={handleGoToSearch}
            className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5 text-left hover:border-kelly-green hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-kelly-green/10 group-hover:bg-kelly-green/20 transition-colors">
                <svg
                  className="w-5 h-5 text-kelly-green"
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
              <div>
                <h3 className="text-sm font-semibold text-kelly-gray-900">Search Employee</h3>
                <p className="text-xs text-kelly-gray-500">Find employees by name, ID, or SSN</p>
              </div>
            </div>
            <span className="text-xs font-medium text-kelly-green group-hover:text-kelly-dark transition-colors">
              Go to Search →
            </span>
          </button>
        )}

        {/* View Audit Log */}
        {hasPermission(PERMISSIONS.AUDIT) && (
          <button
            type="button"
            onClick={handleGoToAudit}
            className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5 text-left hover:border-kelly-green hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-kelly-gray-900">Audit Log</h3>
                <p className="text-xs text-kelly-gray-500">View all document access events</p>
              </div>
            </div>
            <span className="text-xs font-medium text-kelly-green group-hover:text-kelly-dark transition-colors">
              View Audit Log →
            </span>
          </button>
        )}

        {/* Archive Health */}
        {hasPermission(PERMISSIONS.DASHBOARD) && (
          <button
            type="button"
            onClick={handleGoToArchiveHealth}
            className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5 text-left hover:border-kelly-green hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-kelly-gray-900">Archive Health</h3>
                <p className="text-xs text-kelly-gray-500">Monitor ingestion and data quality</p>
              </div>
            </div>
            <span className="text-xs font-medium text-kelly-green group-hover:text-kelly-dark transition-colors">
              View Archive Health →
            </span>
          </button>
        )}

        {/* Governance Dashboard */}
        {hasPermission(PERMISSIONS.GOVERNANCE) && (
          <button
            type="button"
            onClick={handleGoToGovernance}
            className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5 text-left hover:border-kelly-green hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                <svg
                  className="w-5 h-5 text-yellow-600"
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
              </div>
              <div>
                <h3 className="text-sm font-semibold text-kelly-gray-900">Governance</h3>
                <p className="text-xs text-kelly-gray-500">Compliance and security overview</p>
              </div>
            </div>
            <span className="text-xs font-medium text-kelly-green group-hover:text-kelly-dark transition-colors">
              View Governance →
            </span>
          </button>
        )}
      </div>

      {/* Archive Health Summary & Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Archive Health Overview */}
        {healthData && (
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-kelly-gray-900">Archive Health</h2>
              <button
                type="button"
                onClick={handleGoToArchiveHealth}
                className="text-xs font-medium text-kelly-green hover:text-kelly-dark transition-colors"
              >
                View Details →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="text-center bg-kelly-gray-50 rounded-md px-3 py-3 border border-kelly-gray-100">
                <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Files Ingested
                </p>
                <p className="text-lg font-bold text-kelly-gray-900 mt-1">
                  {healthData.totalFilesIngested != null
                    ? healthData.totalFilesIngested.toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="text-center bg-kelly-gray-50 rounded-md px-3 py-3 border border-kelly-gray-100">
                <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Success Rate
                </p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {healthData.ingestionSuccessRate != null
                    ? `${healthData.ingestionSuccessRate}%`
                    : '—'}
                </p>
              </div>
              <div className="text-center bg-kelly-gray-50 rounded-md px-3 py-3 border border-kelly-gray-100">
                <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Failed Records
                </p>
                <p className="text-lg font-bold text-red-600 mt-1">
                  {healthData.failedRecords != null
                    ? healthData.failedRecords.toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="text-center bg-kelly-gray-50 rounded-md px-3 py-3 border border-kelly-gray-100">
                <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Missing Metadata
                </p>
                <p className="text-lg font-bold text-yellow-600 mt-1">
                  {healthData.missingMetadataCount != null
                    ? healthData.missingMetadataCount.toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="text-center bg-kelly-gray-50 rounded-md px-3 py-3 border border-kelly-gray-100">
                <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Archive Size
                </p>
                <p className="text-lg font-bold text-kelly-gray-900 mt-1">
                  {healthData.archiveSizeGB != null
                    ? `${healthData.archiveSizeGB.toLocaleString()} GB`
                    : '—'}
                </p>
              </div>
              <div className="text-center bg-kelly-gray-50 rounded-md px-3 py-3 border border-kelly-gray-100">
                <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Open Exceptions
                </p>
                <p className="text-lg font-bold text-yellow-600 mt-1">
                  {unresolvedExceptions.length}
                </p>
              </div>
            </div>

            {/* Document Types */}
            {healthData.documentTypes && (
              <div className="mt-4 pt-4 border-t border-kelly-gray-100">
                <h3 className="text-xs font-semibold text-kelly-gray-700 uppercase tracking-wider mb-3">
                  Document Types
                </h3>
                <div className="grid grid-cols-2 gap-3">
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
          </div>
        )}

        {/* Unresolved Exceptions Preview */}
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-kelly-gray-900">Unresolved Exceptions</h2>
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
              {unresolvedExceptions.slice(0, 5).map((exception) => (
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
              {unresolvedExceptions.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleGoToArchiveHealth}
                    className="text-xs font-medium text-kelly-green hover:text-kelly-dark transition-colors"
                  >
                    View all {unresolvedExceptions.length} exceptions →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Events */}
      <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-kelly-gray-900">Recent Audit Events</h2>
          {hasPermission(PERMISSIONS.AUDIT) && (
            <button
              type="button"
              onClick={handleGoToAudit}
              className="text-xs font-medium text-kelly-green hover:text-kelly-dark transition-colors"
            >
              View Full Audit Log →
            </button>
          )}
        </div>

        {recentEvents.length === 0 ? (
          <div className="py-6 text-center text-sm text-kelly-gray-500">
            No audit events have been recorded yet. Actions such as previewing, downloading, emailing, or packaging documents will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto border border-kelly-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-kelly-gray-200">
              <thead className="bg-kelly-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-kelly-gray-600"
                  >
                    Event ID
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-kelly-gray-600"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-kelly-gray-600"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-kelly-gray-600"
                  >
                    Action
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-kelly-gray-600"
                  >
                    Employee
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-kelly-gray-600"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-kelly-gray-100">
                {recentEvents.map((event, index) => (
                  <tr
                    key={event.eventId}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-kelly-gray-50/50'} hover:bg-kelly-gray-100 transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className="font-mono text-xs text-kelly-gray-600">
                        {event.eventId || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className="text-kelly-gray-700 text-xs">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-kelly-gray-900 text-sm">
                          {event.userName || '—'}
                        </span>
                        <span className="text-xs text-kelly-gray-500">
                          {event.userRole || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getActionBadgeClass(event.actionType)}`}
                      >
                        {getActionLabel(event.actionType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-kelly-gray-700">
                          {event.employeeId || '—'}
                        </span>
                        {event.details && event.details.employeeName && (
                          <span className="text-xs text-kelly-gray-500">
                            {event.details.employeeName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <StatusBadge
                        status={
                          event.details && event.details.status
                            ? event.details.status
                            : 'Unknown'
                        }
                        dot
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Year Coverage */}
      {healthData && healthData.yearCoverage && (
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold text-kelly-gray-900 mb-4">Year Coverage</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(healthData.yearCoverage)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([year, count]) => (
                <div
                  key={year}
                  className="text-center bg-kelly-gray-50 rounded-md px-3 py-3 border border-kelly-gray-100"
                >
                  <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    {year}
                  </p>
                  <p className="text-lg font-bold text-kelly-gray-900 mt-1">
                    {typeof count === 'number' ? count.toLocaleString() : count}
                  </p>
                  <p className="text-[10px] text-kelly-gray-400">records</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Dashboard Notice */}
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
            <h3 className="text-sm font-semibold text-kelly-gray-900 mb-1">About the Dashboard</h3>
            <ul className="space-y-1 text-sm text-kelly-gray-600">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>This dashboard provides an overview of the Payroll Archive &amp; Fulfillment Hub.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Use the quick action links above to navigate to key features.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>Recent audit events show the latest document access and fulfillment actions.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>All data is session-local and resets on page reload (simulated environment).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;