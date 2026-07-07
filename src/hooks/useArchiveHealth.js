import { useState, useEffect, useMemo } from 'react';
import { loadArchiveHealth } from '../utils/fixtureLoader';

/**
 * @typedef {Object} UseArchiveHealthReturn
 * @property {Object|null} healthData - The full archive health data object
 * @property {Object[]} unresolvedExceptions - Array of unresolved exception objects
 * @property {boolean} loading - Whether archive health data is still loading
 * @property {string|null} error - Error message if data failed to load
 */

/**
 * Custom React hook for loading archive health metrics.
 * Loads archiveHealth.json via fixtureLoader. Returns healthData,
 * unresolvedExceptions, loading, and error states.
 * @returns {UseArchiveHealthReturn} The archive health data and loading utilities
 */
export function useArchiveHealth() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchArchiveHealth() {
      try {
        const data = await loadArchiveHealth();
        if (!cancelled) {
          if (data && typeof data === 'object') {
            setRawData(data);
          } else {
            setRawData(null);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load archive health data');
          setRawData(null);
          setLoading(false);
        }
      }
    }

    fetchArchiveHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * The full archive health data object.
   * @type {Object|null}
   */
  const healthData = useMemo(() => {
    return rawData;
  }, [rawData]);

  /**
   * Array of unresolved exceptions from the archive health data.
   * Filters to only include exceptions with status 'open' or 'in_review'.
   * @type {Object[]}
   */
  const unresolvedExceptions = useMemo(() => {
    if (!rawData || !Array.isArray(rawData.unresolvedExceptions)) {
      return [];
    }

    return rawData.unresolvedExceptions.filter(
      (exception) =>
        exception &&
        typeof exception === 'object' &&
        exception.status !== 'resolved'
    );
  }, [rawData]);

  return {
    healthData,
    unresolvedExceptions,
    loading,
    error,
  };
}

export default useArchiveHealth;