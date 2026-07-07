import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { useEmployees } from '../../hooks/useEmployees';
import { useRBAC } from '../../contexts/RBACContext';
import { useAudit } from '../../contexts/AuditContext';
import { DataTable } from '../shared/DataTable';
import { MaskedField } from '../shared/MaskedField';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import {
  ACTION_TYPES,
  PERMISSIONS,
  DOCUMENT_TYPES,
  ARCHIVE_YEARS,
} from '../../utils/constants';
import { formatDateForDisplay } from '../../utils/dateUtils';

/**
 * Employee 360 archive view showing employee details (masked PII) and their
 * documents grouped by type (W-2, Paystub) and year. Uses useDocuments() hook
 * filtered by employeeId from URL params. Shows available/missing document
 * indicators. Provides Preview, Download, Email, and Package action buttons
 * per document.
 *
 * Implements:
 *   - SCRUM-254: Find Historical Documents
 *   - SCRUM-255: Search Employee
 */
export function Employee360() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { documents, getDocumentsByEmployee, loading: docsLoading, error: docsError } = useDocuments();
  const { employees, loading: empLoading, error: empError } = useEmployees();
  const { currentUser, hasPermission } = useRBAC();
  const { logEvent } = useAudit();

  const [employeeDocs, setEmployeeDocs] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalDocument, setModalDocument] = useState(null);
  const [modalDocuments, setModalDocuments] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Find the employee record from the loaded employees list.
   * @type {Object|null}
   */
  const employee = useMemo(() => {
    if (!Array.isArray(employees) || !employeeId) {
      return null;
    }
    return employees.find((emp) => emp.employeeId === employeeId) || null;
  }, [employees, employeeId]);

  /**
   * Load documents for this employee when data is ready.
   */
  useEffect(() => {
    if (!docsLoading && !docsError && employeeId && Array.isArray(documents) && documents.length > 0) {
      const docs = getDocumentsByEmployee(employeeId);
      setEmployeeDocs(docs);
    }
  }, [docsLoading, docsError, employeeId, documents, getDocumentsByEmployee]);

  /**
   * Filtered documents based on type and year selections.
   * @type {Object[]}
   */
  const filteredDocs = useMemo(() => {
    let results = employeeDocs;

    if (filterType) {
      results = results.filter((doc) => doc.documentType === filterType);
    }

    if (filterYear) {
      results = results.filter((doc) => doc.year === filterYear);
    }

    return results;
  }, [employeeDocs, filterType, filterYear]);

  /**
   * Documents grouped by type.
   * @type {Object}
   */
  const groupedByType = useMemo(() => {
    const groups = {};
    for (const doc of filteredDocs) {
      const type = doc.documentType || 'Other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(doc);
    }
    return groups;
  }, [filteredDocs]);

  /**
   * Available years from the employee's documents.
   * @type {string[]}
   */
  const availableYears = useMemo(() => {
    const years = new Set();
    for (const doc of employeeDocs) {
      if (doc.year) {
        years.add(doc.year);
      }
    }
    return [...years].sort().reverse();
  }, [employeeDocs]);

  /**
   * Summary counts for the employee's documents.
   * @type {{ total: number, available: number, missing: number, w2Count: number, paystubCount: number }}
   */
  const docSummary = useMemo(() => {
    const total = employeeDocs.length;
    const available = employeeDocs.filter((d) => d.status === 'available').length;
    const missing = employeeDocs.filter((d) => d.status === 'missing').length;
    const w2Count = employeeDocs.filter((d) => d.documentType === DOCUMENT_TYPES.W2).length;
    const paystubCount = employeeDocs.filter((d) => d.documentType === DOCUMENT_TYPES.PAYSTUB).length;
    return { total, available, missing, w2Count, paystubCount };
  }, [employeeDocs]);

  /**
   * Handles the preview action for a document.
   * @param {Object} doc - The document to preview
   */
  const handlePreview = useCallback(
    (doc) => {
      if (!doc || doc.status === 'missing') {
        return;
      }

      if (currentUser) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.PREVIEW,
          documentId: doc.documentId,
          employeeId: doc.employeeId,
          details: {
            documentType: doc.documentType,
            year: doc.year,
            period: doc.period || null,
            employeeName: doc.employeeName,
            status: 'success',
          },
        });
      }

      navigate(`/document/${doc.documentId}`);
    },
    [currentUser, logEvent, navigate]
  );

  /**
   * Opens the confirmation modal for a fulfillment action.
   * @param {string} actionType - The action type (download, email, package)
   * @param {Object} [doc] - The single document (for download/email)
   * @param {Object[]} [docs] - Multiple documents (for package)
   */
  const openConfirmationModal = useCallback(
    (actionType, doc, docs) => {
      setModalAction(actionType);
      setModalDocument(doc || null);
      setModalDocuments(docs || null);
      setModalOpen(true);
    },
    []
  );

  /**
   * Handles the download action for a document.
   * @param {Object} doc - The document to download
   */
  const handleDownload = useCallback(
    (doc) => {
      if (!doc || doc.status === 'missing') {
        return;
      }

      if (!hasPermission(PERMISSIONS.DOWNLOAD)) {
        if (currentUser) {
          logEvent({
            userId: currentUser.userId,
            userName: currentUser.displayName,
            userRole: currentUser.role,
            actionType: ACTION_TYPES.DENIED,
            documentId: doc.documentId,
            employeeId: doc.employeeId,
            details: {
              documentType: doc.documentType,
              year: doc.year,
              employeeName: doc.employeeName,
              status: 'denied',
              reason: 'Insufficient permissions',
            },
          });
        }
        return;
      }

      openConfirmationModal(ACTION_TYPES.DOWNLOAD, doc);
    },
    [hasPermission, currentUser, logEvent, openConfirmationModal]
  );

  /**
   * Handles the email action for a document.
   * @param {Object} doc - The document to email
   */
  const handleEmail = useCallback(
    (doc) => {
      if (!doc || doc.status === 'missing') {
        return;
      }

      if (!hasPermission(PERMISSIONS.EMAIL)) {
        if (currentUser) {
          logEvent({
            userId: currentUser.userId,
            userName: currentUser.displayName,
            userRole: currentUser.role,
            actionType: ACTION_TYPES.DENIED,
            documentId: doc.documentId,
            employeeId: doc.employeeId,
            details: {
              documentType: doc.documentType,
              year: doc.year,
              employeeName: doc.employeeName,
              status: 'denied',
              reason: 'Insufficient permissions',
            },
          });
        }
        return;
      }

      openConfirmationModal(ACTION_TYPES.EMAIL, doc);
    },
    [hasPermission, currentUser, logEvent, openConfirmationModal]
  );

  /**
   * Handles the package action for selected documents.
   */
  const handlePackage = useCallback(() => {
    const availableDocs = selectedDocs.filter((d) => d.status === 'available');

    if (availableDocs.length === 0) {
      return;
    }

    if (!hasPermission(PERMISSIONS.PACKAGE)) {
      if (currentUser) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DENIED,
          documentId: null,
          employeeId: employeeId,
          details: {
            employeeName: employee ? employee.name : 'Unknown',
            status: 'denied',
            reason: 'Insufficient permissions',
          },
        });
      }
      return;
    }

    openConfirmationModal(ACTION_TYPES.PACKAGE, null, availableDocs);
  }, [selectedDocs, hasPermission, currentUser, logEvent, employeeId, employee, openConfirmationModal]);

  /**
   * Handles confirming the modal action.
   */
  const handleConfirm = useCallback(() => {
    if (!modalAction || !currentUser) {
      setModalOpen(false);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (modalAction === ACTION_TYPES.DOWNLOAD && modalDocument) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DOWNLOAD,
          documentId: modalDocument.documentId,
          employeeId: modalDocument.employeeId,
          details: {
            documentType: modalDocument.documentType,
            year: modalDocument.year,
            employeeName: modalDocument.employeeName,
            status: 'success',
          },
        });
      } else if (modalAction === ACTION_TYPES.EMAIL && modalDocument) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.EMAIL,
          documentId: modalDocument.documentId,
          employeeId: modalDocument.employeeId,
          details: {
            documentType: modalDocument.documentType,
            year: modalDocument.year,
            employeeName: modalDocument.employeeName,
            recipient: employee ? employee.email : null,
            status: 'success',
          },
        });
      } else if (modalAction === ACTION_TYPES.PACKAGE && modalDocuments) {
        const years = [...new Set(modalDocuments.map((d) => d.year))].sort();
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.PACKAGE,
          documentId: null,
          employeeId: employeeId,
          details: {
            documentType: modalDocuments[0]?.documentType || 'Mixed',
            years,
            employeeName: employee ? employee.name : 'Unknown',
            status: 'success',
            documentCount: modalDocuments.length,
          },
        });
      }

      setIsProcessing(false);
      setModalOpen(false);
      setModalAction(null);
      setModalDocument(null);
      setModalDocuments(null);
      setSelectedDocs([]);
    }, 800);
  }, [modalAction, modalDocument, modalDocuments, currentUser, logEvent, employee, employeeId]);

  /**
   * Handles cancelling the modal action.
   */
  const handleCancel = useCallback(() => {
    setModalOpen(false);
    setModalAction(null);
    setModalDocument(null);
    setModalDocuments(null);
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
   * Handles resetting all filters.
   */
  const handleResetFilters = useCallback(() => {
    setFilterType('');
    setFilterYear('');
  }, []);

  /**
   * Handles navigating back to search.
   */
  const handleBackToSearch = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  /**
   * Table column configuration for the document DataTable.
   * @type {Array}
   */
  const columns = useMemo(
    () => [
      {
        key: 'documentType',
        label: 'Type',
        sortable: true,
        render: (value) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-kelly-gray-100 text-kelly-gray-700">
            {value || '—'}
          </span>
        ),
      },
      {
        key: 'year',
        label: 'Year',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-kelly-gray-900">{value || '—'}</span>
        ),
      },
      {
        key: 'period',
        label: 'Period',
        sortable: true,
        render: (value) => (
          <span className="text-kelly-gray-700">{value || '—'}</span>
        ),
      },
      {
        key: 'fileName',
        label: 'File Name',
        sortable: true,
        render: (value) => (
          <span className="text-sm text-kelly-gray-700 truncate max-w-[200px] block">{value || '—'}</span>
        ),
      },
      {
        key: 'fileSize',
        label: 'Size',
        sortable: false,
        render: (value) => (
          <span className="text-kelly-gray-600">{value || '—'}</span>
        ),
      },
      {
        key: 'createdDate',
        label: 'Created',
        sortable: true,
        render: (value) => (
          <span className="text-kelly-gray-600">{formatDateForDisplay(value)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value || 'Unknown'} dot />,
      },
      {
        key: 'documentId',
        label: 'Actions',
        sortable: false,
        render: (_value, row) => (
          <div className="flex items-center space-x-1">
            {/* Preview */}
            {hasPermission(PERMISSIONS.PREVIEW) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(row);
                }}
                disabled={row.status === 'missing'}
                className="inline-flex items-center justify-center w-7 h-7 rounded text-kelly-gray-500 hover:text-kelly-green hover:bg-kelly-green/10 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Preview"
                aria-label={`Preview ${row.documentType} ${row.year}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            {/* Download */}
            {hasPermission(PERMISSIONS.DOWNLOAD) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(row);
                }}
                disabled={row.status === 'missing'}
                className="inline-flex items-center justify-center w-7 h-7 rounded text-kelly-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Download"
                aria-label={`Download ${row.documentType} ${row.year}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
                </svg>
              </button>
            )}

            {/* Email */}
            {hasPermission(PERMISSIONS.EMAIL) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmail(row);
                }}
                disabled={row.status === 'missing'}
                className="inline-flex items-center justify-center w-7 h-7 rounded text-kelly-gray-500 hover:text-kelly-green hover:bg-kelly-green/10 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Email to Employee"
                aria-label={`Email ${row.documentType} ${row.year}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>
        ),
      },
    ],
    [hasPermission, handlePreview, handleDownload, handleEmail]
  );

  const loading = empLoading || docsLoading;
  const error = empError || docsError;

  if (loading) {
    return <LoadingSpinner message="Loading employee details…" size="lg" />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Error Loading Data"
        message={`An error occurred while loading data: ${error}`}
        actionLabel="Go Back"
        onAction={handleBackToSearch}
      />
    );
  }

  if (!employee) {
    return (
      <EmptyState
        variant="search"
        title="Employee Not Found"
        message={`No employee found with ID "${employeeId}". Please check the ID and try again.`}
        actionLabel="Back to Search"
        onAction={handleBackToSearch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={handleBackToSearch}
          className="inline-flex items-center text-sm font-medium text-kelly-gray-600 hover:text-kelly-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </button>
      </div>

      {/* Employee Details Card */}
      <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-kelly-gray-900">{employee.name}</h1>
            <p className="mt-1 text-sm text-kelly-gray-500">Employee 360 — Document Archive</p>
          </div>
          <StatusBadge status={employee.status || 'Unknown'} size="md" dot />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">Kelly ID</span>
            <p className="text-sm font-mono text-kelly-gray-900">{employee.kellyId || '—'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">Tax ID</span>
            <div>
              <MaskedField value={employee.maskedTaxId} fieldType="maskedTaxId" allowReveal={true} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">Email</span>
            <div>
              <MaskedField value={employee.email} fieldType="email" allowReveal={true} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">Department</span>
            <p className="text-sm text-kelly-gray-900">{employee.department || '—'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">Location</span>
            <p className="text-sm text-kelly-gray-900">{employee.location || '—'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">Hire Date</span>
            <p className="text-sm text-kelly-gray-900">{formatDateForDisplay(employee.hireDate)}</p>
          </div>
        </div>
      </div>

      {/* Document Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{docSummary.total}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Total Documents</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{docSummary.available}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Available</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{docSummary.missing}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Missing</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{docSummary.w2Count}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">W-2s</p>
        </div>
        <div className="bg-white border border-kelly-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-kelly-gray-900">{docSummary.paystubCount}</p>
          <p className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider mt-1">Paystubs</p>
        </div>
      </div>

      {/* Filters & Package Action */}
      <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col min-w-[150px]">
            <label
              htmlFor="filter-doc-type"
              className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1"
            >
              Document Type
            </label>
            <select
              id="filter-doc-type"
              value={filterType}
              onChange={handleFilterTypeChange}
              className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
            >
              <option value="">All Types</option>
              <option value={DOCUMENT_TYPES.W2}>W-2</option>
              <option value={DOCUMENT_TYPES.PAYSTUB}>Paystub</option>
            </select>
          </div>

          <div className="flex flex-col min-w-[150px]">
            <label
              htmlFor="filter-doc-year"
              className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1"
            >
              Year
            </label>
            <select
              id="filter-doc-year"
              value={filterYear}
              onChange={handleFilterYearChange}
              className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
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
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-kelly-gray-700 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Reset filters"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Reset
            </button>
          </div>

          {/* Package button */}
          {hasPermission(PERMISSIONS.PACKAGE) && (
            <div className="flex flex-col justify-end ml-auto">
              <button
                type="button"
                onClick={handlePackage}
                disabled={selectedDocs.filter((d) => d.status === 'available').length === 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Package Selected ({selectedDocs.filter((d) => d.status === 'available').length})
              </button>
            </div>
          )}
        </div>

        {(filterType || filterYear) && (
          <div className="mt-2 pt-2 border-t border-kelly-gray-100">
            <span className="text-xs text-kelly-gray-500">
              {[filterType, filterYear].filter(Boolean).length} filter(s) active
            </span>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-kelly-gray-600">
          Showing{' '}
          <span className="font-semibold text-kelly-gray-900">{filteredDocs.length}</span>{' '}
          document{filteredDocs.length !== 1 ? 's' : ''}
          {(filterType || filterYear) && ' (filtered)'}
        </p>
      </div>

      {/* Document Table */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          variant="document"
          title="No Documents Found"
          message={
            filterType || filterYear
              ? 'No documents match the current filters. Try resetting your filters.'
              : `No documents found for ${employee.name} in the archive.`
          }
          actionLabel={filterType || filterYear ? 'Reset Filters' : 'Back to Search'}
          onAction={filterType || filterYear ? handleResetFilters : handleBackToSearch}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredDocs}
          onRowClick={handlePreview}
          selectable={hasPermission(PERMISSIONS.PACKAGE)}
          selectedRows={selectedDocs}
          onSelectionChange={setSelectedDocs}
          rowKey="documentId"
          pageSize={10}
          emptyMessage="No documents available."
        />
      )}

      {/* Document Groups by Type */}
      {Object.keys(groupedByType).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-kelly-gray-900">Documents by Type</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(groupedByType).map(([type, docs]) => (
              <div key={type} className="bg-white border border-kelly-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-kelly-gray-900">{type}</h3>
                  <span className="text-xs font-medium text-kelly-gray-500">
                    {docs.length} document{docs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {docs
                    .sort((a, b) => (b.year || '').localeCompare(a.year || ''))
                    .map((doc) => (
                      <div
                        key={doc.documentId}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-kelly-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-sm font-medium text-kelly-gray-900">
                            {doc.year}
                            {doc.period ? ` ${doc.period}` : ''}
                          </span>
                          <StatusBadge status={doc.status || 'Unknown'} dot />
                        </div>
                        {doc.status === 'available' && hasPermission(PERMISSIONS.PREVIEW) && (
                          <button
                            type="button"
                            onClick={() => handlePreview(doc)}
                            className="text-xs font-medium text-kelly-green hover:text-kelly-dark transition-colors flex-shrink-0"
                          >
                            View
                          </button>
                        )}
                        {doc.status === 'missing' && (
                          <span className="text-xs text-red-500 flex-shrink-0">Unavailable</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalAction && (
        <ConfirmationModal
          isOpen={modalOpen}
          actionType={modalAction}
          document={modalDocument}
          documents={modalDocuments}
          employee={employee}
          recipientEmail={employee ? employee.email : undefined}
          isProcessing={isProcessing}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default Employee360;