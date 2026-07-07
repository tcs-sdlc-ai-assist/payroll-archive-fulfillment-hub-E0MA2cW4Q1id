import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { loadAuditLog } from '../utils/fixtureLoader';
import { filterAuditEvents } from '../utils/searchUtils';

/**
 * @typedef {Object} AuditEvent
 * @property {string} eventId - Unique event identifier
 * @property {string} userId - The user who performed the action
 * @property {string} userName - Display name of the user
 * @property {string} userRole - Role of the user (Payroll, Legal, Tax, EFSC, Supervisor, Unauthorized)
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} actionType - Type of action (preview, download, email, package, denied_access)
 * @property {string|null} documentId - Associated document ID, if any
 * @property {string|null} employeeId - Associated employee ID, if any
 * @property {Object} details - Action-specific details
 */

/**
 * @typedef {Object} AuditContextValue
 * @property {AuditEvent[]} events - All audit events (seed + session-local)
 * @property {boolean} isLoading - Whether seed data is still loading
 * @property {string|null} error - Error message if seed data failed to load
 * @property {Function} logEvent - Function to append a new audit event
 * @property {Function} getEvents - Function to retrieve all audit events
 * @property {Function} filterEvents - Function to filter audit events by criteria
 */

const AuditContext = createContext(null);

/**
 * Generates a unique event ID using a combination of timestamp and random string.
 * @returns {string} A unique event ID string
 */
function generateEventId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `EVT_${timestamp}_${random}`;
}

/**
 * Audit Context Provider — manages in-memory audit logging.
 * Loads auditLog.json as seed data, provides methods to log new events,
 * retrieve all events, and filter events by criteria.
 * All audit state is in-memory and resets on page reload.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AuditProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAuditLog() {
      try {
        const data = await loadAuditLog();
        if (!cancelled) {
          if (Array.isArray(data)) {
            setEvents(data);
          } else {
            setEvents([]);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load audit log');
          setEvents([]);
          setIsLoading(false);
        }
      }
    }

    fetchAuditLog();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Logs a new audit event by appending it to the in-memory event list.
   * Automatically generates an eventId and timestamp if not provided.
   * @param {Object} eventData - The audit event data to log
   * @param {string} eventData.userId - The user who performed the action
   * @param {string} eventData.userName - Display name of the user
   * @param {string} eventData.userRole - Role of the user
   * @param {string} eventData.actionType - Type of action performed
   * @param {string|null} [eventData.documentId] - Associated document ID
   * @param {string|null} [eventData.employeeId] - Associated employee ID
   * @param {Object} [eventData.details] - Action-specific details
   * @returns {AuditEvent} The newly created audit event
   */
  const logEvent = useCallback((eventData) => {
    if (!eventData || typeof eventData !== 'object') {
      return null;
    }

    const newEvent = {
      eventId: eventData.eventId || generateEventId(),
      userId: eventData.userId || 'unknown',
      userName: eventData.userName || 'Unknown User',
      userRole: eventData.userRole || 'Unknown',
      timestamp: eventData.timestamp || new Date().toISOString(),
      actionType: eventData.actionType || 'unknown',
      documentId: eventData.documentId || null,
      employeeId: eventData.employeeId || null,
      details: eventData.details || {},
    };

    setEvents((prev) => [...prev, newEvent]);

    return newEvent;
  }, []);

  /**
   * Retrieves all audit events in the current session.
   * @returns {AuditEvent[]} Array of all audit events
   */
  const getEvents = useCallback(() => {
    return [...events];
  }, [events]);

  /**
   * Filters audit events based on the provided filter criteria.
   * Delegates to the filterAuditEvents utility from searchUtils.
   * Supported filters:
   *   - userId {string} - Exact match on userId
   *   - userName {string} - Case-insensitive partial match on userName
   *   - userRole {string} - Exact match on userRole
   *   - actionType {string} - Exact match on actionType
   *   - employeeId {string} - Exact match on employeeId
   *   - documentId {string} - Exact match on documentId
   *   - status {string} - Exact match on details.status
   *   - startDate {string|Date} - Inclusive start of date range
   *   - endDate {string|Date} - Inclusive end of date range
   *   - query {string} - Free-text search across multiple fields
   * @param {Object} filters - The filter criteria object
   * @returns {AuditEvent[]} The filtered array of audit events
   */
  const filterEventsCallback = useCallback(
    (filters) => {
      return filterAuditEvents(events, filters);
    },
    [events]
  );

  const value = useMemo(
    () => ({
      events,
      isLoading,
      error,
      logEvent,
      getEvents,
      filterEvents: filterEventsCallback,
    }),
    [events, isLoading, error, logEvent, getEvents, filterEventsCallback]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

AuditProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the Audit context.
 * Must be used within an AuditProvider.
 * @returns {AuditContextValue} The Audit context value
 */
export function useAudit() {
  const context = useContext(AuditContext);

  if (context === null) {
    throw new Error('useAudit must be used within an AuditProvider');
  }

  return context;
}

export default AuditContext;