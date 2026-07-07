/**
 * Application-wide constants for Payroll Archive Hub
 */

/**
 * User role names
 * @enum {string}
 */
export const ROLES = {
  PAYROLL: 'Payroll',
  LEGAL: 'Legal',
  TAX: 'Tax',
  EFSC: 'EFSC',
  SUPERVISOR: 'Supervisor',
  UNAUTHORIZED: 'Unauthorized',
};

/**
 * Action types for audit logging and fulfillment
 * @enum {string}
 */
export const ACTION_TYPES = {
  PREVIEW: 'preview',
  DOWNLOAD: 'download',
  EMAIL: 'email',
  PACKAGE: 'package',
  DENIED: 'denied_access',
};

/**
 * Document type identifiers
 * @enum {string}
 */
export const DOCUMENT_TYPES = {
  W2: 'W-2',
  PAYSTUB: 'Paystub',
};

/**
 * Document status values
 * @enum {string}
 */
export const DOCUMENT_STATUS = {
  AVAILABLE: 'available',
  MISSING: 'missing',
};

/**
 * Employee status values
 * @enum {string}
 */
export const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  TERMINATED: 'Terminated',
  ON_LEAVE: 'On Leave',
};

/**
 * Exception status values
 * @enum {string}
 */
export const EXCEPTION_STATUS = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
};

/**
 * Exception type values
 * @enum {string}
 */
export const EXCEPTION_TYPES = {
  MISSING_SSN: 'Missing SSN',
  DUPLICATE_RECORD: 'Duplicate Record',
  MISSING_METADATA: 'Missing Metadata',
  CORRUPT_FILE: 'Corrupt File',
  MISMATCHED_EMPLOYEE_ID: 'Mismatched Employee ID',
  INGESTION_TIMEOUT: 'Ingestion Timeout',
};

/**
 * Archive date range coverage
 */
export const DATE_RANGE = {
  MIN_YEAR: 2019,
  MAX_YEAR: 2024,
  CURRENT_YEAR: 2025,
};

/**
 * All supported archive years
 * @type {string[]}
 */
export const ARCHIVE_YEARS = ['2019', '2020', '2021', '2022', '2023', '2024'];

/**
 * Quarterly periods
 * @type {string[]}
 */
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

/**
 * PII field names that require masking or special handling
 * @type {string[]}
 */
export const PII_FIELDS = [
  'taxId',
  'maskedTaxId',
  'last4SSN',
  'ssn',
  'socialSecurityNumber',
  'email',
];

/**
 * Kelly brand color hex values
 * @enum {string}
 */
export const KELLY_COLORS = {
  GREEN: '#00AE42',
  DARK: '#003B1F',
  GRAY_50: '#f7f7f8',
  GRAY_100: '#eeeef0',
  GRAY_200: '#d9d9de',
  GRAY_300: '#b8b8c0',
  GRAY_400: '#91919d',
  GRAY_500: '#747482',
  GRAY_600: '#5e5e6a',
  GRAY_700: '#4d4d57',
  GRAY_800: '#42424a',
  GRAY_900: '#3a3a40',
  GRAY_950: '#26262b',
};

/**
 * Audit log event status values
 * @enum {string}
 */
export const AUDIT_STATUS = {
  SUCCESS: 'success',
  DENIED: 'denied',
};

/**
 * Permissions that can be assigned to user roles
 * @enum {string}
 */
export const PERMISSIONS = {
  SEARCH: 'search',
  PREVIEW: 'preview',
  DOWNLOAD: 'download',
  EMAIL: 'email',
  PACKAGE: 'package',
  AUDIT: 'audit',
  DASHBOARD: 'dashboard',
  GOVERNANCE: 'governance',
};

/**
 * Role-to-permissions mapping
 * @type {Object.<string, string[]>}
 */
export const ROLE_PERMISSIONS = {
  [ROLES.PAYROLL]: [
    PERMISSIONS.SEARCH,
    PERMISSIONS.PREVIEW,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.EMAIL,
    PERMISSIONS.PACKAGE,
    PERMISSIONS.AUDIT,
    PERMISSIONS.DASHBOARD,
  ],
  [ROLES.LEGAL]: [
    PERMISSIONS.SEARCH,
    PERMISSIONS.PREVIEW,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.PACKAGE,
    PERMISSIONS.AUDIT,
    PERMISSIONS.DASHBOARD,
  ],
  [ROLES.TAX]: [
    PERMISSIONS.SEARCH,
    PERMISSIONS.PREVIEW,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.PACKAGE,
    PERMISSIONS.AUDIT,
    PERMISSIONS.DASHBOARD,
  ],
  [ROLES.EFSC]: [
    PERMISSIONS.SEARCH,
    PERMISSIONS.PREVIEW,
    PERMISSIONS.AUDIT,
    PERMISSIONS.DASHBOARD,
  ],
  [ROLES.SUPERVISOR]: [
    PERMISSIONS.SEARCH,
    PERMISSIONS.PREVIEW,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.EMAIL,
    PERMISSIONS.PACKAGE,
    PERMISSIONS.AUDIT,
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.GOVERNANCE,
  ],
  [ROLES.UNAUTHORIZED]: [],
};

/**
 * Data file paths for fetching mock data
 * @enum {string}
 */
export const DATA_PATHS = {
  EMPLOYEES: '/data/employees.json',
  DOCUMENTS: '/data/documents.json',
  AUDIT_LOG: '/data/auditLog.json',
  ARCHIVE_HEALTH: '/data/archiveHealth.json',
  USERS: '/data/users.json',
  ASSISTANT_RESPONSES: '/data/assistantResponses.json',
};

/**
 * Location values used across the application
 * @type {string[]}
 */
export const LOCATIONS = [
  'Troy, MI',
  'Detroit, MI',
  'Chicago, IL',
  'Austin, TX',
];

/**
 * Department values used across the application
 * @type {string[]}
 */
export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Legal',
  'Operations',
  'Payroll',
  'Tax',
];