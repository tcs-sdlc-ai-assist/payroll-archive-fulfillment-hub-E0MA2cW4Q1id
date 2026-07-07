import PropTypes from 'prop-types';

/**
 * Reusable loading spinner component with Kelly green accent.
 * Displays a centered spinner with optional loading message text.
 *
 * @param {Object} props
 * @param {string} [props.message] - Optional loading message to display below the spinner
 * @param {string} [props.size] - The size variant ('sm', 'md', 'lg') — defaults to 'md'
 * @param {string} [props.className] - Optional additional CSS classes for the container
 */
export function LoadingSpinner({
  message,
  size = 'md',
  className,
}) {
  /**
   * Returns size-specific Tailwind classes for the spinner.
   * @returns {string}
   */
  function getSpinnerSizeClasses() {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'lg':
        return 'w-12 h-12';
      case 'md':
      default:
        return 'w-8 h-8';
    }
  }

  /**
   * Returns size-specific Tailwind classes for the message text.
   * @returns {string}
   */
  function getMessageSizeClasses() {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      case 'md':
      default:
        return 'text-sm';
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 ${className || ''}`}
      role="status"
      aria-label={message || 'Loading'}
    >
      <svg
        className={`animate-spin ${getSpinnerSizeClasses()} text-kelly-green`}
        xmlns="http://www.w3.org/2000/svg"
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
      {message && (
        <p className={`mt-3 ${getMessageSizeClasses()} text-kelly-gray-500 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  message: undefined,
  size: 'md',
  className: undefined,
};

export default LoadingSpinner;