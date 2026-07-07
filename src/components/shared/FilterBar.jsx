import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} FilterField
 * @property {string} key - The filter field key (used in the onChange callback)
 * @property {string} label - The display label for the filter
 * @property {'select'|'text'|'date'} type - The type of filter control
 * @property {Array<{value: string, label: string}>} [options] - Options for select-type filters
 * @property {string} [placeholder] - Placeholder text for text/date inputs
 * @property {string} [defaultValue] - Default value for the filter
 */

/**
 * @typedef {Object} DateRangeField
 * @property {string} startKey - The filter key for the start date
 * @property {string} endKey - The filter key for the end date
 * @property {string} label - The display label for the date range
 */

/**
 * Reusable filter bar component with dropdowns, text inputs, and date range pickers.
 * Accepts filter configuration (fields, options) and onChange callback.
 * Used by audit log, document list, and governance views for in-memory filtering.
 *
 * @param {Object} props
 * @param {FilterField[]} props.fields - Array of filter field configurations
 * @param {DateRangeField[]} [props.dateRanges] - Optional array of date range configurations
 * @param {Object} props.values - Current filter values keyed by field key
 * @param {Function} props.onChange - Callback when any filter value changes, receives (key, value)
 * @param {Function} [props.onReset] - Optional callback to reset all filters
 * @param {string} [props.className] - Optional additional CSS classes for the container
 */
export function FilterBar({
  fields,
  dateRanges,
  values,
  onChange,
  onReset,
  className,
}) {
  /**
   * Handles a change event from a select or text input.
   * @param {string} key - The filter field key
   * @param {React.ChangeEvent<HTMLSelectElement|HTMLInputElement>} e - The change event
   */
  const handleChange = useCallback(
    (key, e) => {
      if (onChange) {
        onChange(key, e.target.value);
      }
    },
    [onChange]
  );

  /**
   * Handles the reset button click.
   */
  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  /**
   * Determines if any filter has a non-empty value.
   * @type {boolean}
   */
  const hasActiveFilters = useMemo(() => {
    if (!values || typeof values !== 'object') {
      return false;
    }

    return Object.values(values).some((val) => val != null && val !== '');
  }, [values]);

  const validFields = Array.isArray(fields) ? fields : [];
  const validDateRanges = Array.isArray(dateRanges) ? dateRanges : [];
  const currentValues = values && typeof values === 'object' ? values : {};

  return (
    <div className={`w-full ${className || ''}`}>
      <div className="bg-white border border-kelly-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Filter fields */}
          {validFields.map((field) => {
            const fieldValue = currentValues[field.key] != null ? currentValues[field.key] : '';

            if (field.type === 'select') {
              const fieldOptions = Array.isArray(field.options) ? field.options : [];

              return (
                <div key={field.key} className="flex flex-col min-w-[150px]">
                  <label
                    htmlFor={`filter-${field.key}`}
                    className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1"
                  >
                    {field.label}
                  </label>
                  <select
                    id={`filter-${field.key}`}
                    value={fieldValue}
                    onChange={(e) => handleChange(field.key, e)}
                    className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
                  >
                    <option value="">
                      {field.placeholder || `All ${field.label}`}
                    </option>
                    {fieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === 'text') {
              return (
                <div key={field.key} className="flex flex-col min-w-[180px]">
                  <label
                    htmlFor={`filter-${field.key}`}
                    className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1"
                  >
                    {field.label}
                  </label>
                  <input
                    id={`filter-${field.key}`}
                    type="text"
                    value={fieldValue}
                    onChange={(e) => handleChange(field.key, e)}
                    placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
                    className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm placeholder:text-kelly-gray-400 focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
                  />
                </div>
              );
            }

            if (field.type === 'date') {
              return (
                <div key={field.key} className="flex flex-col min-w-[160px]">
                  <label
                    htmlFor={`filter-${field.key}`}
                    className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1"
                  >
                    {field.label}
                  </label>
                  <input
                    id={`filter-${field.key}`}
                    type="date"
                    value={fieldValue}
                    onChange={(e) => handleChange(field.key, e)}
                    className="block w-full rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
                  />
                </div>
              );
            }

            return null;
          })}

          {/* Date range fields */}
          {validDateRanges.map((range) => {
            const startValue = currentValues[range.startKey] != null ? currentValues[range.startKey] : '';
            const endValue = currentValues[range.endKey] != null ? currentValues[range.endKey] : '';

            return (
              <div key={`${range.startKey}-${range.endKey}`} className="flex flex-col">
                <span className="text-xs font-medium text-kelly-gray-600 uppercase tracking-wider mb-1">
                  {range.label}
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    id={`filter-${range.startKey}`}
                    type="date"
                    value={startValue}
                    onChange={(e) => handleChange(range.startKey, e)}
                    aria-label={`${range.label} start date`}
                    className="block w-full min-w-[140px] rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
                  />
                  <span className="text-xs text-kelly-gray-500 flex-shrink-0">to</span>
                  <input
                    id={`filter-${range.endKey}`}
                    type="date"
                    value={endValue}
                    onChange={(e) => handleChange(range.endKey, e)}
                    aria-label={`${range.label} end date`}
                    className="block w-full min-w-[140px] rounded-md border border-kelly-gray-300 bg-white px-3 py-2 text-sm text-kelly-gray-700 shadow-sm focus:border-kelly-green focus:outline-none focus:ring-1 focus:ring-kelly-green transition-colors"
                  />
                </div>
              </div>
            );
          })}

          {/* Reset button */}
          {onReset && (
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasActiveFilters}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-kelly-gray-700 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Reset all filters"
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                  />
                </svg>
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Active filter count indicator */}
        {hasActiveFilters && (
          <div className="mt-2 pt-2 border-t border-kelly-gray-100">
            <span className="text-xs text-kelly-gray-500">
              {Object.values(currentValues).filter((val) => val != null && val !== '').length} filter(s) active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

FilterBar.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['select', 'text', 'date']).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
      placeholder: PropTypes.string,
      defaultValue: PropTypes.string,
    })
  ).isRequired,
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      startKey: PropTypes.string.isRequired,
      endKey: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  className: PropTypes.string,
};

FilterBar.defaultProps = {
  dateRanges: undefined,
  onReset: undefined,
  className: undefined,
};

export default FilterBar;