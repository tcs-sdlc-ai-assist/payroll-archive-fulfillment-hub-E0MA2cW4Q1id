import { useState, useCallback, useRef, useEffect } from 'react';
import { useAssistant } from '../../contexts/AssistantContext';

/**
 * Floating conversational assistant panel (slide-in from right).
 * Displays chat message history, input field, and send button.
 * Shows assistant responses with masked PII. Handles clarification
 * prompts for ambiguous queries. Shows confirmation prompts before
 * fulfillment actions. Uses useAssistant() context for state.
 * Toggle button is always visible in bottom-right corner.
 *
 * Implements:
 *   - SCRUM-259: Natural Language Retrieval via Assistant
 *   - SCRUM-255: Search Employee
 *   - SCRUM-254: Find Historical Documents
 */
export function AssistantPanel() {
  const {
    messages,
    isOpen,
    pendingAction,
    sendMessage,
    toggleAssistant,
    confirmAction,
    cancelAction,
  } = useAssistant();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Scrolls the message list to the bottom when new messages arrive.
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Focuses the input field when the panel opens.
   */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /**
   * Handles the input field change event.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  /**
   * Handles the form submission to send a message.
   * @param {React.FormEvent} e
   */
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) {
        return;
      }
      sendMessage(trimmed);
      setInputValue('');
    },
    [inputValue, sendMessage]
  );

  /**
   * Handles clicking a suggested action button.
   * @param {string} action - The suggested action text
   */
  const handleSuggestedAction = useCallback(
    (action) => {
      sendMessage(action);
    },
    [sendMessage]
  );

  /**
   * Handles the confirm button click for pending actions.
   */
  const handleConfirm = useCallback(() => {
    sendMessage('yes');
  }, [sendMessage]);

  /**
   * Handles the cancel button click for pending actions.
   */
  const handleCancel = useCallback(() => {
    sendMessage('cancel');
  }, [sendMessage]);

  /**
   * Handles keydown events in the input field.
   * @param {React.KeyboardEvent<HTMLInputElement>} e
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

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

  return (
    <>
      {/* Toggle Button — always visible in bottom-right corner */}
      <button
        type="button"
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center w-14 h-14 rounded-full bg-kelly-green text-white shadow-lg hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-all"
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        title={isOpen ? 'Close Assistant' : 'Open Assistant'}
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={toggleAssistant}
          aria-hidden="true"
        />
      )}

      {/* Assistant Panel — slide-in from right */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-full sm:w-96 bg-white border-l border-kelly-gray-200 shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="complementary"
        aria-label="Payroll Archive Assistant"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-kelly-green text-white border-b border-kelly-green/80 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">Payroll Archive Assistant</h2>
              <p className="text-xs text-white/70 leading-tight">Ask me anything</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleAssistant}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            aria-label="Close assistant"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="flex items-center justify-center w-14 h-14 bg-kelly-green/10 rounded-full mb-4">
                <svg
                  className="w-7 h-7 text-kelly-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-kelly-gray-900 mb-1">
                Payroll Archive Assistant
              </h3>
              <p className="text-xs text-kelly-gray-500">
                Ask me to search for employees, find documents, or fulfill requests.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-kelly-green text-white rounded-br-sm'
                    : 'bg-kelly-gray-100 text-kelly-gray-900 rounded-bl-sm'
                }`}
              >
                {/* Message Text */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {formatMessageText(message.text)}
                </div>

                {/* Employee Results */}
                {message.employees && Array.isArray(message.employees) && message.employees.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {message.employees.map((emp) => (
                      <div
                        key={emp.employeeId || emp.kellyId}
                        className="bg-white border border-kelly-gray-200 rounded-md p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-kelly-gray-900">{emp.name}</span>
                          <span className="font-mono text-kelly-gray-500">{emp.kellyId}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-kelly-gray-500">{emp.department}</span>
                          <span className="text-kelly-gray-500">{emp.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Document Results */}
                {message.documents && Array.isArray(message.documents) && message.documents.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {message.documents.slice(0, 10).map((doc) => (
                      <div
                        key={doc.documentId}
                        className="bg-white border border-kelly-gray-200 rounded-md p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-kelly-gray-900">
                            {doc.documentType} {doc.year}
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
                          {doc.fileName}
                        </div>
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
                {message.suggestedActions && Array.isArray(message.suggestedActions) && message.suggestedActions.length > 0 && (
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
                    message.role === 'user' ? 'text-white/60' : 'text-kelly-gray-400'
                  }`}
                >
                  {message.timestamp
                    ? new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : ''}
                </div>
              </div>
            </div>
          ))}

          {/* Pending Action Confirmation Buttons */}
          {pendingAction && (
            <div className="flex items-center justify-center space-x-2 py-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-kelly-green hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                Confirm
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-kelly-gray-700 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-kelly-gray-200 px-4 py-3 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              className="flex-1 block rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm placeholder:text-kelly-gray-400 focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
              aria-label="Assistant message input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-kelly-green text-white hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
          <p className="mt-1.5 text-[10px] text-kelly-gray-400 text-center">
            All actions are recorded in the audit log.
          </p>
        </div>
      </div>
    </>
  );
}

export default AssistantPanel;