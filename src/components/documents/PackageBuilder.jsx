import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useRBAC } from '../../contexts/RBACContext';
import { useAudit } from '../../contexts/AuditContext';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import {
  ACTION_TYPES,
  PERMISSIONS,
  DOCUMENT_TYPES,
} from '../../utils/constants';

/**
 * Multi-document package builder component.
 * Displays selected documents in a checklist, shows total count,
 * and provides Create Package button. On confirmation, simulates
 * package creation (mocked) and logs the action via useAudit().
 * Used within Employee360 view for bulk operations.
 *
 * Implements:
 *   - SCRUM-257: Package Multiple Documents
 *
 * @param {Object} props
 * @param {Object[]} props.documents - Array of document objects available for packaging
 * @param {Object} [props.employee] - The employee associated with the documents
 * @param {Function} [props.onPackageComplete] - Optional callback invoked after a successful package creation
 * @param {Function} [props.onCancel] - Optional callback invoked when the user cancels
 * @param {string} [props.className] - Optional additional CSS classes for the container
 */
export function PackageBuilder({
  documents,
  employee,
  onPackageComplete,
  onCancel,
  className,
}) {
  const { currentUser, hasPermission } = useRBAC();
  const { logEvent } = useAudit();

  const [selectedDocs, setSelectedDocs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const canPackage = hasPermission(PERMISSIONS.PACKAGE);

  /**
   * Available documents filtered to only those with status 'available'.
   * @type {Object[]}
   */
  const availableDocuments = useMemo(() => {
    if (!Array.isArray(documents)) {
      return [];
    }
    return documents.filter((d) => d && d.status === 'available');
  }, [documents]);

  /**
   * Documents filtered by type and year selections.
   * @type {Object[]}
   */
  const filteredDocuments = useMemo(() => {
    let results = availableDocuments;

    if (filterType) {
      results = results.filter((d) => d.documentType === filterType);
    }

    if (filterYear) {
      results = results.filter((d) => d.year === filterYear);
    }

    return results;
  }, [availableDocuments, filterType, filterYear]);

  /**
   * Available years from the documents.
   * @type {string[]}
   */
  const availableYears = useMemo(() => {
    const years = new Set();
    for (const doc of availableDocuments) {
      if (doc.year) {
        years.add(doc.year);
      }
    }
    return [...years].sort().reverse();
  }, [availableDocuments]);

  /**
   * Available document types from the documents.
   * @type {string[]}
   */
  const availableTypes = useMemo(() => {
    const types = new Set();
    for (const doc of availableDocuments) {
      if (doc.documentType) {
        types.add(doc.documentType);
      }
    }
    return [...types].sort();
  }, [availableDocuments]);

  /**
   * Year range string for the selected documents.
   * @type {string}
   */
  const selectedYearRange = useMemo(() => {
    if (selectedDocs.length === 0) {
      return '';
    }
    const years = [...new Set(selectedDocs.map((d) => d.year))].sort();
    if (years.length === 1) {
      return years[0];
    }
    return `${years[0]}–${years[years.length - 1]}`;
  }, [selectedDocs]);

  /**
   * Toggles a document in the selected documents list.
   * @param {Object} doc - The document to toggle
   */
  const handleToggleDoc = useCallback((doc) => {
    setSelectedDocs((prev) => {
      const exists = prev.some((d) => d.documentId === doc.documentId);
      if (exists) {
        return prev.filter((d) => d.documentId !== doc.documentId);
      }
      return [...prev, doc];
    });
  }, []);

  /**
   * Selects or deselects all filtered documents.
   */
  const handleSelectAll = useCallback(() => {
    const allSelected = filteredDocuments.every((d) =>
      selectedDocs.some((s) => s.documentId === d.documentId)
    );

    if (allSelected) {
      const filteredIds = new Set(filteredDocuments.map((d) => d.documentId));
      setSelectedDocs((prev) => prev.filter((d) => !filteredIds.has(d.documentId)));
    } else {
      const currentIds = new Set(selectedDocs.map((d) => d.documentId));
      const newDocs = filteredDocuments.filter((d) => !currentIds.has(d.documentId));
      setSelectedDocs((prev) => [...prev, ...newDocs]);
    }
  }, [filteredDocuments, selectedDocs]);

  /**
   * Clears all selected documents.
   */
  const handleClearSelection = useCallback(() => {
    setSelectedDocs([]);
  }, []);

  /**
   * Handles filter type change.
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleFilterTypeChange = useCallback((e) => {
    setFilterType(e.target.value);
  }, []);

  /**
   * Handles filter year change.
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleFilterYearChange = useCallback((e) => {
    setFilterYear(e.target.value);
  }, []);

  /**
   * Resets all filters.
   */
  const handleResetFilters = useCallback(() => {
    setFilterType('');
    setFilterYear('');
  }, []);

  /**
   * Opens the confirmation modal for package creation.
   */
  const handleCreatePackage = useCallback(() => {
    if (selectedDocs.length === 0) {
      return;
    }

    if (!canPackage) {
      if (currentUser) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DENIED,
          documentId: null,
          employeeId: employee ? employee.employeeId : null,
          details: {
            employeeName: employee ? employee.name : null,
            status: 'denied',
            reason: 'Insufficient permissions for package',
          },
        });
      }

      setLastResult({
        success: false,
        message: `Access denied. Your role (${currentUser ? currentUser.role : 'Unknown'}) does not have permission to package documents.`,
      });
      return;
    }

    setModalOpen(true);
  }, [selectedDocs, canPackage, currentUser, logEvent, employee]);

  /**
   * Handles confirming the package creation.
   */
  const handleConfirm = useCallback(() => {
    if (!currentUser || selectedDocs.length === 0) {
      setModalOpen(false);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const years = [...new Set(selectedDocs.map((d) => d.year))].sort();
      const docTypes = [...new Set(selectedDocs.map((d) => d.documentType))];
      const docTypeLabel = docTypes.length === 1 ? docTypes[0] : 'Mixed';

      logEvent({
        userId: currentUser.userId,
        userName: currentUser.displayName,
        userRole: currentUser.role,
        actionType: ACTION_TYPES.PACKAGE,
        documentId: null,
        employeeId: employee ? employee.employeeId : (selectedDocs[0] ? selectedDocs[0].employeeId : null),
        details: {
          documentType: docTypeLabel,
          years,
          employeeName: employee ? employee.name : (selectedDocs[0] ? selectedDocs[0].employeeName : 'Unknown'),
          status: 'success',
          documentCount: selectedDocs.length,
        },
      });

      setLastResult({
        success: true,
        message: `Document package created successfully with ${selectedDocs.length} document(s) covering ${selectedYearRange}. The audit log has been updated.`,
      });

      setSelectedDocs([]);
      setIsProcessing(false);
      setModalOpen(false);

      if (onPackageComplete) {
        onPackageComplete(selectedDocs);
      }
    }, 800);
  }, [currentUser, selectedDocs, selectedYearRange, employee, logEvent, onPackageComplete]);

  /**
   * Handles cancelling the modal.
   */
  const handleCancel = useCallback(() => {
    setModalOpen(false);

    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  /**
   * Dismisses the last result banner.
   */
  const handleDismissResult = useCallback(() => {
    setLastResult(null);
  }, []);

  /**
   * Whether all filtered documents are selected.
   * @type {boolean}
   */
  const allFilteredSelected = useMemo(() => {
    if (filteredDocuments.length === 0) {
      return false;
    }
    return filteredDocuments.every((d) =>
      selectedDocs.some((s) => s.documentId === d.documentId)
    );
  }, [filteredDocuments, selectedDocs]);

  /**
   * Whether some (but not all) filtered documents are selected.
   * @type {boolean}
   */
  const someFilteredSelected = useMemo(() => {
    if (filteredDocuments.length === 0) {
      return false;
    }
    const count = filteredDocuments.filter((d) =>
      selectedDocs.some((s) => s.documentId === d.documentId)
    ).length;
    return count > 0 && count < filteredDocuments.length;
  }, [filteredDocuments, selectedDocs]);

  if (!Array.isArray(documents) || documents.length === 0) {
    return (
      <EmptyState
        variant="document"
        title="No Documents Available"
        message="There are no documents available for packaging. Please search for an employee and view their documents first."
      />
    );
  }

  if (availableDocuments.length === 0) {
    return (
      <EmptyState
        variant="document"
        title="No Available Documents"
        message="All documents for this employee are currently marked as missing. Only available documents can be packaged."
      />
    );
  }

  if (!canPackage) {
    return (
      <div className={`bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5 ${className || ''}`}>
        <h3 className="text-sm font-semibold text-kelly-gray-900 mb-3">Package Builder</h3>
        <div className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-kelly-gray-400 bg-kelly-gray-100 cursor-not-allowed">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Package (No Permission)
        </div>
        <p className="mt-3 text-xs text-kelly-gray-500">
          Your role ({currentUser ? currentUser.role : 'Unknown'}) does not have permission to package documents.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Result Banner */}
      {lastResult && (
        <div
          className={`flex items-start justify-between p-4 rounded-lg border ${
            lastResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
        >
          <div className="flex items-start space-x-3">
            {lastResult.success ? (
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
            ) : (
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
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
            )}
            <div>
              <p className="text-sm font-medium">
                {lastResult.success ? 'Package Created' : 'Action Denied'}
              </p>
              <p className="text-sm mt-0.5">{lastResult.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismissResult}
            className="flex-shrink-0 ml-4 text-current opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Package Builder Card */}
      <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-kelly-gray-900">Package Builder</h3>
            {employee && (
              <p className="text-xs text-kelly-gray-500 mt-0.5">
                {employee.name} — {employee.kellyId || '—'}
              </p>
            )}
          </div>
          <span className="text-xs text-kelly-gray-500">
            {availableDocuments.length} available document{availableDocuments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-kelly-gray-100">
          <div className="flex flex-col min-w-[130px]">
            <label
              htmlFor="pkg-filter-type"
              className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1"
            >
              Type
            </label>
            <select
              id="pkg-filter-type"
              value={filterType}
              onChange={handleFilterTypeChange}
              className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-1.5 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
            >
              <option value="">All Types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[130px]">
            <label
              htmlFor="pkg-filter-year"
              className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1"
            >
              Year
            </label>
            <select
              id="pkg-filter-year"
              value={filterYear}
              onChange={handleFilterYearChange}
              className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-1.5 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!filterType && !filterYear}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-kelly-gray-700 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Reset filters"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        {/* Select All / Selection Info */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-kelly-gray-100">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someFilteredSelected;
                }
              }}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-kelly-gray-300 text-kelly-green focus:ring-kelly-green cursor-pointer"
              aria-label="Select all filtered documents"
            />
            <span className="text-sm font-medium text-kelly-gray-700">
              Select All
              {(filterType || filterYear) ? ' (Filtered)' : ''}
            </span>
          </label>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-kelly-gray-500">
              {selectedDocs.length} selected
            </span>
            {selectedDocs.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-medium text-kelly-gray-500 hover:text-kelly-gray-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Document Checklist */}
        {filteredDocuments.length === 0 ? (
          <div className="py-6 text-center text-sm text-kelly-gray-500">
            No documents match the current filters.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto mb-4">
            {filteredDocuments
              .sort((a, b) => {
                const typeCompare = (a.documentType || '').localeCompare(b.documentType || '');
                if (typeCompare !== 0) return typeCompare;
                return (b.year || '').localeCompare(a.year || '');
              })
              .map((doc) => {
                const isSelected = selectedDocs.some(
                  (s) => s.documentId === doc.documentId
                );

                return (
                  <label
                    key={doc.documentId}
                    className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-kelly-green/5 border border-kelly-green/20'
                        : 'hover:bg-kelly-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleDoc(doc)}
                        className="h-4 w-4 rounded border-kelly-gray-300 text-kelly-green focus:ring-kelly-green cursor-pointer flex-shrink-0"
                        aria-label={`Select ${doc.documentType} ${doc.year}${doc.period ? ` ${doc.period}` : ''}`}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-kelly-gray-900 block">
                          {doc.documentType} {doc.year}
                          {doc.period ? ` ${doc.period}` : ''}
                        </span>
                        <span className="text-xs text-kelly-gray-500 block truncate">
                          {doc.fileName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      {doc.fileSize && (
                        <span className="text-xs text-kelly-gray-400">{doc.fileSize}</span>
                      )}
                      <StatusBadge status={doc.status || 'Unknown'} dot />
                    </div>
                  </label>
                );
              })}
          </div>
        )}

        {/* Selection Summary */}
        {selectedDocs.length > 0 && (
          <div className="bg-kelly-gray-50 rounded-md p-3 mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Documents
                </span>
                <span className="text-sm font-medium text-kelly-gray-900">
                  {selectedDocs.length} file{selectedDocs.length !== 1 ? 's' : ''}
                </span>
              </div>
              {selectedYearRange && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    Year Range
                  </span>
                  <span className="text-sm text-kelly-gray-700">
                    {selectedYearRange}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Types
                </span>
                <span className="text-sm text-kelly-gray-700">
                  {[...new Set(selectedDocs.map((d) => d.documentType))].join(', ')}
                </span>
              </div>
              {employee && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    Employee
                  </span>
                  <span className="text-sm font-medium text-kelly-gray-900">
                    {employee.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Package Button */}
        <button
          type="button"
          onClick={handleCreatePackage}
          disabled={selectedDocs.length === 0}
          className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Create Package ({selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''})
        </button>

        {/* Audit Notice */}
        <p className="mt-3 text-xs text-kelly-gray-500 flex items-center space-x-1">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
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
          <span>Package creation will be recorded in the audit log.</span>
        </p>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <ConfirmationModal
          isOpen={modalOpen}
          actionType={ACTION_TYPES.PACKAGE}
          documents={selectedDocs}
          employee={employee}
          isProcessing={isProcessing}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

PackageBuilder.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.string,
      employeeId: PropTypes.string,
      documentType: PropTypes.string,
      year: PropTypes.string,
      period: PropTypes.string,
      fileName: PropTypes.string,
      fileUrl: PropTypes.string,
      fileSize: PropTypes.string,
      status: PropTypes.string,
      employeeName: PropTypes.string,
      kellyId: PropTypes.string,
      maskedTaxId: PropTypes.string,
    })
  ).isRequired,
  employee: PropTypes.shape({
    employeeId: PropTypes.string,
    kellyId: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    location: PropTypes.string,
    status: PropTypes.string,
  }),
  onPackageComplete: PropTypes.func,
  onCancel: PropTypes.func,
  className: PropTypes.string,
};

PackageBuilder.defaultProps = {
  employee: undefined,
  onPackageComplete: undefined,
  onCancel: undefined,
  className: undefined,
};

export default PackageBuilder;