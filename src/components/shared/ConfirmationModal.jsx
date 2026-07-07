import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { ACTION_TYPES } from '../../utils/constants';

/**
 * Reusable confirmation modal dialog for fulfillment actions.
 * Displays action summary, document details, and recipient info.
 * Prevents action without explicit confirmation (FR-013).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {string} props.actionType - The fulfillment action type (download, email, package)
 * @param {string} [props.title] - Optional custom title for the modal
 * @param {string} [props.message] - Optional custom message/prompt text
 * @param {Object} [props.document] - The document involved in the action
 * @param {Object[]} [props.documents] - Multiple documents (for package actions)
 * @param {Object} [props.employee] - The employee involved in the action
 * @param {string} [props.recipientEmail] - Recipient email for email actions
 * @param {boolean} [props.isProcessing] - Whether the action is currently being processed
 * @param {Function} props.onConfirm - Callback when the user confirms the action
 * @param {Function} props.onCancel - Callback when the user cancels the action
 */
export function ConfirmationModal({
  isOpen,
  actionType,
  title,
  message,
  document: doc,
  documents,
  employee,
  recipientEmail,
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const previousActiveElement = useRef(null);

  /**
   * Trap focus inside the modal and handle Escape key.
   */
  useEffect(() => {
    if (!isOpen) {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
      return;
    }

    previousActiveElement.current = window.document.activeElement;

    const timer = setTimeout(() => {
      if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      }
    }, 50);

    /**
     * Handles keydown events for Escape key.
     * @param {KeyboardEvent} e
     */
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    }

    window.document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isProcessing, onCancel]);

  /**
   * Handles clicking the overlay backdrop.
   * @param {React.MouseEvent} e
   */
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && !isProcessing) {
        onCancel();
      }
    },
    [isProcessing, onCancel]
  );

  /**
   * Handles the confirm button click.
   */
  const handleConfirm = useCallback(() => {
    if (!isProcessing) {
      onConfirm();
    }
  }, [isProcessing, onConfirm]);

  /**
   * Handles the cancel button click.
   */
  const handleCancel = useCallback(() => {
    if (!isProcessing) {
      onCancel();
    }
  }, [isProcessing, onCancel]);

  if (!isOpen) {
    return null;
  }

  /**
   * Returns the default title based on action type.
   * @returns {string}
   */
  function getDefaultTitle() {
    switch (actionType) {
      case ACTION_TYPES.DOWNLOAD:
        return 'Confirm Download';
      case ACTION_TYPES.EMAIL:
        return 'Confirm Email';
      case ACTION_TYPES.PACKAGE:
        return 'Confirm Package';
      default:
        return 'Confirm Action';
    }
  }

  /**
   * Returns the icon SVG path based on action type.
   * @returns {string}
   */
  function getActionIcon() {
    switch (actionType) {
      case ACTION_TYPES.DOWNLOAD:
        return 'M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3';
      case ACTION_TYPES.EMAIL:
        return 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
      case ACTION_TYPES.PACKAGE:
        return 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
      default:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  /**
   * Returns the icon background color class based on action type.
   * @returns {string}
   */
  function getIconColorClass() {
    switch (actionType) {
      case ACTION_TYPES.DOWNLOAD:
        return 'bg-blue-100 text-blue-600';
      case ACTION_TYPES.EMAIL:
        return 'bg-kelly-green/10 text-kelly-green';
      case ACTION_TYPES.PACKAGE:
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-kelly-gray-100 text-kelly-gray-600';
    }
  }

  /**
   * Returns the confirm button color classes based on action type.
   * @returns {string}
   */
  function getConfirmButtonClass() {
    const base = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2';
    if (isProcessing) {
      return `${base} bg-kelly-gray-400 cursor-not-allowed`;
    }
    switch (actionType) {
      case ACTION_TYPES.DOWNLOAD:
        return `${base} bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600`;
      case ACTION_TYPES.EMAIL:
        return `${base} bg-kelly-green hover:bg-kelly-dark focus-visible:outline-kelly-green`;
      case ACTION_TYPES.PACKAGE:
        return `${base} bg-purple-600 hover:bg-purple-700 focus-visible:outline-purple-600`;
      default:
        return `${base} bg-kelly-green hover:bg-kelly-dark focus-visible:outline-kelly-green`;
    }
  }

  const displayTitle = title || getDefaultTitle();

  const docList = documents && documents.length > 0 ? documents : doc ? [doc] : [];
  const documentCount = docList.length;

  const resolvedRecipient = recipientEmail || (employee ? employee.email : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconColorClass()}`}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={getActionIcon()} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirmation-modal-title"
                className="text-lg font-semibold text-kelly-gray-900"
              >
                {displayTitle}
              </h3>
              {message && (
                <p className="mt-1 text-sm text-kelly-gray-600">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pb-4">
          <div className="bg-kelly-gray-50 rounded-md p-4 space-y-3">
            {/* Employee info */}
            {employee && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Employee
                </span>
                <span className="text-sm font-medium text-kelly-gray-900">
                  {employee.name || 'Unknown'}
                </span>
              </div>
            )}

            {employee && employee.kellyId && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Kelly ID
                </span>
                <span className="text-sm text-kelly-gray-700">
                  {employee.kellyId}
                </span>
              </div>
            )}

            {/* Document info */}
            {documentCount === 1 && docList[0] && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    Document
                  </span>
                  <span className="text-sm text-kelly-gray-700">
                    {docList[0].documentType} {docList[0].year}
                    {docList[0].period ? ` ${docList[0].period}` : ''}
                  </span>
                </div>
                {docList[0].fileName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      File
                    </span>
                    <span className="text-sm text-kelly-gray-700 truncate max-w-[200px]">
                      {docList[0].fileName}
                    </span>
                  </div>
                )}
                {docList[0].fileSize && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                      Size
                    </span>
                    <span className="text-sm text-kelly-gray-700">
                      {docList[0].fileSize}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Multiple documents (package) */}
            {documentCount > 1 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                    Documents
                  </span>
                  <span className="text-sm font-medium text-kelly-gray-900">
                    {documentCount} file(s)
                  </span>
                </div>
                <div className="border-t border-kelly-gray-200 pt-2">
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {docList.map((d) => (
                      <li
                        key={d.documentId || `${d.documentType}-${d.year}-${d.period || ''}`}
                        className="text-xs text-kelly-gray-600 flex items-center space-x-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-kelly-gray-400 flex-shrink-0" />
                        <span>
                          {d.documentType} {d.year}
                          {d.period ? ` ${d.period}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Recipient for email */}
            {actionType === ACTION_TYPES.EMAIL && resolvedRecipient && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                  Recipient
                </span>
                <span className="text-sm text-kelly-gray-700">
                  {resolvedRecipient}
                </span>
              </div>
            )}

            {/* Action type */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
                Action
              </span>
              <span className="text-sm font-medium text-kelly-gray-900 capitalize">
                {actionType || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Audit notice */}
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
            <span>This action will be recorded in the audit log.</span>
          </p>
        </div>

        {/* Footer / Buttons */}
        <div className="px-6 py-4 bg-kelly-gray-50 border-t border-kelly-gray-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-kelly-gray-700 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={getConfirmButtonClass()}
          >
            {isProcessing ? (
              <span className="flex items-center space-x-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing…</span>
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  actionType: PropTypes.oneOf([
    ACTION_TYPES.DOWNLOAD,
    ACTION_TYPES.EMAIL,
    ACTION_TYPES.PACKAGE,
    ACTION_TYPES.PREVIEW,
  ]).isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  document: PropTypes.shape({
    documentId: PropTypes.string,
    documentType: PropTypes.string,
    year: PropTypes.string,
    period: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.string,
    status: PropTypes.string,
  }),
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.string,
      documentType: PropTypes.string,
      year: PropTypes.string,
      period: PropTypes.string,
      fileName: PropTypes.string,
      fileSize: PropTypes.string,
      status: PropTypes.string,
    })
  ),
  employee: PropTypes.shape({
    employeeId: PropTypes.string,
    kellyId: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  recipientEmail: PropTypes.string,
  isProcessing: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

ConfirmationModal.defaultProps = {
  title: undefined,
  message: undefined,
  document: undefined,
  documents: undefined,
  employee: undefined,
  recipientEmail: undefined,
  isProcessing: false,
};

export default ConfirmationModal;