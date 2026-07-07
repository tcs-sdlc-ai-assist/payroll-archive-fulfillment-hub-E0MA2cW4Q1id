import { DOCUMENT_STATUS } from './constants';
import { isWithinRange } from './dateUtils';

/**
 * Checks whether a record matches a search term by testing against
 * multiple string fields (case-insensitive, partial match).
 * @param {Object} record - The record object to test
 * @param {string} searchTerm - The search term to match against
 * @param {string[]} [fields] - Optional array of field names to search within
 * @returns {boolean} True if any field in the record contains the search term
 */
export function matchesQuery(record, searchTerm) {
  if (!record || typeof record !== 'object') {
    return false;
  }

  if (!searchTerm || typeof searchTerm !== 'string') {
    return true;
  }

  const term = searchTerm.trim().toLowerCase();

  if (term === '') {
    return true;
  }

  const values = Object.values(record);

  for (const value of values) {
    if (value == null) {
      continue;
    }

    if (typeof value === 'string' && value.toLowerCase().includes(term)) {
      return true;
    }

    if (typeof value === 'number' && String(value).includes(term)) {
      return true;
    }
  }

  return false;
}

/**
 * Filters an array of employee records based on a search query string.
 * Searches across name, kellyId, employeeId, last4SSN, department, location, status, and email.
 * @param {Object[]} employees - The array of employee objects to filter
 * @param {string} query - The search query string (name, Kelly ID, last 4 SSN, etc.)
 * @returns {Object[]} The filtered array of matching employee records
 */
export function filterEmployees(employees, query) {
  if (!Array.isArray(employees)) {
    return [];
  }

  if (!query || typeof query !== 'string') {
    return [...employees];
  }

  const term = query.trim().toLowerCase();

  if (term === '') {
    return [...employees];
  }

  return employees.filter((employee) => {
    if (!employee || typeof employee !== 'object') {
      return false;
    }

    const searchableFields = [
      employee.name,
      employee.kellyId,
      employee.employeeId,
      employee.last4SSN,
      employee.department,
      employee.location,
      employee.status,
      employee.email,
      employee.maskedTaxId,
    ];

    for (const field of searchableFields) {
      if (field && typeof field === 'string' && field.toLowerCase().includes(term)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Filters an array of document records based on a set of filter criteria.
 * Supported filters:
 *   - employeeId {string} - Exact match on employeeId
 *   - kellyId {string} - Exact match on kellyId
 *   - documentType {string} - Exact match on documentType (e.g., 'W-2', 'Paystub')
 *   - year {string} - Exact match on year
 *   - period {string} - Exact match on period (e.g., 'Q1')
 *   - status {string} - Exact match on document status (e.g., 'available', 'missing')
 *   - query {string} - Free-text search across employeeName, fileName, documentId, kellyId
 * @param {Object[]} documents - The array of document objects to filter
 * @param {Object} filters - The filter criteria object
 * @returns {Object[]} The filtered array of matching document records
 */
export function filterDocuments(documents, filters) {
  if (!Array.isArray(documents)) {
    return [];
  }

  if (!filters || typeof filters !== 'object') {
    return [...documents];
  }

  return documents.filter((doc) => {
    if (!doc || typeof doc !== 'object') {
      return false;
    }

    if (filters.employeeId && doc.employeeId !== filters.employeeId) {
      return false;
    }

    if (filters.kellyId && doc.kellyId !== filters.kellyId) {
      return false;
    }

    if (filters.documentType && doc.documentType !== filters.documentType) {
      return false;
    }

    if (filters.year && doc.year !== filters.year) {
      return false;
    }

    if (filters.period && doc.period !== filters.period) {
      return false;
    }

    if (filters.status && doc.status !== filters.status) {
      return false;
    }

    if (filters.query && typeof filters.query === 'string') {
      const term = filters.query.trim().toLowerCase();

      if (term !== '') {
        const searchableFields = [
          doc.employeeName,
          doc.fileName,
          doc.documentId,
          doc.kellyId,
          doc.documentType,
          doc.year,
          doc.period,
          doc.maskedTaxId,
        ];

        let found = false;

        for (const field of searchableFields) {
          if (field && typeof field === 'string' && field.toLowerCase().includes(term)) {
            found = true;
            break;
          }
        }

        if (!found) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Filters an array of audit log events based on a set of filter criteria.
 * Supported filters:
 *   - userId {string} - Exact match on userId
 *   - userName {string} - Case-insensitive partial match on userName
 *   - userRole {string} - Exact match on userRole
 *   - actionType {string} - Exact match on actionType
 *   - employeeId {string} - Exact match on employeeId
 *   - documentId {string} - Exact match on documentId
 *   - status {string} - Exact match on details.status
 *   - startDate {string|Date} - Inclusive start of date range for timestamp
 *   - endDate {string|Date} - Inclusive end of date range for timestamp
 *   - query {string} - Free-text search across userName, userRole, actionType, eventId, and details fields
 * @param {Object[]} events - The array of audit event objects to filter
 * @param {Object} filters - The filter criteria object
 * @returns {Object[]} The filtered array of matching audit event records
 */
export function filterAuditEvents(events, filters) {
  if (!Array.isArray(events)) {
    return [];
  }

  if (!filters || typeof filters !== 'object') {
    return [...events];
  }

  return events.filter((event) => {
    if (!event || typeof event !== 'object') {
      return false;
    }

    if (filters.userId && event.userId !== filters.userId) {
      return false;
    }

    if (filters.userName && typeof filters.userName === 'string') {
      const term = filters.userName.trim().toLowerCase();
      if (term !== '' && (!event.userName || !event.userName.toLowerCase().includes(term))) {
        return false;
      }
    }

    if (filters.userRole && event.userRole !== filters.userRole) {
      return false;
    }

    if (filters.actionType && event.actionType !== filters.actionType) {
      return false;
    }

    if (filters.employeeId && event.employeeId !== filters.employeeId) {
      return false;
    }

    if (filters.documentId && event.documentId !== filters.documentId) {
      return false;
    }

    if (filters.status) {
      const eventStatus = event.details && event.details.status;
      if (eventStatus !== filters.status) {
        return false;
      }
    }

    if (filters.startDate || filters.endDate) {
      if (!isWithinRange(event.timestamp, filters.startDate || null, filters.endDate || null)) {
        return false;
      }
    }

    if (filters.query && typeof filters.query === 'string') {
      const term = filters.query.trim().toLowerCase();

      if (term !== '') {
        const searchableFields = [
          event.eventId,
          event.userId,
          event.userName,
          event.userRole,
          event.actionType,
          event.documentId,
          event.employeeId,
        ];

        if (event.details && typeof event.details === 'object') {
          searchableFields.push(
            event.details.documentType,
            event.details.employeeName,
            event.details.year,
            event.details.period,
            event.details.recipient,
            event.details.status,
            event.details.reason,
          );
        }

        let found = false;

        for (const field of searchableFields) {
          if (field && typeof field === 'string' && field.toLowerCase().includes(term)) {
            found = true;
            break;
          }
        }

        if (!found) {
          return false;
        }
      }
    }

    return true;
  });
}