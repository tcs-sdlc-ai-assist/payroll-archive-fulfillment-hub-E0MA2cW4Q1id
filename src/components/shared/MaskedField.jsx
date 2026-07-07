import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { maskFieldValue, isSensitiveField } from '../../utils/maskingUtils';
import { useRBAC } from '../../contexts/RBACContext';
import { PERMISSIONS } from '../../utils/constants';

/**
 * Reusable component for displaying PII fields with masking.
 * Renders the masked value by default and provides a toggle to reveal
 * the original value if the current user has the appropriate permission.
 *
 * @param {Object} props
 * @param {string} props.value - The raw value to display (may already be masked)
 * @param {string} props.fieldType - The PII field type (e.g., 'taxId', 'maskedTaxId', 'ssn', 'email', 'last4SSN')
 * @param {string} [props.label] - Optional label to display before the value
 * @param {string} [props.className] - Optional additional CSS classes for the container
 * @param {boolean} [props.allowReveal] - Whether to show the reveal toggle (defaults to true)
 */
export function MaskedField({
  value,
  fieldType,
  label,
  className,
  allowReveal = true,
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const { hasPermission } = useRBAC();

  /**
   * Determines if the current user can reveal masked PII values.
   * Only users with preview permission can toggle reveal.
   * @returns {boolean}
   */
  const canReveal = allowReveal && hasPermission(PERMISSIONS.PREVIEW);

  /**
   * Toggles the revealed state of the masked field.
   */
  const handleToggle = useCallback(() => {
    if (canReveal) {
      setIsRevealed((prev) => !prev);
    }
  }, [canReveal]);

  /**
   * Computes the display value based on reveal state and field sensitivity.
   * @returns {string}
   */
  function getDisplayValue() {
    if (!value || typeof value !== 'string') {
      return '—';
    }

    if (isRevealed) {
      return value;
    }

    if (isSensitiveField(fieldType)) {
      return maskFieldValue(fieldType, value);
    }

    return value;
  }

  const displayValue = getDisplayValue();
  const isSensitive = isSensitiveField(fieldType);

  return (
    <span className={`inline-flex items-center space-x-1.5 ${className || ''}`}>
      {label && (
        <span className="text-xs font-medium text-kelly-gray-500 uppercase tracking-wider">
          {label}
        </span>
      )}
      <span
        className={`text-sm font-mono ${
          isSensitive && !isRevealed
            ? 'text-kelly-gray-600'
            : 'text-kelly-gray-900'
        }`}
        aria-label={
          isSensitive
            ? isRevealed
              ? `${fieldType} value revealed`
              : `${fieldType} value masked`
            : fieldType
        }
      >
        {displayValue}
      </span>
      {isSensitive && canReveal && (
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center justify-center w-5 h-5 rounded text-kelly-gray-400 hover:text-kelly-gray-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors"
          aria-label={isRevealed ? `Hide ${fieldType}` : `Reveal ${fieldType}`}
          title={isRevealed ? 'Hide value' : 'Reveal value'}
        >
          {isRevealed ? (
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
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          ) : (
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
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </button>
      )}
    </span>
  );
}

MaskedField.propTypes = {
  value: PropTypes.string,
  fieldType: PropTypes.string.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
  allowReveal: PropTypes.bool,
};

MaskedField.defaultProps = {
  value: undefined,
  label: undefined,
  className: undefined,
  allowReveal: true,
};

export default MaskedField;