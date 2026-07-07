import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadEmployees } from '../utils/fixtureLoader';
import { filterEmployees } from '../utils/searchUtils';
import { maskObjectPII } from '../utils/maskingUtils';

/**
 * @typedef {Object} UseEmployeesReturn
 * @property {Object[]} employees - All loaded employee records with PII masked
 * @property {Object[]} searchResults - Filtered employee records based on last search query
 * @property {Function} searchEmployees - Function to search/filter employees by query string
 * @property {boolean} loading - Whether employee data is still loading
 * @property {string|null} error - Error message if data failed to load
 */

/**
 * Custom React hook for loading and searching employee data.
 * Loads employees.json via fixtureLoader, applies PII masking,
 * and provides a searchEmployees(query) function.
 * @returns {UseEmployeesReturn} The employee data and search utilities
 */
export function useEmployees() {
  const [rawEmployees, setRawEmployees] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEmployees() {
      try {
        const data = await loadEmployees();
        if (!cancelled) {
          if (Array.isArray(data)) {
            setRawEmployees(data);
            setSearchResults(data);
          } else {
            setRawEmployees([]);
            setSearchResults([]);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load employees');
          setRawEmployees([]);
          setSearchResults([]);
          setLoading(false);
        }
      }
    }

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * All employees with PII fields masked.
   * @type {Object[]}
   */
  const employees = useMemo(() => {
    return rawEmployees.map((emp) => maskObjectPII(emp));
  }, [rawEmployees]);

  /**
   * Masked search results.
   * @type {Object[]}
   */
  const maskedSearchResults = useMemo(() => {
    return searchResults.map((emp) => maskObjectPII(emp));
  }, [searchResults]);

  /**
   * Searches employees by a query string.
   * Filters across name, kellyId, employeeId, last4SSN, department, location, status, and email.
   * If query is empty or not provided, resets results to all employees.
   * @param {string} query - The search query string
   * @returns {Object[]} The filtered and PII-masked employee records
   */
  const searchEmployeesCallback = useCallback(
    (query) => {
      if (!query || typeof query !== 'string' || query.trim() === '') {
        setSearchResults(rawEmployees);
        return rawEmployees.map((emp) => maskObjectPII(emp));
      }

      const filtered = filterEmployees(rawEmployees, query);
      setSearchResults(filtered);
      return filtered.map((emp) => maskObjectPII(emp));
    },
    [rawEmployees]
  );

  return {
    employees,
    searchResults: maskedSearchResults,
    searchEmployees: searchEmployeesCallback,
    loading,
    error,
  };
}

export default useEmployees;