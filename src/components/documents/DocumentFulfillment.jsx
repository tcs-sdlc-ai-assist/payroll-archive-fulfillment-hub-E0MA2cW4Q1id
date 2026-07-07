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
} from '../../utils/constants';

/**
 * Document fulfillment component handling download, email, and package actions.
 * Renders ConfirmationModal before executing any action. Download simulates
 * file save (mocked). Email shows recipient confirmation with employee email.
 * Package allows multi-document selection and bundling (mocked). All actions
 * log to audit via useAudit(). Checks permissions via useRBAC().
 *
 * Implements:
 *   - SCRUM-252: Download Document
 *   - SCRUM-253: Email Document to Employee
 *   - SCRUM-257: Package Multiple Documents
 *
 * @param {Object} props
 * @param {Object} [props.document] - A single document for download/email actions
 * @param {Object[]} [props.documents] - Multiple documents for package actions
 * @param {Object} [props.employee] - The employee associated with the document(s)
 * @param {Function} [props.onComplete] - Optional callback invoked after a successful action
 * @param {Function} [props.onCancel] - Optional callback invoked when the user cancels
 * @param {string} [props.className] - Optional additional CSS classes for the container
 */
export function DocumentFulfillment({
  document: doc,
  documents,
  employee,
  onComplete,
  onCancel,
  className,
}) {
  const { currentUser, hasPermission } = useRBAC();
  const { logEvent } = useAudit();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);

  /**
   * All available documents for package selection.
   * Combines single document and documents array, filtering to available only.
   * @type {Object[]}
   */
  const availableDocuments = useMemo(() => {
    const allDocs = [];

    if (documents && Array.isArray(documents) && documents.length > 0) {
      allDocs.push(...documents);
    } else if (doc) {
      allDocs.push(doc);
    }

    return allDocs.filter((d) => d && d.status === 'available');
  }, [doc, documents]);

  /**
   * The recipient email for email actions.
   * @type {string|null}
   */
  const recipientEmail = useMemo(() => {
    return employee ? employee.email : null;
  }, [employee]);

  /**
   * Toggles a document in the selected documents list for packaging.
   * @param {Object} document - The document to toggle
   */
  const handleToggleDocSelection = useCallback((document) => {
    setSelectedDocs((prev) => {
      const exists = prev.some(
        (d) => d.documentId === document.documentId
      );
      if (exists) {
        return prev.filter((d) => d.documentId !== document.documentId);
      }
      return [...prev, document];
    });
  }, []);

  /**
   * Selects all available documents for packaging.
   */
  const handleSelectAll = useCallback(() => {
    const allSelected = availableDocuments.every((d) =>
      selectedDocs.some((s) => s.documentId === d.documentId)
    );

    if (allSelected) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs([...availableDocuments]);
    }
  }, [availableDocuments, selectedDocs]);

  /**
   * Opens the confirmation modal for a specific action.
   * @param {string} actionType - The action type (download, email, package)
   */
  const openModal = useCallback(
    (actionType) => {
      if (actionType === ACTION_TYPES.DOWNLOAD || actionType === ACTION_TYPES.EMAIL) {
        if (!doc || doc.status === 'missing') {
          return;
        }
      }

      if (actionType === ACTION_TYPES.PACKAGE) {
        const docsToPackage = selectedDocs.length > 0 ? selectedDocs : availableDocuments;
        if (docsToPackage.length === 0) {
          return;
        }
      }

      const permissionMap = {
        [ACTION_TYPES.DOWNLOAD]: PERMISSIONS.DOWNLOAD,
        [ACTION_TYPES.EMAIL]: PERMISSIONS.EMAIL,
        [ACTION_TYPES.PACKAGE]: PERMISSIONS.PACKAGE,
      };

      const requiredPermission = permissionMap[actionType];

      if (requiredPermission && !hasPermission(requiredPermission)) {
        if (currentUser) {
          logEvent({
            userId: currentUser.userId,
            userName: currentUser.displayName,
            userRole: currentUser.role,
            actionType: ACTION_TYPES.DENIED,
            documentId: doc ? doc.documentId : null,
            employeeId: employee ? employee.employeeId : null,
            details: {
              documentType: doc ? doc.documentType : null,
              year: doc ? doc.year : null,
              employeeName: employee ? employee.name : null,
              status: 'denied',
              reason: `Insufficient permissions for ${actionType}`,
            },
          });
        }

        setLastResult({
          success: false,
          action: actionType,
          message: `Access denied. Your role (${currentUser ? currentUser.role : 'Unknown'}) does not have permission to ${actionType} documents.`,
        });
        return;
      }

      setModalAction(actionType);
      setModalOpen(true);
    },
    [doc, selectedDocs, availableDocuments, hasPermission, currentUser, logEvent, employee]
  );

  /**
   * Handles the download action button click.
   */
  const handleDownload = useCallback(() => {
    openModal(ACTION_TYPES.DOWNLOAD);
  }, [openModal]);

  /**
   * Handles the email action button click.
   */
  const handleEmail = useCallback(() => {
    openModal(ACTION_TYPES.EMAIL);
  }, [openModal]);

  /**
   * Handles the package action button click.
   */
  const handlePackage = useCallback(() => {
    openModal(ACTION_TYPES.PACKAGE);
  }, [openModal]);

  /**
   * Handles confirming the modal action.
   * Logs the audit event and simulates the fulfillment action.
   */
  const handleConfirm = useCallback(() => {
    if (!modalAction || !currentUser) {
      setModalOpen(false);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (modalAction === ACTION_TYPES.DOWNLOAD && doc) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DOWNLOAD,
          documentId: doc.documentId,
          employeeId: doc.employeeId,
          details: {
            documentType: doc.documentType,
            year: doc.year,
            period: doc.period || null,
            employeeName: doc.employeeName,
            fileName: doc.fileName,
            status: 'success',
          },
        });

        setLastResult({
          success: true,
          action: ACTION_TYPES.DOWNLOAD,
          message: `Download initiated for ${doc.fileName}. The audit log has been updated.`,
        });
      } else if (modalAction === ACTION_TYPES.EMAIL && doc) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.EMAIL,
          documentId: doc.documentId,
          employeeId: doc.employeeId,
          details: {
            documentType: doc.documentType,
            year: doc.year,
            period: doc.period || null,
            employeeName: doc.employeeName,
            fileName: doc.fileName,
            recipient: recipientEmail,
            status: 'success',
          },
        });

        setLastResult({
          success: true,
          action: ACTION_TYPES.EMAIL,
          message: `Email sent successfully. ${doc.fileName} has been delivered to ${recipientEmail || 'the employee'}. The audit log has been updated.`,
        });
      } else if (modalAction === ACTION_TYPES.PACKAGE) {
        const docsToPackage = selectedDocs.length > 0 ? selectedDocs : availableDocuments;
        const years = [...new Set(docsToPackage.map((d) => d.year))].sort();

        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.PACKAGE,
          documentId: null,
          employeeId: employee ? employee.employeeId : (docsToPackage[0] ? docsToPackage[0].employeeId : null),
          details: {
            documentType: docsToPackage[0] ? docsToPackage[0].documentType : 'Mixed',
            years,
            employeeName: employee ? employee.name : (docsToPackage[0] ? docsToPackage[0].employeeName : 'Unknown'),
            status: 'success',
            documentCount: docsToPackage.length,
          },
        });

        setLastResult({
          success: true,
          action: ACTION_TYPES.PACKAGE,
          message: `Document package created successfully with ${docsToPackage.length} document(s). The audit log has been updated.`,
        });

        setSelectedDocs([]);
      }

      setIsProcessing(false);
      setModalOpen(false);
      setModalAction(null);

      if (onComplete) {
        onComplete(modalAction);
      }
    }, 800);
  }, [modalAction, currentUser, doc, employee, recipientEmail, selectedDocs, availableDocuments, logEvent, onComplete]);

  /**
   * Handles cancelling the modal action.
   */
  const handleCancel = useCallback(() => {
    setModalOpen(false);
    setModalAction(null);

    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  /**
   * Clears the last result message.
   */
  const handleDismissResult = useCallback(() => {
    setLastResult(null);
  }, []);

  const canDownload = hasPermission(PERMISSIONS.DOWNLOAD);
  const canEmail = hasPermission(PERMISSIONS.EMAIL);
  const canPackage = hasPermission(PERMISSIONS.PACKAGE);

  const hasSingleDoc = doc && typeof doc === 'object';
  const hasMultipleDocs = availableDocuments.length > 0;
  const isDocMissing = hasSingleDoc && doc.status === 'missing';

  if (!hasSingleDoc && !hasMultipleDocs) {
    return (
      <EmptyState
        variant="document"
        title="No Documents Selected"
        message="Please select a document to perform fulfillment actions such as download, email, or package."
      />
    );
  }

  /**
   * Returns the documents to use for the package modal.
   * @returns {Object[]}
   */
  function getPackageDocs() {
    return selectedDocs.length > 0 ? selectedDocs : availableDocuments;
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Last Result Banner */}
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
                {lastResult.success ? 'Success' : 'Action Denied'}
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

      {/* Single Document Actions */}
      {hasSingleDoc && (
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-kelly-gray-900 mb-4">Document Actions</h3>

          {/* Document Info */}
          <div className="bg-kelly-gray-50 rounded-md p-3 mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Document
                </span>
                <span className="text-sm font-medium text-kelly-gray-900">
                  {doc.documentType} {doc.year}
                  {doc.period ? ` ${doc.period}` : ''}
                </span>
              </div>
              {doc.fileName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    File
                  </span>
                  <span className="text-sm text-kelly-gray-700 truncate max-w-[200px]">
                    {doc.fileName}
                  </span>
                </div>
              )}
              {doc.fileSize && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    Size
                  </span>
                  <span className="text-sm text-kelly-gray-700">{doc.fileSize}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Status
                </span>
                <StatusBadge status={doc.status || 'Unknown'} dot />
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

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Download Button */}
            {canDownload ? (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDocMissing}
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
            {canEmail ? (
              <button
                type="button"
                onClick={handleEmail}
                disabled={isDocMissing}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-kelly-green hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email to Employee
                {recipientEmail && (
                  <span className="ml-1 text-xs opacity-75">({recipientEmail})</span>
                )}
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

          {isDocMissing && (
            <p className="mt-3 text-xs text-red-500 flex items-center space-x-1">
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
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span>This document is currently marked as missing and cannot be fulfilled.</span>
            </p>
          )}

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
            <span>All actions are recorded in the audit log.</span>
          </p>
        </div>
      )}

      {/* Package Documents Section */}
      {hasMultipleDocs && canPackage && (
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-kelly-gray-900">Package Documents</h3>
            <span className="text-xs text-kelly-gray-500">
              {availableDocuments.length} available document{availableDocuments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-kelly-gray-100">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  availableDocuments.length > 0 &&
                  availableDocuments.every((d) =>
                    selectedDocs.some((s) => s.documentId === d.documentId)
                  )
                }
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-kelly-gray-300 text-kelly-green focus:ring-kelly-green cursor-pointer"
                aria-label="Select all documents"
              />
              <span className="text-sm font-medium text-kelly-gray-700">Select All</span>
            </label>
            <span className="text-xs text-kelly-gray-500">
              {selectedDocs.length} selected
            </span>
          </div>

          {/* Document List */}
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {availableDocuments.map((d) => {
              const isSelected = selectedDocs.some(
                (s) => s.documentId === d.documentId
              );

              return (
                <label
                  key={d.documentId}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-kelly-green/5 border border-kelly-green/20'
                      : 'hover:bg-kelly-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleDocSelection(d)}
                      className="h-4 w-4 rounded border-kelly-gray-300 text-kelly-green focus:ring-kelly-green cursor-pointer flex-shrink-0"
                      aria-label={`Select ${d.documentType} ${d.year}${d.period ? ` ${d.period}` : ''}`}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-kelly-gray-900 block truncate">
                        {d.documentType} {d.year}
                        {d.period ? ` ${d.period}` : ''}
                      </span>
                      <span className="text-xs text-kelly-gray-500 block truncate">
                        {d.fileName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    {d.fileSize && (
                      <span className="text-xs text-kelly-gray-400">{d.fileSize}</span>
                    )}
                    <StatusBadge status={d.status || 'Unknown'} dot />
                  </div>
                </label>
              );
            })}
          </div>

          {/* Package Button */}
          <button
            type="button"
            onClick={handlePackage}
            disabled={selectedDocs.length === 0 && availableDocuments.length === 0}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Package {selectedDocs.length > 0 ? `Selected (${selectedDocs.length})` : `All (${availableDocuments.length})`}
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
            <span>Packaging will be recorded in the audit log.</span>
          </p>
        </div>
      )}

      {/* Package No Permission Notice */}
      {hasMultipleDocs && !canPackage && (
        <div className="bg-white border border-kelly-gray-200 rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-kelly-gray-900 mb-3">Package Documents</h3>
          <div className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-kelly-gray-400 bg-kelly-gray-100 cursor-not-allowed">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Package (No Permission)
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalAction && (
        <ConfirmationModal
          isOpen={modalOpen}
          actionType={modalAction}
          document={modalAction !== ACTION_TYPES.PACKAGE ? doc : undefined}
          documents={modalAction === ACTION_TYPES.PACKAGE ? getPackageDocs() : undefined}
          employee={employee}
          recipientEmail={recipientEmail || undefined}
          isProcessing={isProcessing}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

DocumentFulfillment.propTypes = {
  document: PropTypes.shape({
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
  }),
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
  ),
  employee: PropTypes.shape({
    employeeId: PropTypes.string,
    kellyId: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    location: PropTypes.string,
    status: PropTypes.string,
  }),
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
  className: PropTypes.string,
};

DocumentFulfillment.defaultProps = {
  document: undefined,
  documents: undefined,
  employee: undefined,
  onComplete: undefined,
  onCancel: undefined,
  className: undefined,
};

export default DocumentFulfillment;