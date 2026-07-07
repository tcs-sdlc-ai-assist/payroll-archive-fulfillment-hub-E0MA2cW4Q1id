import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { useEmployees } from '../../hooks/useEmployees';
import { useRBAC } from '../../contexts/RBACContext';
import { useAudit } from '../../contexts/AuditContext';
import { StatusBadge } from '../shared/StatusBadge';
import { MaskedField } from '../shared/MaskedField';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import {
  ACTION_TYPES,
  PERMISSIONS,
} from '../../utils/constants';
import { formatDateForDisplay } from '../../utils/dateUtils';

/**
 * Document preview page with a mock PDF viewer (styled placeholder showing
 * document metadata: type, year, period, employee name, KellyID). Displays
 * document info panel alongside the viewer. Provides Download and Email action
 * buttons. Logs preview action via useAudit(). Uses documentId from URL params.
 *
 * Implements:
 *   - SCRUM-256: Preview Document
 */
export function DocumentPreview() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { documents, loading: docsLoading, error: docsError } = useDocuments();
  const { employees, loading: empLoading, error: empError } = useEmployees();
  const { currentUser, hasPermission } = useRBAC();
  const { logEvent } = useAudit();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasLoggedPreview = useRef(false);

  /**
   * Find the document record from the loaded documents list.
   * @type {Object|null}
   */
  const document = useMemo(() => {
    if (!Array.isArray(documents) || !documentId) {
      return null;
    }
    return documents.find((doc) => doc.documentId === documentId) || null;
  }, [documents, documentId]);

  /**
   * Find the employee record associated with this document.
   * @type {Object|null}
   */
  const employee = useMemo(() => {
    if (!Array.isArray(employees) || !document) {
      return null;
    }
    return employees.find((emp) => emp.employeeId === document.employeeId) || null;
  }, [employees, document]);

  /**
   * Log the preview action once when the document is loaded.
   */
  useEffect(() => {
    if (hasLoggedPreview.current) {
      return;
    }

    if (!docsLoading && !empLoading && document && currentUser) {
      hasLoggedPreview.current = true;

      logEvent({
        userId: currentUser.userId,
        userName: currentUser.displayName,
        userRole: currentUser.role,
        actionType: ACTION_TYPES.PREVIEW,
        documentId: document.documentId,
        employeeId: document.employeeId,
        details: {
          documentType: document.documentType,
          year: document.year,
          period: document.period || null,
          employeeName: document.employeeName,
          status: 'success',
        },
      });
    }
  }, [docsLoading, empLoading, document, currentUser, logEvent]);

  /**
   * Handles navigating back to the employee 360 view.
   */
  const handleBackToEmployee = useCallback(() => {
    if (document && document.employeeId) {
      navigate(`/employee/${document.employeeId}`);
    } else {
      navigate('/search');
    }
  }, [document, navigate]);

  /**
   * Handles navigating back to search.
   */
  const handleBackToSearch = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  /**
   * Opens the confirmation modal for a fulfillment action.
   * @param {string} actionType - The action type (download, email)
   */
  const openConfirmationModal = useCallback((actionType) => {
    setModalAction(actionType);
    setModalOpen(true);
  }, []);

  /**
   * Handles the download action for the document.
   */
  const handleDownload = useCallback(() => {
    if (!document || document.status === 'missing') {
      return;
    }

    if (!hasPermission(PERMISSIONS.DOWNLOAD)) {
      if (currentUser) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DENIED,
          documentId: document.documentId,
          employeeId: document.employeeId,
          details: {
            documentType: document.documentType,
            year: document.year,
            employeeName: document.employeeName,
            status: 'denied',
            reason: 'Insufficient permissions',
          },
        });
      }
      return;
    }

    openConfirmationModal(ACTION_TYPES.DOWNLOAD);
  }, [document, hasPermission, currentUser, logEvent, openConfirmationModal]);

  /**
   * Handles the email action for the document.
   */
  const handleEmail = useCallback(() => {
    if (!document || document.status === 'missing') {
      return;
    }

    if (!hasPermission(PERMISSIONS.EMAIL)) {
      if (currentUser) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DENIED,
          documentId: document.documentId,
          employeeId: document.employeeId,
          details: {
            documentType: document.documentType,
            year: document.year,
            employeeName: document.employeeName,
            status: 'denied',
            reason: 'Insufficient permissions',
          },
        });
      }
      return;
    }

    openConfirmationModal(ACTION_TYPES.EMAIL);
  }, [document, hasPermission, currentUser, logEvent, openConfirmationModal]);

  /**
   * Handles confirming the modal action.
   */
  const handleConfirm = useCallback(() => {
    if (!modalAction || !currentUser || !document) {
      setModalOpen(false);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (modalAction === ACTION_TYPES.DOWNLOAD) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DOWNLOAD,
          documentId: document.documentId,
          employeeId: document.employeeId,
          details: {
            documentType: document.documentType,
            year: document.year,
            period: document.period || null,
            employeeName: document.employeeName,
            status: 'success',
          },
        });
      } else if (modalAction === ACTION_TYPES.EMAIL) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.EMAIL,
          documentId: document.documentId,
          employeeId: document.employeeId,
          details: {
            documentType: document.documentType,
            year: document.year,
            period: document.period || null,
            employeeName: document.employeeName,
            recipient: employee ? employee.email : null,
            status: 'success',
          },
        });
      }

      setIsProcessing(false);
      setModalOpen(false);
      setModalAction(null);
    }, 800);
  }, [modalAction, currentUser, document, employee, logEvent]);

  /**
   * Handles cancelling the modal action.
   */
  const handleCancel = useCallback(() => {
    setModalOpen(false);
    setModalAction(null);
  }, []);

  const loading = docsLoading || empLoading;
  const error = docsError || empError;

  if (loading) {
    return <LoadingSpinner message="Loading document preview…" size="lg" />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Error Loading Document"
        message={`An error occurred while loading the document: ${error}`}
        actionLabel="Go Back"
        onAction={handleBackToSearch}
      />
    );
  }

  if (!document) {
    return (
      <EmptyState
        variant="document"
        title="Document Not Found"
        message={`No document found with ID "${documentId}". Please check the ID and try again.`}
        actionLabel="Back to Search"
        onAction={handleBackToSearch}
      />
    );
  }

  if (document.status === 'missing') {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <button
            type="button"
            onClick={handleBackToEmployee}
            className="inline-flex items-center text-sm font-medium text-kelly-gray-600 hover:text-kelly-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Employee
          </button>
        </div>

        <EmptyState
          variant="document"
          title="Document Unavailable"
          message={`The ${document.documentType} for ${document.year}${document.period ? ` ${document.period}` : ''} is currently marked as missing for ${document.employeeName}. This may be due to an ingestion issue or a data exception.`}
          actionLabel="Back to Employee"
          onAction={handleBackToEmployee}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={handleBackToEmployee}
          className="inline-flex items-center text-sm font-medium text-kelly-gray-600 hover:text-kelly-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Employee
        </button>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kelly-gray-900">Document Preview</h1>
          <p className="mt-1 text-sm text-kelly-gray-500">
            {document.documentType} — {document.year}
            {document.period ? ` ${document.period}` : ''} — {document.employeeName}
          </p>
        </div>
        <StatusBadge status={document.status || 'Unknown'} size="md" dot />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mock PDF Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-kelly-gray-50 border-b border-kelly-gray-200">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-kelly-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm font-medium text-kelly-gray-700 truncate max-w-[300px]">
                  {document.fileName}
                </span>
              </div>
              <span className="text-xs text-kelly-gray-500">
                {document.fileSize || '—'}
              </span>
            </div>

            {/* Mock PDF Content */}
            <div className="flex items-center justify-center bg-kelly-gray-100 min-h-[500px] p-8">
              <div className="bg-white rounded-lg shadow-md w-full max-w-lg p-8 border border-kelly-gray-200">
                {/* Mock Document Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center w-14 h-14 bg-kelly-green/10 rounded-full mx-auto mb-4">
                    <svg className="w-7 h-7 text-kelly-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-kelly-gray-900">
                    {document.documentType}
                  </h2>
                  <p className="text-sm text-kelly-gray-500 mt-1">
                    Tax Year {document.year}
                    {document.period ? ` — ${document.period}` : ''}
                  </p>
                </div>

                {/* Mock Document Fields */}
                <div className="space-y-4 border-t border-kelly-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Employee Name
                    </span>
                    <span className="text-sm font-medium text-kelly-gray-900">
                      {document.employeeName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Kelly ID
                    </span>
                    <span className="text-sm font-mono text-kelly-gray-700">
                      {document.kellyId || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Tax ID
                    </span>
                    <span className="text-sm font-mono text-kelly-gray-600">
                      {document.maskedTaxId || '***-**-****'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Document Type
                    </span>
                    <span className="text-sm text-kelly-gray-700">
                      {document.documentType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Year
                    </span>
                    <span className="text-sm text-kelly-gray-700">
                      {document.year}
                    </span>
                  </div>
                  {document.period && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                        Period
                      </span>
                      <span className="text-sm text-kelly-gray-700">
                        {document.period}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mock Document Footer */}
                <div className="mt-8 pt-4 border-t border-kelly-gray-200 text-center">
                  <p className="text-xs text-kelly-gray-400">
                    This is a mock document preview for demonstration purposes.
                  </p>
                  <p className="text-xs text-kelly-gray-400 mt-1">
                    Kelly Services — Payroll Archive &amp; Fulfillment Hub
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Info Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Document Details Card */}
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-semibold text-kelly-gray-900 mb-4">Document Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Document ID
                </span>
                <span className="text-sm font-mono text-kelly-gray-700">
                  {document.documentId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Type
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-kelly-gray-100 text-kelly-gray-700">
                  {document.documentType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Year
                </span>
                <span className="text-sm font-medium text-kelly-gray-900">
                  {document.year}
                </span>
              </div>
              {document.period && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    Period
                  </span>
                  <span className="text-sm text-kelly-gray-700">
                    {document.period}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  File Name
                </span>
                <span className="text-sm text-kelly-gray-700 truncate max-w-[160px]" title={document.fileName}>
                  {document.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  File Size
                </span>
                <span className="text-sm text-kelly-gray-700">
                  {document.fileSize || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Created
                </span>
                <span className="text-sm text-kelly-gray-700">
                  {formatDateForDisplay(document.createdDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Status
                </span>
                <StatusBadge status={document.status || 'Unknown'} dot />
              </div>
            </div>
          </div>

          {/* Employee Details Card */}
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-semibold text-kelly-gray-900 mb-4">Employee Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Name
                </span>
                <span className="text-sm font-medium text-kelly-gray-900">
                  {document.employeeName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Kelly ID
                </span>
                <span className="text-sm font-mono text-kelly-gray-700">
                  {document.kellyId || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Tax ID
                </span>
                <MaskedField value={document.maskedTaxId} fieldType="maskedTaxId" allowReveal={true} />
              </div>
              {employee && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Email
                    </span>
                    <MaskedField value={employee.email} fieldType="email" allowReveal={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Department
                    </span>
                    <span className="text-sm text-kelly-gray-700">
                      {employee.department || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Location
                    </span>
                    <span className="text-sm text-kelly-gray-700">
                      {employee.location || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Status
                    </span>
                    <StatusBadge status={employee.status || 'Unknown'} dot />
                  </div>
                </>
              )}
            </div>
            {employee && (
              <div className="mt-4 pt-3 border-t border-kelly-gray-100">
                <button
                  type="button"
                  onClick={handleBackToEmployee}
                  className="text-sm font-medium text-kelly-green hover:text-kelly-dark transition-colors"
                >
                  View All Documents →
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-semibold text-kelly-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              {/* Download Button */}
              {hasPermission(PERMISSIONS.DOWNLOAD) ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={document.status === 'missing'}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
                  </svg>
                  Download
                </button>
              ) : (
                <div className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-kelly-gray-400 bg-kelly-gray-100 cursor-not-allowed">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Download (No Permission)
                </div>
              )}

              {/* Email Button */}
              {hasPermission(PERMISSIONS.EMAIL) ? (
                <button
                  type="button"
                  onClick={handleEmail}
                  disabled={document.status === 'missing'}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-kelly-green hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email to Employee
                </button>
              ) : (
                <div className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-kelly-gray-400 bg-kelly-gray-100 cursor-not-allowed">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Email (No Permission)
                </div>
              )}
            </div>

            {/* Audit Notice */}
            <p className="mt-4 text-xs text-kelly-gray-500 flex items-center space-x-1">
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
              <span>All actions are recorded in the audit log.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalAction && (
        <ConfirmationModal
          isOpen={modalOpen}
          actionType={modalAction}
          document={document}
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

export default DocumentPreview;