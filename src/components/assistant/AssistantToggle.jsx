import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAssistant } from '../../contexts/AssistantContext';

/**
 * Floating action button (FAB) in the bottom-right corner to toggle
 * the assistant panel open/closed. Shows a chat icon with Kelly green
 * background. Displays unread message indicator badge when assistant
 * has new responses.
 *
 * Implements:
 *   - SCRUM-259: Natural Language Retrieval via Assistant
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional additional CSS classes for the button
 */
export function AssistantToggle({ className }) {
  const { messages, isOpen, toggleAssistant } = useAssistant();

  /**
   * Counts unread assistant messages.
   * Considers messages unread if the panel is closed and there are
   * assistant messages after the last user message.
   * @type {number}
   */
  const unreadCount = useMemo(() => {
    if (isOpen) {
      return 0;
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return 0;
    }

    let count = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        count++;
      } else {
        break;
      }
    }

    return count;
  }, [messages, isOpen]);

  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      onClick={toggleAssistant}
      className={`fixed bottom-6 right-6 z-50 inline-flex items-center justify-center w-14 h-14 rounded-full bg-kelly-green text-white shadow-lg hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-all ${className || ''}`}
      aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      title={isOpen ? 'Close Assistant' : 'Open Assistant'}
    >
      {/* Unread Badge */}
      {hasUnread && (
        <span
          className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-white"
          aria-label={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Icon */}
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
  );
}

AssistantToggle.propTypes = {
  className: PropTypes.string,
};

AssistantToggle.defaultProps = {
  className: undefined,
};

export default AssistantToggle;