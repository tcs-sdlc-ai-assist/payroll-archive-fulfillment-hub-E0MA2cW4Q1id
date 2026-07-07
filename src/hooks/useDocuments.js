import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadDocuments } from '../utils/fixtureLoader';
import { filterDocuments } from '../utils/searchUtils';

/**
 * @typedef {Object} UseDocumentsReturn
 * @property {Object[]} documents - All loaded document records
 * @property {Object[]} filteredDocuments - Filtered document records based on last applied filters
 * @property {Function} getDocumentsByEmployee - Function to get documents for a specific employee
 * @property {Function} filterByType - Function to filter documents by document type
 * @property {Function} filterByYear - Function to filter documents by year
 * @property {Function} filterDocs - Function to filter documents by arbitrary criteria
 * @property {boolean} loading - Whether document data is still loading
 * @property {string|null} error - Error message if data failed to load
 */

/**
 * Custom React hook for loading and filtering document data.
 * Loads documents.json via fixtureLoader, provides getDocumentsByEmployee(employeeId),
 * filterByType(type), filterByYear(year), and a general filterDocs(filters) function.
 * @returns {UseDocumentsReturn} The document data and filter utilities
 */
export function useDocuments() {
  const [rawDocuments, setRawDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocuments() {
      try {
        const data = await loadDocuments();
        if (!cancelled) {
          if (Array.isArray(data)) {
            setRawDocuments(data);
            setFilteredDocuments(data);
          } else {
            setRawDocuments([]);
            setFilteredDocuments([]);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load documents');
          setRawDocuments([]);
          setFilteredDocuments([]);
          setLoading(false);
        }
      }
    }

    fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * All loaded documents.
   * @type {Object[]}
   */
  const documents = useMemo(() => {
    return rawDocuments;
  }, [rawDocuments]);

  /**
   * Retrieves all documents for a specific employee by employeeId.
   * @param {string} employeeId - The employee ID to filter by
   * @returns {Object[]} The array of document records for the given employee
   */
  const getDocumentsByEmployee = useCallback(
    (employeeId) => {
      if (!employeeId || typeof employeeId !== 'string') {
        return [];
      }

      const results = filterDocuments(rawDocuments, { employeeId });
      setFilteredDocuments(results);
      return results;
    },
    [rawDocuments]
  );

  /**
   * Filters documents by document type (e.g., 'W-2', 'Paystub').
   * @param {string} type - The document type to filter by
   * @returns {Object[]} The filtered array of document records
   */
  const filterByType = useCallback(
    (type) => {
      if (!type || typeof type !== 'string') {
        setFilteredDocuments(rawDocuments);
        return rawDocuments;
      }

      const results = filterDocuments(rawDocuments, { documentType: type });
      setFilteredDocuments(results);
      return results;
    },
    [rawDocuments]
  );

  /**
   * Filters documents by year (e.g., '2024').
   * @param {string} year - The year to filter by
   * @returns {Object[]} The filtered array of document records
   */
  const filterByYear = useCallback(
    (year) => {
      if (!year || typeof year !== 'string') {
        setFilteredDocuments(rawDocuments);
        return rawDocuments;
      }

      const results = filterDocuments(rawDocuments, { year });
      setFilteredDocuments(results);
      return results;
    },
    [rawDocuments]
  );

  /**
   * Filters documents by arbitrary criteria.
   * Supported filters:
   *   - employeeId {string} - Exact match on employeeId
   *   - kellyId {string} - Exact match on kellyId
   *   - documentType {string} - Exact match on documentType
   *   - year {string} - Exact match on year
   *   - period {string} - Exact match on period
   *   - status {string} - Exact match on status
   *   - query {string} - Free-text search across multiple fields
   * If filters is empty or not provided, resets results to all documents.
   * @param {Object} filters - The filter criteria object
   * @returns {Object[]} The filtered array of document records
   */
  const filterDocs = useCallback(
    (filters) => {
      if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
        setFilteredDocuments(rawDocuments);
        return rawDocuments;
      }

      const results = filterDocuments(rawDocuments, filters);
      setFilteredDocuments(results);
      return results;
    },
    [rawDocuments]
  );

  return {
    documents,
    filteredDocuments,
    getDocumentsByEmployee,
    filterByType,
    filterByYear,
    filterDocuments: filterDocs,
    loading,
    error,
  };
}

export default useDocuments;