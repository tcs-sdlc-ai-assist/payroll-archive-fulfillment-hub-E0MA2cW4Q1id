import PropTypes from 'prop-types';
import {
  DOCUMENT_STATUS,
  EXCEPTION_STATUS,
  EMPLOYEE_STATUS,
  AUDIT_STATUS,
} from '../../utils/constants';

/**
 * Maps a status value to its display configuration (label, color classes).
 * @param {string} status - The status value to map
 * @returns {{ label: string, className: string }} The display configuration
 */
function getStatusConfig(status) {
  if (!status || typeof status !== 'string') {
    return {
      label: 'Unknown',
      className: 'bg-kelly-gray-100 text-kelly-gray-600',
    };
  }

  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    // Document statuses
    case 'available':
      return {
        label: 'Available',
        className: 'bg-green-100 text-green-800',
      };
    case 'missing':
      return {
        label: 'Missing',
        className: 'bg-red-100 text-red-800',
      };

    // Exception statuses
    case 'open':
      return {
        label: 'Open',
        className: 'bg-yellow-100 text-yellow-800',
      };
    case 'in_review':
      return {
        label: 'In Review',
        className: 'bg-blue-100 text-blue-800',
      };
    case 'resolved':
      return {
        label: 'Resolved',
        className: 'bg-green-100 text-green-800',
      };

    // Employee statuses
    case 'active':
      return {
        label: 'Active',
        className: 'bg-green-100 text-green-800',
      };
    case 'terminated':
      return {
        label: 'Terminated',
        className: 'bg-red-100 text-red-800',
      };
    case 'on leave':
      return {
        label: 'On Leave',
        className: 'bg-orange-100 text-orange-800',
      };

    // Audit statuses
    case 'success':
      return {
        label: 'Success',
        className: 'bg-green-100 text-green-800',
      };
    case 'denied':
      return {
        label: 'Denied',
        className: 'bg-red-100 text-red-800',
      };

    // Generic statuses
    case 'pending':
      return {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800',
      };
    case 'failed':
      return {
        label: 'Failed',
        className: 'bg-red-100 text-red-800',
      };

    default:
      return {
        label: status,
        className: 'bg-kelly-gray-100 text-kelly-gray-600',
      };
  }
}

/**
 * Reusable badge component for displaying status labels with color-coded backgrounds.
 * Supports document statuses (Available, Missing), exception statuses (Open, In Review, Resolved),
 * employee statuses (Active, Terminated, On Leave), audit statuses (Success, Denied),
 * and generic statuses (Pending, Failed).
 *
 * @param {Object} props
 * @param {string} props.status - The status value to display
 * @param {string} [props.size] - The size variant ('sm', 'md', 'lg') — defaults to 'sm'
 * @param {string} [props.className] - Optional additional CSS classes for the badge
 * @param {boolean} [props.dot] - Whether to show a colored dot indicator before the label
 */
export function StatusBadge({
  status,
  size = 'sm',
  className,
  dot = false,
}) {
  const config = getStatusConfig(status);

  /**
   * Returns size-specific Tailwind classes.
   * @returns {string}
   */
  function getSizeClasses() {
    switch (size) {
      case 'lg':
        return 'px-3 py-1 text-sm';
      case 'md':
        return 'px-2.5 py-0.5 text-xs';
      case 'sm':
      default:
        return 'px-2 py-0.5 text-xs';
    }
  }

  /**
   * Returns the dot color class based on the status.
   * @returns {string}
   */
  function getDotColorClass() {
    const normalized = status ? status.toLowerCase().trim() : '';

    switch (normalized) {
      case 'available':
      case 'active':
      case 'resolved':
      case 'success':
        return 'bg-green-500';
      case 'missing':
      case 'terminated':
      case 'denied':
      case 'failed':
        return 'bg-red-500';
      case 'open':
      case 'pending':
        return 'bg-yellow-500';
      case 'in_review':
        return 'bg-blue-500';
      case 'on leave':
        return 'bg-orange-500';
      default:
        return 'bg-kelly-gray-400';
    }
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${getSizeClasses()} ${config.className} ${className || ''}`}
      aria-label={`Status: ${config.label}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${getDotColorClass()}`}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  dot: PropTypes.bool,
};

StatusBadge.defaultProps = {
  size: 'sm',
  className: undefined,
  dot: false,
};

export default StatusBadge;