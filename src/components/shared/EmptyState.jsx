import { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Returns the default SVG path for the empty state icon based on the variant.
 * @param {string} variant - The empty state variant
 * @returns {string} The SVG path string
 */
function getDefaultIconPath(variant) {
  switch (variant) {
    case 'search':
      return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
    case 'document':
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    case 'audit':
      return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01';
    case 'error':
      return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z';
    case 'filter':
      return 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z';
    default:
      return 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4';
  }
}

/**
 * Returns the default message based on the variant.
 * @param {string} variant - The empty state variant
 * @returns {string} The default message string
 */
function getDefaultMessage(variant) {
  switch (variant) {
    case 'search':
      return 'No results found. Try adjusting your search criteria.';
    case 'document':
      return 'No documents found. The archive may not contain records matching your criteria.';
    case 'audit':
      return 'No audit events found. Try adjusting your filters.';
    case 'error':
      return 'Something went wrong. Please try again later.';
    case 'filter':
      return 'No results match the current filters. Try resetting or adjusting your filters.';
    default:
      return 'No data available.';
  }
}

/**
 * Returns the default title based on the variant.
 * @param {string} variant - The empty state variant
 * @returns {string} The default title string
 */
function getDefaultTitle(variant) {
  switch (variant) {
    case 'search':
      return 'No Results';
    case 'document':
      return 'No Documents';
    case 'audit':
      return 'No Events';
    case 'error':
      return 'Error';
    case 'filter':
      return 'No Matches';
    default:
      return 'Nothing Here';
  }
}

/**
 * Reusable empty state component displayed when no results are found.
 * Shows an icon, title, message, and optional action button.
 * Used across search, document list, and audit views.
 *
 * @param {Object} props
 * @param {string} [props.variant] - The empty state variant ('search', 'document', 'audit', 'error', 'filter', 'default')
 * @param {string} [props.title] - Optional custom title text
 * @param {string} [props.message] - Optional custom message text
 * @param {string} [props.iconPath] - Optional custom SVG path for the icon
 * @param {string} [props.actionLabel] - Optional label for the action button
 * @param {Function} [props.onAction] - Optional callback when the action button is clicked
 * @param {string} [props.className] - Optional additional CSS classes for the container
 */
export function EmptyState({
  variant = 'default',
  title,
  message,
  iconPath,
  actionLabel,
  onAction,
  className,
}) {
  /**
   * Handles the action button click.
   */
  const handleAction = useCallback(() => {
    if (onAction) {
      onAction();
    }
  }, [onAction]);

  const displayTitle = title || getDefaultTitle(variant);
  const displayMessage = message || getDefaultMessage(variant);
  const displayIconPath = iconPath || getDefaultIconPath(variant);

  /**
   * Returns the icon container color class based on variant.
   * @returns {string}
   */
  function getIconColorClass() {
    switch (variant) {
      case 'error':
        return 'bg-red-50 text-red-400';
      case 'search':
        return 'bg-kelly-green/5 text-kelly-green';
      case 'document':
        return 'bg-blue-50 text-blue-400';
      case 'audit':
        return 'bg-purple-50 text-purple-400';
      case 'filter':
        return 'bg-yellow-50 text-yellow-500';
      default:
        return 'bg-kelly-gray-100 text-kelly-gray-400';
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ''}`}
      role="status"
      aria-label={displayTitle}
    >
      {/* Icon */}
      <div
        className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getIconColorClass()}`}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={displayIconPath}
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-kelly-gray-900 mb-1">
        {displayTitle}
      </h3>

      {/* Message */}
      <p className="text-sm text-kelly-gray-500 max-w-md mb-6">
        {displayMessage}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-kelly-green hover:bg-kelly-dark focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  variant: PropTypes.oneOf(['search', 'document', 'audit', 'error', 'filter', 'default']),
  title: PropTypes.string,
  message: PropTypes.string,
  iconPath: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string,
};

EmptyState.defaultProps = {
  variant: 'default',
  title: undefined,
  message: undefined,
  iconPath: undefined,
  actionLabel: undefined,
  onAction: undefined,
  className: undefined,
};

export default EmptyState;