import { useMemo } from 'react';
import { useArchiveHealth } from '../../hooks/useArchiveHealth';
import { useRBAC } from '../../contexts/RBACContext';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { DataTable } from '../shared/DataTable';
import { formatTimestamp, formatDateForDisplay } from '../../utils/dateUtils';

/**
 * Archive health monitoring page displaying total files ingested,
 * failed records, missing metadata count, last ingestion/validation dates,
 * and unresolved exceptions list. Uses useArchiveHealth() hook.
 * Highlights unresolved exceptions with warning styling.
 * Accessible to Supervisor and operations roles.
 *
 * Implements:
 *   - SCRUM-260: Monitor Archive Completeness
 */
export function ArchiveHealthView() {
  const { healthData, unresolvedExceptions, loading, error } = useArchiveHealth();
  const { currentUser } = useRBAC();

  /**
   * Summary statistics derived from the health data.
   * @type {{ totalFiles: string, failedRecords: string, missingMetadata: string, successRate: string, archiveSize: string, lastIngestion: string, lastValidation: string }}
   */
  const summary = useMemo(() => {
    if (!healthData) {
      return {
        totalFiles: '—',
        failedRecords: '—',
        missingMetadata: '—',
        successRate: '—',
        archiveSize: '—',
        lastIngestion: '—',
        lastValidation: '—',
      };
    }

    return {
      totalFiles:
        healthData.totalFilesIngested != null
          ? healthData.totalFilesIngested.toLocaleString()
          : '—',
      failedRecords:
        healthData.failedRecords != null
          ? healthData.failedRecords.toLocaleString()
          : '—',
      missingMetadata:
        healthData.missingMetadataCount != null
          ? healthData.missingMetadataCount.toLocaleString()
          : '—',
      successRate:
        healthData.ingestionSuccessRate != null
          ? `${healthData.ingestionSuccessRate}%`
          : '—',
      archiveSize:
        healthData.archiveSizeGB != null
          ? `${healthData.archiveSizeGB.toLocaleString()} GB`
          : '—',
      lastIngestion: healthData.lastIngestionDate
        ? formatTimestamp(healthData.lastIngestionDate)
        : '—',
      lastValidation: healthData.lastValidationDate
        ? formatTimestamp(healthData.lastValidationDate)
        : '—',
    };
  }, [healthData]);

  /**
   * Exception counts by status.
   * @type {{ open: number, inReview: number, resolved: number }}
   */
  const exceptionCounts = useMemo(() => {
    if (!healthData || !Array.isArray(healthData.unresolvedExceptions)) {
      return { open: 0, inReview: 0, resolved: 0 };
    }

    let open = 0;
    let inReview = 0;
    let resolved = 0;

    for (const exc of healthData.unresolvedExceptions) {
      if (exc.status === 'open') {
        open++;
      } else if (exc.status === 'in_review') {
        inReview++;
      } else if (exc.status === 'resolved') {
        resolved++;
      }
    }

    return { open, inReview, resolved };
  }, [healthData]);

  /**
   * Exception types breakdown.
   * @type {Object.<string, number>}
   */
  const exceptionTypeBreakdown = useMemo(() => {
    if (!unresolvedExceptions || unresolvedExceptions.length === 0) {
      return {};
    }

    const breakdown = {};
    for (const exc of unresolvedExceptions) {
      const type = exc.type || 'Unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    }

    return breakdown;
  }, [unresolvedExceptions]);

  /**
   * Table column configuration for the exceptions DataTable.
   * @type {Array}
   */
  const exceptionColumns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Exception ID',
        sortable: true,
        render: (value) => (
          <span className="font-mono text-xs text-kelly-gray-600">{value || '—'}</span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        render: (value) => {
          let badgeClass = 'bg-kelly-gray-100 text-kelly-gray-700';
          switch (value) {
            case 'Missing SSN':
              badgeClass = 'bg-red-100 text-red-800';
              break;
            case 'Duplicate Record':
              badgeClass = 'bg-orange-100 text-orange-800';
              break;
            case 'Missing Metadata':
              badgeClass = 'bg-yellow-100 text-yellow-800';
              break;
            case 'Corrupt File':
              badgeClass = 'bg-red-100 text-red-800';
              break;
            case 'Mismatched Employee ID':
              badgeClass = 'bg-blue-100 text-blue-800';
              break;
            case 'Ingestion Timeout':
              badgeClass = 'bg-purple-100 text-purple-800';
              break;
            default:
              break;
          }
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}
            >
              {value || '—'}
            </span>
          );
        },
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        render: (value) => (
          <span className="text-sm text-kelly-gray-700 line-clamp-2" title={value || ''}>
            {value || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value || 'Unknown'} dot />,
      },
      {
        key: 'employeeId',
        label: 'Employee ID',
        sortable: true,
        render: (value) => (
          <span className="font-mono text-xs text-kelly-gray-700">{value || '—'}</span>
        ),
      },
      {
        key: 'documentId',
        label: 'Document ID',
        sortable: true,
        render: (value) => (
          <span className="font-mono text-xs text-kelly-gray-700">{value || '—'}</span>
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
    ],
    []
  );

  if (loading) {
    return <LoadingSpinner message="Loading archive health data…" size="lg" />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Error Loading Archive Health"
        message={`An error occurred while loading archive health data: ${error}`}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!healthData) {
    return (
      <EmptyState
        variant="error"
        title="No Archive Health Data"
        message="Archive health data is not available. Please try again later."
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-kelly-gray-900">Archive Health</h1>
        <p className="mt-1 text-sm text-kelly-gray-500">
          Monitor archive ingestion status, data quality, and unresolved exceptions.
          {currentUser && (
            <span className="ml-1">
              Logged in as <span className="font-medium">{currentUser.displayName}</span> ({currentUser.role}).
            </span>
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.totalFiles}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
            Files Ingested
          </p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.successRate}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
            Success Rate
          </p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.failedRecords}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
            Failed Records
          </p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{summary.missingMetadata}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
            Missing Metadata
          </p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{summary.archiveSize}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
            Archive Size
          </p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{unresolvedExceptions.length}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
            Open Exceptions
          </p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{exceptionCounts.resolved}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">
            Resolved
          </p>
        </div>
      </div>

      {/* Ingestion & Validation Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-kelly-green/10">
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-kelly-gray-900">Last Ingestion</h3>
              <p className="text-xs text-kelly-gray-500">Most recent data ingestion run</p>
            </div>
          </div>
          <p className="text-lg font-bold text-kelly-gray-900">{summary.lastIngestion}</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
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
              <h3 className="text-sm font-semibold text-kelly-gray-900">Last Validation</h3>
              <p className="text-xs text-kelly-gray-500">Most recent data validation check</p>
            </div>
          </div>
          <p className="text-lg font-bold text-kelly-gray-900">{summary.lastValidation}</p>
        </div>
      </div>

      {/* Document Types & Year Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Types Breakdown */}
        {healthData.documentTypes && (
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
            <h2 className="text-sm font-semibold text-kelly-gray-900 mb-4">Document Types</h2>
            <div className="space-y-3">
              {Object.entries(healthData.documentTypes).map(([type, count]) => {
                const total = healthData.totalFilesIngested || 1;
                const percentage =
                  typeof count === 'number' ? ((count / total) * 100).toFixed(1) : '0';

                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-kelly-gray-700">{type}</span>
                      <span className="text-sm font-bold text-kelly-gray-900">
                        {typeof count === 'number' ? count.toLocaleString() : count}
                      </span>
                    </div>
                    <div className="w-full bg-kelly-gray-100 rounded-full h-2">
                      <div
                        className="bg-kelly-green rounded-full h-2 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-kelly-gray-400 mt-0.5">{percentage}% of total</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Year Coverage */}
        {healthData.yearCoverage && (
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
            <h2 className="text-sm font-semibold text-kelly-gray-900 mb-4">Year Coverage</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
      </div>

      {/* Exception Type Breakdown */}
      {Object.keys(exceptionTypeBreakdown).length > 0 && (
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold text-kelly-gray-900 mb-4">
            Exception Types Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(exceptionTypeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-md px-3 py-2"
                >
                  <span className="text-xs font-medium text-kelly-gray-700 truncate mr-2">
                    {type}
                  </span>
                  <span className="text-sm font-bold text-yellow-700 flex-shrink-0">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Unresolved Exceptions Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-kelly-gray-900">Unresolved Exceptions</h2>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
              {exceptionCounts.open} open
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
              {exceptionCounts.inReview} in review
            </span>
          </div>
        </div>

        {unresolvedExceptions.length === 0 ? (
          <EmptyState
            variant="default"
            title="No Unresolved Exceptions"
            message="All archive exceptions have been resolved. The archive is in good health."
          />
        ) : (
          <DataTable
            columns={exceptionColumns}
            data={unresolvedExceptions}
            rowKey="id"
            pageSize={10}
            emptyMessage="No unresolved exceptions."
          />
        )}
      </div>

      {/* All Exceptions (including resolved) */}
      {healthData.unresolvedExceptions &&
        Array.isArray(healthData.unresolvedExceptions) &&
        healthData.unresolvedExceptions.some((e) => e.status === 'resolved') && (
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
            <h2 className="text-sm font-semibold text-kelly-gray-900 mb-4">
              Recently Resolved Exceptions
            </h2>
            <div className="space-y-3">
              {healthData.unresolvedExceptions
                .filter((e) => e.status === 'resolved')
                .map((exception) => (
                  <div
                    key={exception.id}
                    className="flex items-start justify-between p-3 bg-green-50 border border-green-100 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-kelly-gray-900">
                          {exception.type || 'Unknown'}
                        </span>
                        <StatusBadge status={exception.status || 'resolved'} dot />
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
                      className="w-5 h-5 text-green-500 flex-shrink-0 ml-2"
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
                ))}
            </div>
          </div>
        )}

      {/* Archive Health Notice */}
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
            <h3 className="text-sm font-semibold text-kelly-gray-900 mb-1">
              About Archive Health
            </h3>
            <ul className="space-y-1 text-sm text-kelly-gray-600">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>
                  The archive contains approximately 89.1 million files covering tax years 2019–2024.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>
                  Ingestion success rate reflects the percentage of files successfully processed
                  during ingestion.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>
                  Unresolved exceptions require manual review and may affect document availability
                  for specific employees.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>
                  Exception types include Missing SSN, Duplicate Records, Missing Metadata, Corrupt
                  Files, and more.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kelly-green mt-1.5 flex-shrink-0" />
                <span>
                  Archive health data is loaded from static fixtures and resets on page reload
                  (simulated environment).
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArchiveHealthView;