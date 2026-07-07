import { DATE_RANGE, ARCHIVE_YEARS } from './constants';

/**
 * Formats an ISO 8601 timestamp string into a human-readable format.
 * Example: "2025-06-15T09:12:34Z" → "Jun 15, 2025, 9:12:34 AM"
 * @param {string} ts - An ISO 8601 timestamp string
 * @returns {string} A formatted date/time string, or 'Invalid date' if parsing fails
 */
export function formatTimestamp(ts) {
  if (!ts || typeof ts !== 'string') {
    return 'Invalid date';
  }

  try {
    const date = new Date(ts);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Checks whether a given date falls within a start and end range (inclusive).
 * All parameters can be ISO 8601 strings, Date objects, or timestamps.
 * If start or end is null/undefined, that side of the range is unbounded.
 * @param {string|Date|number} date - The date to check
 * @param {string|Date|number|null} start - The start of the range (inclusive), or null for no lower bound
 * @param {string|Date|number|null} end - The end of the range (inclusive), or null for no upper bound
 * @returns {boolean} True if the date is within the range, false otherwise
 */
export function isWithinRange(date, start, end) {
  if (!date) {
    return false;
  }

  try {
    const dateMs = new Date(date).getTime();

    if (isNaN(dateMs)) {
      return false;
    }

    if (start != null) {
      const startMs = new Date(start).getTime();
      if (isNaN(startMs)) {
        return false;
      }
      if (dateMs < startMs) {
        return false;
      }
    }

    if (end != null) {
      const endMs = new Date(end).getTime();
      if (isNaN(endMs)) {
        return false;
      }
      if (dateMs > endMs) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Generates an array of year strings from startYear to endYear (inclusive).
 * If no arguments are provided, returns the default ARCHIVE_YEARS from constants.
 * @param {number|string} [startYear] - The starting year (defaults to DATE_RANGE.MIN_YEAR)
 * @param {number|string} [endYear] - The ending year (defaults to DATE_RANGE.MAX_YEAR)
 * @returns {string[]} An array of year strings in ascending order
 */
export function getYearRange(startYear, endYear) {
  if (startYear === undefined && endYear === undefined) {
    return [...ARCHIVE_YEARS];
  }

  const start = startYear !== undefined ? parseInt(String(startYear), 10) : DATE_RANGE.MIN_YEAR;
  const end = endYear !== undefined ? parseInt(String(endYear), 10) : DATE_RANGE.MAX_YEAR;

  if (isNaN(start) || isNaN(end)) {
    return [...ARCHIVE_YEARS];
  }

  if (start > end) {
    return [];
  }

  const years = [];
  for (let year = start; year <= end; year++) {
    years.push(String(year));
  }

  return years;
}

/**
 * Formats a date string or Date object into a display-friendly format.
 * Example: "2025-01-31" → "Jan 31, 2025"
 * @param {string|Date|null} date - The date to format
 * @returns {string} A formatted date string, or '—' if the date is null/invalid
 */
export function formatDateForDisplay(date) {
  if (!date) {
    return '—';
  }

  try {
    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}