import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../shared/StatusBadge';
import { maskFieldValue, isSensitiveField } from '../../utils/maskingUtils';

/**
 * Formats message text with basic markdown-like rendering.
 * Handles bold (**text**), bullet points (•), and newlines.
 * @param {string} text - The message text to format
 * @returns {React.ReactNode} The formatted message content
 */
function formatMessageText(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    const parts = [];
    let remaining = line;
    let partIndex = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const beforeBold = remaining.substring(0, boldMatch.index);
        if (beforeBold) {
          parts.push(
            <span key={`${lineIndex}-${partIndex}`}>{beforeBold}</span>
          );
          partIndex++;
        }
        parts.push(
          <strong key={`${lineIndex}-${partIndex}`} className="font-semibold">
            {boldMatch[1]}
          </strong>
        );
        partIndex++;
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(
          <span key={`${lineIndex}-${partIndex}`}>{remaining}</span>
        );
        remaining = '';
        partIndex++;
      }
    }

    return (
      <span key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
}

/**
 * Masks a value if it corresponds to a sensitive PII field type.
 * @param {string} fieldType - The field type identifier
 * @param {string} value - The raw value
 * @returns {string} The masked or original value
 */
function maskIfSensitive(fieldType, value) {
  if (!value || typeof value !== 'string') {
    return value || '—';
  }

  if (isSensitiveField(fieldType)) {
    return maskFieldValue(fieldType, value);
  }

  return value;
}

/**
 * Individual chat message component for the assistant panel.
 * Renders user messages (right-aligned) and assistant messages (left-aligned)
 * with appropriate styling. Supports text, document result cards, employee
 * result cards, clarification options via suggested actions, and confirmation
 * buttons. Masks PII in all displayed data.
 *
 * Implements:
 *   - SCRUM-259: Natural Language Retrieval via Assistant
 *
 * @param {Object} props
 * @param {Object} props.message - The message object to render
 * @param {string} props.message.id - Unique message identifier
 * @param {'user'|'assistant'} props.message.role - Who sent the message
 * @param {string} props.message.text - The message text content
 * @param {string} [props.message.timestamp] - ISO 8601 timestamp
 * @param {string[]} [props.message.suggestedActions] - Optional suggested follow-up actions
 * @param {Object[]} [props.message.employees] - Optional employee results attached to message
 * @param {Object[]} [props.message.documents] - Optional document results attached to message
 * @param {Function} [props.onSuggestedAction] - Callback when a suggested action button is clicked
 * @param {string} [props.className] - Optional additional CSS classes for the container
 */
export function AssistantMessage({
  message,
  onSuggestedAction,
  className,
}) {
  /**
   * Handles clicking a suggested action button.
   * @param {string} action - The suggested action text
   */
  const handleSuggestedAction = useCallback(
    (action) => {
      if (onSuggestedAction) {
        onSuggestedAction(action);
      }
    },
    [onSuggestedAction]
  );

  if (!message || typeof message !== 'object') {
    return null;
  }

  const isUser = message.role === 'user';
  const hasEmployees = message.employees && Array.isArray(message.employees) && message.employees.length > 0;
  const hasDocuments = message.documents && Array.isArray(message.documents) && message.documents.length > 0;
  const hasSuggestedActions = message.suggestedActions && Array.isArray(message.suggestedActions) && message.suggestedActions.length > 0;

  /**
   * Formats the timestamp for display.
   * @returns {string} The formatted time string
   */
  function getFormattedTime() {
    if (!message.timestamp) {
      return '';
    }

    try {
      return new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  }

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className || ''}`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
          isUser
            ? 'bg-kelly-green text-white rounded-br-sm'
            : 'bg-kelly-gray-100 text-kelly-gray-900 rounded-bl-sm'
        }`}
      >
        {/* Message Text */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {formatMessageText(message.text)}
        </div>

        {/* Employee Results */}
        {hasEmployees && (
          <div className="mt-2 space-y-1.5">
            {message.employees.map((emp) => (
              <div
                key={emp.employeeId || emp.kellyId}
                className="bg-white border border-kelly-gray-200 rounded-md p-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-kelly-gray-900">
                    {emp.name || '—'}
                  </span>
                  <span className="font-mono text-kelly-gray-500">
                    {emp.kellyId || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-kelly-gray-500">
                    {emp.department || '—'}
                  </span>
                  <span className="text-kelly-gray-500">
                    {emp.location || '—'}
                  </span>
                </div>
                {emp.maskedTaxId && (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-kelly-gray-400">Tax ID</span>
                    <span className="font-mono text-kelly-gray-500">
                      {maskIfSensitive('maskedTaxId', emp.maskedTaxId)}
                    </span>
                  </div>
                )}
                {emp.email && (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-kelly-gray-400">Email</span>
                    <span className="text-kelly-gray-500">
                      {maskIfSensitive('email', emp.email)}
                    </span>
                  </div>
                )}
                {emp.status && (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-kelly-gray-400">Status</span>
                    <StatusBadge status={emp.status} dot />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Document Results */}
        {hasDocuments && (
          <div className="mt-2 space-y-1.5">
            {message.documents.slice(0, 10).map((doc) => (
              <div
                key={doc.documentId}
                className="bg-white border border-kelly-gray-200 rounded-md p-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-kelly-gray-900">
                    {doc.documentType || '—'} {doc.year || ''}
                    {doc.period ? ` ${doc.period}` : ''}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      doc.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {doc.status === 'available' ? 'Available' : 'Missing'}
                  </span>
                </div>
                <div className="text-kelly-gray-500 truncate mt-0.5">
                  {doc.fileName || '—'}
                </div>
                {doc.maskedTaxId && (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-kelly-gray-400">Tax ID</span>
                    <span className="font-mono text-kelly-gray-500">
                      {maskIfSensitive('maskedTaxId', doc.maskedTaxId)}
                    </span>
                  </div>
                )}
                {doc.fileSize && (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-kelly-gray-400">Size</span>
                    <span className="text-kelly-gray-500">{doc.fileSize}</span>
                  </div>
                )}
              </div>
            ))}
            {message.documents.length > 10 && (
              <p className="text-xs text-kelly-gray-500 text-center">
                …and {message.documents.length - 10} more document(s)
              </p>
            )}
          </div>
        )}

        {/* Suggested Actions */}
        {hasSuggestedActions && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.suggestedActions.map((action, actionIndex) => (
              <button
                key={`${message.id}-action-${actionIndex}`}
                type="button"
                onClick={() => handleSuggestedAction(action)}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-white border border-kelly-gray-300 text-kelly-gray-700 hover:bg-kelly-gray-50 hover:border-kelly-green hover:text-kelly-green focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`mt-1.5 text-[10px] ${
            isUser ? 'text-white/60' : 'text-kelly-gray-400'
          }`}
        >
          {getFormattedTime()}
        </div>
      </div>
    </div>
  );
}

AssistantMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    text: PropTypes.string,
    timestamp: PropTypes.string,
    suggestedActions: PropTypes.arrayOf(PropTypes.string),
    employees: PropTypes.arrayOf(
      PropTypes.shape({
        employeeId: PropTypes.string,
        kellyId: PropTypes.string,
        name: PropTypes.string,
        maskedTaxId: PropTypes.string,
        email: PropTypes.string,
        department: PropTypes.string,
        location: PropTypes.string,
        status: PropTypes.string,
      })
    ),
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        documentId: PropTypes.string,
        documentType: PropTypes.string,
        year: PropTypes.string,
        period: PropTypes.string,
        fileName: PropTypes.string,
        fileSize: PropTypes.string,
        status: PropTypes.string,
        maskedTaxId: PropTypes.string,
        employeeName: PropTypes.string,
      })
    ),
  }).isRequired,
  onSuggestedAction: PropTypes.func,
  className: PropTypes.string,
};

AssistantMessage.defaultProps = {
  onSuggestedAction: undefined,
  className: undefined,
};

export default AssistantMessage;