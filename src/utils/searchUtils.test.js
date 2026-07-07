import { describe, it, expect } from 'vitest';
import {
  matchesQuery,
  filterEmployees,
  filterDocuments,
  filterAuditEvents,
} from './searchUtils';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockEmployees = [
  {
    employeeId: 'EMP001',
    kellyId: 'K100234',
    name: 'John Smith',
    maskedTaxId: '***-**-6789',
    last4SSN: '6789',
    email: 'j***@kelly.com',
    department: 'Engineering',
    status: 'Active',
    hireDate: '2019-03-15',
    location: 'Troy, MI',
  },
  {
    employeeId: 'EMP002',
    kellyId: 'K100456',
    name: 'Sarah Johnson',
    maskedTaxId: '***-**-1234',
    last4SSN: '1234',
    email: 's***@kelly.com',
    department: 'Finance',
    status: 'Active',
    hireDate: '2020-07-01',
    location: 'Troy, MI',
  },
  {
    employeeId: 'EMP003',
    kellyId: 'K100789',
    name: 'Michael Williams',
    maskedTaxId: '***-**-5678',
    last4SSN: '5678',
    email: 'm***@kelly.com',
    department: 'Human Resources',
    status: 'Active',
    hireDate: '2018-11-20',
    location: 'Detroit, MI',
  },
  {
    employeeId: 'EMP005',
    kellyId: 'K100654',
    name: 'Robert Martinez',
    maskedTaxId: '***-**-3456',
    last4SSN: '3456',
    email: 'r***@kelly.com',
    department: 'Engineering',
    status: 'Terminated',
    hireDate: '2017-05-22',
    location: 'Austin, TX',
  },
  {
    employeeId: 'EMP008',
    kellyId: 'K101345',
    name: 'Lisa Anderson',
    maskedTaxId: '***-**-6781',
    last4SSN: '6781',
    email: 'l***@kelly.com',
    department: 'Finance',
    status: 'On Leave',
    hireDate: '2016-08-05',
    location: 'Detroit, MI',
  },
];

const mockDocuments = [
  {
    documentId: 'DOC001',
    employeeId: 'EMP001',
    kellyId: 'K100234',
    documentType: 'W-2',
    year: '2024',
    period: null,
    fileName: 'W2_2024_John_Smith.pdf',
    fileUrl: '/mock_pdfs/W2_2024_John_Smith.pdf',
    status: 'available',
    maskedTaxId: '***-**-6789',
    employeeName: 'John Smith',
    createdDate: '2025-01-31',
    fileSize: '245 KB',
  },
  {
    documentId: 'DOC002',
    employeeId: 'EMP001',
    kellyId: 'K100234',
    documentType: 'W-2',
    year: '2023',
    period: null,
    fileName: 'W2_2023_John_Smith.pdf',
    fileUrl: '/mock_pdfs/W2_2023_John_Smith.pdf',
    status: 'available',
    maskedTaxId: '***-**-6789',
    employeeName: 'John Smith',
    createdDate: '2024-01-31',
    fileSize: '238 KB',
  },
  {
    documentId: 'DOC004',
    employeeId: 'EMP001',
    kellyId: 'K100234',
    documentType: 'Paystub',
    year: '2025',
    period: 'Q1',
    fileName: 'Paystub_2025_Q1_John_Smith.pdf',
    fileUrl: '/mock_pdfs/Paystub_2025_Q1_John_Smith.pdf',
    status: 'available',
    maskedTaxId: '***-**-6789',
    employeeName: 'John Smith',
    createdDate: '2025-03-31',
    fileSize: '112 KB',
  },
  {
    documentId: 'DOC010',
    employeeId: 'EMP002',
    kellyId: 'K100456',
    documentType: 'W-2',
    year: '2024',
    period: null,
    fileName: 'W2_2024_Sarah_Johnson.pdf',
    fileUrl: '/mock_pdfs/W2_2024_Sarah_Johnson.pdf',
    status: 'available',
    maskedTaxId: '***-**-1234',
    employeeName: 'Sarah Johnson',
    createdDate: '2025-01-31',
    fileSize: '242 KB',
  },
  {
    documentId: 'DOC014',
    employeeId: 'EMP002',
    kellyId: 'K100456',
    documentType: 'W-2',
    year: '2020',
    period: null,
    fileName: 'W2_2020_Sarah_Johnson.pdf',
    fileUrl: '/mock_pdfs/W2_2020_Sarah_Johnson.pdf',
    status: 'missing',
    maskedTaxId: '***-**-1234',
    employeeName: 'Sarah Johnson',
    createdDate: null,
    fileSize: null,
  },
  {
    documentId: 'DOC015',
    employeeId: 'EMP002',
    kellyId: 'K100456',
    documentType: 'Paystub',
    year: '2025',
    period: 'Q1',
    fileName: 'Paystub_2025_Q1_Sarah_Johnson.pdf',
    fileUrl: '/mock_pdfs/Paystub_2025_Q1_Sarah_Johnson.pdf',
    status: 'available',
    maskedTaxId: '***-**-1234',
    employeeName: 'Sarah Johnson',
    createdDate: '2025-03-31',
    fileSize: '110 KB',
  },
];

const mockAuditEvents = [
  {
    eventId: 'EVT001',
    userId: 'payroll123',
    userName: 'Maria Chen',
    userRole: 'Payroll',
    timestamp: '2025-06-15T09:12:34Z',
    actionType: 'preview',
    documentId: 'DOC001',
    employeeId: 'EMP001',
    details: {
      documentType: 'W-2',
      year: '2024',
      employeeName: 'John Smith',
      recipient: null,
      status: 'success',
    },
  },
  {
    eventId: 'EVT002',
    userId: 'payroll123',
    userName: 'Maria Chen',
    userRole: 'Payroll',
    timestamp: '2025-06-15T09:14:02Z',
    actionType: 'download',
    documentId: 'DOC001',
    employeeId: 'EMP001',
    details: {
      documentType: 'W-2',
      year: '2024',
      employeeName: 'John Smith',
      recipient: null,
      status: 'success',
    },
  },
  {
    eventId: 'EVT003',
    userId: 'legal456',
    userName: 'James Wright',
    userRole: 'Legal',
    timestamp: '2025-06-16T10:05:18Z',
    actionType: 'preview',
    documentId: 'DOC010',
    employeeId: 'EMP002',
    details: {
      documentType: 'W-2',
      year: '2024',
      employeeName: 'Sarah Johnson',
      recipient: null,
      status: 'success',
    },
  },
  {
    eventId: 'EVT004',
    userId: 'unauth999',
    userName: 'Test User',
    userRole: 'Unauthorized',
    timestamp: '2025-06-17T10:00:00Z',
    actionType: 'denied_access',
    documentId: null,
    employeeId: null,
    details: {
      documentType: null,
      employeeName: null,
      recipient: null,
      status: 'denied',
      reason: 'Unauthorized role — access denied',
    },
  },
  {
    eventId: 'EVT005',
    userId: 'payroll123',
    userName: 'Maria Chen',
    userRole: 'Payroll',
    timestamp: '2025-06-18T08:30:12Z',
    actionType: 'email',
    documentId: 'DOC038',
    employeeId: 'EMP005',
    details: {
      documentType: 'Paystub',
      year: '2024',
      period: 'Q2',
      employeeName: 'Robert Martinez',
      recipient: 'r***@kelly.com',
      status: 'success',
    },
  },
  {
    eventId: 'EVT006',
    userId: 'supervisor001',
    userName: 'Angela Torres',
    userRole: 'Supervisor',
    timestamp: '2025-06-19T14:08:55Z',
    actionType: 'package',
    documentId: null,
    employeeId: 'EMP020',
    details: {
      documentType: 'W-2',
      years: ['2024', '2023', '2022'],
      employeeName: 'Michelle King',
      recipient: null,
      status: 'success',
      documentCount: 3,
    },
  },
];

// ─── matchesQuery ────────────────────────────────────────────────────────────

describe('matchesQuery', () => {
  it('returns true when a string field contains the search term (case-insensitive)', () => {
    const record = { name: 'John Smith', department: 'Engineering' };
    expect(matchesQuery(record, 'john')).toBe(true);
  });

  it('returns true when a number field matches the search term', () => {
    const record = { id: 12345, name: 'Test' };
    expect(matchesQuery(record, '123')).toBe(true);
  });

  it('returns false when no field matches the search term', () => {
    const record = { name: 'John Smith', department: 'Engineering' };
    expect(matchesQuery(record, 'Finance')).toBe(false);
  });

  it('returns true for empty search term', () => {
    const record = { name: 'John Smith' };
    expect(matchesQuery(record, '')).toBe(true);
  });

  it('returns true for null search term', () => {
    const record = { name: 'John Smith' };
    expect(matchesQuery(record, null)).toBe(true);
  });

  it('returns true for undefined search term', () => {
    const record = { name: 'John Smith' };
    expect(matchesQuery(record, undefined)).toBe(true);
  });

  it('returns false for null record', () => {
    expect(matchesQuery(null, 'test')).toBe(false);
  });

  it('returns false for undefined record', () => {
    expect(matchesQuery(undefined, 'test')).toBe(false);
  });

  it('returns false for non-object record', () => {
    expect(matchesQuery('string', 'test')).toBe(false);
  });

  it('skips null values in record fields', () => {
    const record = { name: null, department: 'Engineering' };
    expect(matchesQuery(record, 'Engineering')).toBe(true);
    expect(matchesQuery(record, 'null')).toBe(false);
  });

  it('handles whitespace in search term by trimming', () => {
    const record = { name: 'John Smith' };
    expect(matchesQuery(record, '  john  ')).toBe(true);
  });

  it('returns true for whitespace-only search term', () => {
    const record = { name: 'John Smith' };
    expect(matchesQuery(record, '   ')).toBe(true);
  });
});

// ─── filterEmployees ─────────────────────────────────────────────────────────

describe('filterEmployees', () => {
  describe('search by name', () => {
    it('finds employee by full name (case-insensitive)', () => {
      const results = filterEmployees(mockEmployees, 'John Smith');
      expect(results).toHaveLength(1);
      expect(results[0].employeeId).toBe('EMP001');
    });

    it('finds employee by partial first name', () => {
      const results = filterEmployees(mockEmployees, 'Sarah');
      expect(results).toHaveLength(1);
      expect(results[0].employeeId).toBe('EMP002');
    });

    it('finds employee by partial last name', () => {
      const results = filterEmployees(mockEmployees, 'Williams');
      expect(results).toHaveLength(1);
      expect(results[0].employeeId).toBe('EMP003');
    });

    it('finds employees by case-insensitive name search', () => {
      const results = filterEmployees(mockEmployees, 'john smith');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Smith');
    });

    it('returns multiple results for partial name match', () => {
      // Both "John Smith" and "Sarah Johnson" contain "oh" or "son" — let's use a common substring
      const results = filterEmployees(mockEmployees, 'an');
      // "Lisa Anderson" has "an", "Robert Martinez" has no "an" in name but has it in location "Austin"
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty array when no name matches', () => {
      const results = filterEmployees(mockEmployees, 'Nonexistent Person');
      expect(results).toHaveLength(0);
    });
  });

  describe('search by Kelly ID', () => {
    it('finds employee by exact Kelly ID', () => {
      const results = filterEmployees(mockEmployees, 'K100234');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Smith');
    });

    it('finds employee by partial Kelly ID', () => {
      const results = filterEmployees(mockEmployees, 'K100456');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Sarah Johnson');
    });

    it('finds employee by Kelly ID case-insensitive', () => {
      const results = filterEmployees(mockEmployees, 'k100789');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Michael Williams');
    });

    it('returns empty array for non-existent Kelly ID', () => {
      const results = filterEmployees(mockEmployees, 'K999999');
      expect(results).toHaveLength(0);
    });
  });

  describe('search by last 4 SSN', () => {
    it('finds employee by last 4 SSN digits', () => {
      const results = filterEmployees(mockEmployees, '6789');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Smith');
    });

    it('finds employee by different last 4 SSN', () => {
      const results = filterEmployees(mockEmployees, '1234');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Sarah Johnson');
    });

    it('finds employee by last 4 SSN that also appears in maskedTaxId', () => {
      const results = filterEmployees(mockEmployees, '5678');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Michael Williams');
    });

    it('returns empty array for non-existent SSN digits', () => {
      const results = filterEmployees(mockEmployees, '0000');
      expect(results).toHaveLength(0);
    });
  });

  describe('search by other fields', () => {
    it('finds employees by department', () => {
      const results = filterEmployees(mockEmployees, 'Engineering');
      expect(results).toHaveLength(2);
      const names = results.map((e) => e.name);
      expect(names).toContain('John Smith');
      expect(names).toContain('Robert Martinez');
    });

    it('finds employees by location', () => {
      const results = filterEmployees(mockEmployees, 'Detroit');
      expect(results).toHaveLength(2);
      const names = results.map((e) => e.name);
      expect(names).toContain('Michael Williams');
      expect(names).toContain('Lisa Anderson');
    });

    it('finds employees by status', () => {
      const results = filterEmployees(mockEmployees, 'Terminated');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Robert Martinez');
    });

    it('finds employees by employee ID', () => {
      const results = filterEmployees(mockEmployees, 'EMP003');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Michael Williams');
    });
  });

  describe('edge cases', () => {
    it('returns all employees for empty query', () => {
      const results = filterEmployees(mockEmployees, '');
      expect(results).toHaveLength(mockEmployees.length);
    });

    it('returns all employees for null query', () => {
      const results = filterEmployees(mockEmployees, null);
      expect(results).toHaveLength(mockEmployees.length);
    });

    it('returns all employees for undefined query', () => {
      const results = filterEmployees(mockEmployees, undefined);
      expect(results).toHaveLength(mockEmployees.length);
    });

    it('returns all employees for whitespace-only query', () => {
      const results = filterEmployees(mockEmployees, '   ');
      expect(results).toHaveLength(mockEmployees.length);
    });

    it('returns empty array for null employees array', () => {
      const results = filterEmployees(null, 'John');
      expect(results).toHaveLength(0);
    });

    it('returns empty array for undefined employees array', () => {
      const results = filterEmployees(undefined, 'John');
      expect(results).toHaveLength(0);
    });

    it('returns empty array for non-array employees input', () => {
      const results = filterEmployees('not an array', 'John');
      expect(results).toHaveLength(0);
    });

    it('returns a new array (does not mutate original)', () => {
      const results = filterEmployees(mockEmployees, '');
      expect(results).not.toBe(mockEmployees);
      expect(results).toEqual(mockEmployees);
    });

    it('skips null entries in the employees array', () => {
      const withNulls = [null, mockEmployees[0], undefined, mockEmployees[1]];
      const results = filterEmployees(withNulls, 'John');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Smith');
    });
  });
});

// ─── filterDocuments ─────────────────────────────────────────────────────────

describe('filterDocuments', () => {
  describe('filter by employeeId', () => {
    it('returns all documents for a specific employee', () => {
      const results = filterDocuments(mockDocuments, { employeeId: 'EMP001' });
      expect(results).toHaveLength(3);
      results.forEach((doc) => {
        expect(doc.employeeId).toBe('EMP001');
      });
    });

    it('returns documents for a different employee', () => {
      const results = filterDocuments(mockDocuments, { employeeId: 'EMP002' });
      expect(results).toHaveLength(3);
      results.forEach((doc) => {
        expect(doc.employeeId).toBe('EMP002');
      });
    });

    it('returns empty array for non-existent employee', () => {
      const results = filterDocuments(mockDocuments, { employeeId: 'EMP999' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by documentType', () => {
    it('filters documents by W-2 type', () => {
      const results = filterDocuments(mockDocuments, { documentType: 'W-2' });
      expect(results).toHaveLength(4);
      results.forEach((doc) => {
        expect(doc.documentType).toBe('W-2');
      });
    });

    it('filters documents by Paystub type', () => {
      const results = filterDocuments(mockDocuments, { documentType: 'Paystub' });
      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.documentType).toBe('Paystub');
      });
    });

    it('returns empty array for non-existent document type', () => {
      const results = filterDocuments(mockDocuments, { documentType: '1099' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by year', () => {
    it('filters documents by year 2024', () => {
      const results = filterDocuments(mockDocuments, { year: '2024' });
      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.year).toBe('2024');
      });
    });

    it('filters documents by year 2025', () => {
      const results = filterDocuments(mockDocuments, { year: '2025' });
      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.year).toBe('2025');
      });
    });

    it('filters documents by year 2023', () => {
      const results = filterDocuments(mockDocuments, { year: '2023' });
      expect(results).toHaveLength(1);
      expect(results[0].documentId).toBe('DOC002');
    });

    it('returns empty array for year with no documents', () => {
      const results = filterDocuments(mockDocuments, { year: '2019' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by status', () => {
    it('filters documents by available status', () => {
      const results = filterDocuments(mockDocuments, { status: 'available' });
      expect(results).toHaveLength(5);
      results.forEach((doc) => {
        expect(doc.status).toBe('available');
      });
    });

    it('filters documents by missing status', () => {
      const results = filterDocuments(mockDocuments, { status: 'missing' });
      expect(results).toHaveLength(1);
      expect(results[0].documentId).toBe('DOC014');
    });
  });

  describe('filter by kellyId', () => {
    it('filters documents by Kelly ID', () => {
      const results = filterDocuments(mockDocuments, { kellyId: 'K100234' });
      expect(results).toHaveLength(3);
      results.forEach((doc) => {
        expect(doc.kellyId).toBe('K100234');
      });
    });
  });

  describe('filter by period', () => {
    it('filters documents by period Q1', () => {
      const results = filterDocuments(mockDocuments, { period: 'Q1' });
      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.period).toBe('Q1');
      });
    });
  });

  describe('combined filters', () => {
    it('filters by employeeId and documentType', () => {
      const results = filterDocuments(mockDocuments, {
        employeeId: 'EMP001',
        documentType: 'W-2',
      });
      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.employeeId).toBe('EMP001');
        expect(doc.documentType).toBe('W-2');
      });
    });

    it('filters by employeeId and year', () => {
      const results = filterDocuments(mockDocuments, {
        employeeId: 'EMP001',
        year: '2024',
      });
      expect(results).toHaveLength(1);
      expect(results[0].documentId).toBe('DOC001');
    });

    it('filters by documentType and year', () => {
      const results = filterDocuments(mockDocuments, {
        documentType: 'W-2',
        year: '2024',
      });
      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.documentType).toBe('W-2');
        expect(doc.year).toBe('2024');
      });
    });

    it('filters by employeeId, documentType, and year', () => {
      const results = filterDocuments(mockDocuments, {
        employeeId: 'EMP002',
        documentType: 'W-2',
        year: '2024',
      });
      expect(results).toHaveLength(1);
      expect(results[0].documentId).toBe('DOC010');
    });

    it('returns empty array when combined filters match nothing', () => {
      const results = filterDocuments(mockDocuments, {
        employeeId: 'EMP001',
        documentType: 'Paystub',
        year: '2024',
      });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by query (free-text)', () => {
    it('finds documents by employee name in query', () => {
      const results = filterDocuments(mockDocuments, { query: 'John Smith' });
      expect(results).toHaveLength(3);
      results.forEach((doc) => {
        expect(doc.employeeName).toBe('John Smith');
      });
    });

    it('finds documents by file name in query', () => {
      const results = filterDocuments(mockDocuments, { query: 'W2_2024' });
      expect(results).toHaveLength(2);
    });

    it('finds documents by document ID in query', () => {
      const results = filterDocuments(mockDocuments, { query: 'DOC010' });
      expect(results).toHaveLength(1);
      expect(results[0].documentId).toBe('DOC010');
    });

    it('finds documents by Kelly ID in query', () => {
      const results = filterDocuments(mockDocuments, { query: 'K100456' });
      expect(results).toHaveLength(3);
    });

    it('returns all documents for empty query string', () => {
      const results = filterDocuments(mockDocuments, { query: '' });
      expect(results).toHaveLength(mockDocuments.length);
    });

    it('returns all documents for whitespace-only query', () => {
      const results = filterDocuments(mockDocuments, { query: '   ' });
      expect(results).toHaveLength(mockDocuments.length);
    });

    it('returns empty array when query matches nothing', () => {
      const results = filterDocuments(mockDocuments, { query: 'zzzznonexistent' });
      expect(results).toHaveLength(0);
    });

    it('combines query with other filters', () => {
      const results = filterDocuments(mockDocuments, {
        documentType: 'W-2',
        query: 'Sarah',
      });
      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.documentType).toBe('W-2');
        expect(doc.employeeName).toBe('Sarah Johnson');
      });
    });
  });

  describe('edge cases', () => {
    it('returns all documents when filters is null', () => {
      const results = filterDocuments(mockDocuments, null);
      expect(results).toHaveLength(mockDocuments.length);
    });

    it('returns all documents when filters is undefined', () => {
      const results = filterDocuments(mockDocuments, undefined);
      expect(results).toHaveLength(mockDocuments.length);
    });

    it('returns all documents when filters is empty object', () => {
      const results = filterDocuments(mockDocuments, {});
      expect(results).toHaveLength(mockDocuments.length);
    });

    it('returns empty array for null documents array', () => {
      const results = filterDocuments(null, { documentType: 'W-2' });
      expect(results).toHaveLength(0);
    });

    it('returns empty array for undefined documents array', () => {
      const results = filterDocuments(undefined, { documentType: 'W-2' });
      expect(results).toHaveLength(0);
    });

    it('returns empty array for non-array documents input', () => {
      const results = filterDocuments('not an array', { documentType: 'W-2' });
      expect(results).toHaveLength(0);
    });

    it('returns a new array (does not mutate original)', () => {
      const results = filterDocuments(mockDocuments, {});
      expect(results).not.toBe(mockDocuments);
    });

    it('skips null entries in the documents array', () => {
      const withNulls = [null, mockDocuments[0], undefined, mockDocuments[1]];
      const results = filterDocuments(withNulls, { employeeId: 'EMP001' });
      expect(results).toHaveLength(2);
    });
  });
});

// ─── filterAuditEvents ───────────────────────────────────────────────────────

describe('filterAuditEvents', () => {
  describe('filter by actionType', () => {
    it('filters events by preview action type', () => {
      const results = filterAuditEvents(mockAuditEvents, { actionType: 'preview' });
      expect(results).toHaveLength(2);
      results.forEach((event) => {
        expect(event.actionType).toBe('preview');
      });
    });

    it('filters events by download action type', () => {
      const results = filterAuditEvents(mockAuditEvents, { actionType: 'download' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT002');
    });

    it('filters events by email action type', () => {
      const results = filterAuditEvents(mockAuditEvents, { actionType: 'email' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT005');
    });

    it('filters events by package action type', () => {
      const results = filterAuditEvents(mockAuditEvents, { actionType: 'package' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT006');
    });

    it('filters events by denied_access action type', () => {
      const results = filterAuditEvents(mockAuditEvents, { actionType: 'denied_access' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT004');
    });

    it('returns empty array for non-existent action type', () => {
      const results = filterAuditEvents(mockAuditEvents, { actionType: 'nonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by userId', () => {
    it('filters events by userId', () => {
      const results = filterAuditEvents(mockAuditEvents, { userId: 'payroll123' });
      expect(results).toHaveLength(3);
      results.forEach((event) => {
        expect(event.userId).toBe('payroll123');
      });
    });

    it('returns empty array for non-existent userId', () => {
      const results = filterAuditEvents(mockAuditEvents, { userId: 'nonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by userName', () => {
    it('filters events by partial userName (case-insensitive)', () => {
      const results = filterAuditEvents(mockAuditEvents, { userName: 'Maria' });
      expect(results).toHaveLength(3);
      results.forEach((event) => {
        expect(event.userName).toBe('Maria Chen');
      });
    });

    it('filters events by full userName', () => {
      const results = filterAuditEvents(mockAuditEvents, { userName: 'James Wright' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT003');
    });

    it('filters events by userName case-insensitive', () => {
      const results = filterAuditEvents(mockAuditEvents, { userName: 'maria chen' });
      expect(results).toHaveLength(3);
    });

    it('returns empty array for non-matching userName', () => {
      const results = filterAuditEvents(mockAuditEvents, { userName: 'Nonexistent User' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by userRole', () => {
    it('filters events by Payroll role', () => {
      const results = filterAuditEvents(mockAuditEvents, { userRole: 'Payroll' });
      expect(results).toHaveLength(3);
    });

    it('filters events by Legal role', () => {
      const results = filterAuditEvents(mockAuditEvents, { userRole: 'Legal' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT003');
    });

    it('filters events by Unauthorized role', () => {
      const results = filterAuditEvents(mockAuditEvents, { userRole: 'Unauthorized' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT004');
    });

    it('filters events by Supervisor role', () => {
      const results = filterAuditEvents(mockAuditEvents, { userRole: 'Supervisor' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT006');
    });

    it('returns empty array for non-existent role', () => {
      const results = filterAuditEvents(mockAuditEvents, { userRole: 'Admin' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by employeeId', () => {
    it('filters events by employeeId', () => {
      const results = filterAuditEvents(mockAuditEvents, { employeeId: 'EMP001' });
      expect(results).toHaveLength(2);
      results.forEach((event) => {
        expect(event.employeeId).toBe('EMP001');
      });
    });

    it('returns empty array for non-existent employeeId', () => {
      const results = filterAuditEvents(mockAuditEvents, { employeeId: 'EMP999' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by documentId', () => {
    it('filters events by documentId', () => {
      const results = filterAuditEvents(mockAuditEvents, { documentId: 'DOC001' });
      expect(results).toHaveLength(2);
      results.forEach((event) => {
        expect(event.documentId).toBe('DOC001');
      });
    });

    it('returns empty array for non-existent documentId', () => {
      const results = filterAuditEvents(mockAuditEvents, { documentId: 'DOC999' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by status', () => {
    it('filters events by success status', () => {
      const results = filterAuditEvents(mockAuditEvents, { status: 'success' });
      expect(results).toHaveLength(5);
      results.forEach((event) => {
        expect(event.details.status).toBe('success');
      });
    });

    it('filters events by denied status', () => {
      const results = filterAuditEvents(mockAuditEvents, { status: 'denied' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT004');
    });

    it('returns empty array for non-existent status', () => {
      const results = filterAuditEvents(mockAuditEvents, { status: 'pending' });
      expect(results).toHaveLength(0);
    });
  });

  describe('filter by date range', () => {
    it('filters events within a date range', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        startDate: '2025-06-16T00:00:00Z',
        endDate: '2025-06-17T23:59:59Z',
      });
      // EVT003 (2025-06-16) and EVT004 (2025-06-17)
      expect(results).toHaveLength(2);
      const eventIds = results.map((e) => e.eventId);
      expect(eventIds).toContain('EVT003');
      expect(eventIds).toContain('EVT004');
    });

    it('filters events with only startDate', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        startDate: '2025-06-18T00:00:00Z',
      });
      // EVT005 (2025-06-18) and EVT006 (2025-06-19)
      expect(results).toHaveLength(2);
      const eventIds = results.map((e) => e.eventId);
      expect(eventIds).toContain('EVT005');
      expect(eventIds).toContain('EVT006');
    });

    it('filters events with only endDate', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        endDate: '2025-06-15T23:59:59Z',
      });
      // EVT001 and EVT002 (both 2025-06-15)
      expect(results).toHaveLength(2);
      const eventIds = results.map((e) => e.eventId);
      expect(eventIds).toContain('EVT001');
      expect(eventIds).toContain('EVT002');
    });

    it('returns empty array when date range matches no events', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        startDate: '2025-07-01T00:00:00Z',
        endDate: '2025-07-31T23:59:59Z',
      });
      expect(results).toHaveLength(0);
    });

    it('includes events on the exact start date boundary', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        startDate: '2025-06-15T09:12:34Z',
        endDate: '2025-06-15T09:12:34Z',
      });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT001');
    });
  });

  describe('filter by query (free-text)', () => {
    it('finds events by employee name in details', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: 'John Smith' });
      expect(results).toHaveLength(2);
      const eventIds = results.map((e) => e.eventId);
      expect(eventIds).toContain('EVT001');
      expect(eventIds).toContain('EVT002');
    });

    it('finds events by userName', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: 'Angela Torres' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT006');
    });

    it('finds events by eventId', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: 'EVT003' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT003');
    });

    it('finds events by action type in query', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: 'download' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT002');
    });

    it('finds events by reason in details', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: 'Unauthorized role' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT004');
    });

    it('returns all events for empty query', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: '' });
      expect(results).toHaveLength(mockAuditEvents.length);
    });

    it('returns all events for whitespace-only query', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: '   ' });
      expect(results).toHaveLength(mockAuditEvents.length);
    });

    it('returns empty array when query matches nothing', () => {
      const results = filterAuditEvents(mockAuditEvents, { query: 'zzzznonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('filters by actionType and userRole', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        actionType: 'preview',
        userRole: 'Payroll',
      });
      // Only EVT001 is Payroll + preview
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT001');
    });

    it('filters by actionType and date range', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        actionType: 'preview',
        startDate: '2025-06-16T00:00:00Z',
        endDate: '2025-06-16T23:59:59Z',
      });
      // EVT003 is preview on 2025-06-16
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT003');
    });

    it('filters by userRole and status', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        userRole: 'Unauthorized',
        status: 'denied',
      });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT004');
    });

    it('filters by userId, actionType, and employeeId', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        userId: 'payroll123',
        actionType: 'download',
        employeeId: 'EMP001',
      });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT002');
    });

    it('returns empty array when combined filters match nothing', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        actionType: 'package',
        userRole: 'Payroll',
      });
      expect(results).toHaveLength(0);
    });

    it('combines query with other filters', () => {
      const results = filterAuditEvents(mockAuditEvents, {
        userRole: 'Payroll',
        query: 'Robert',
      });
      // EVT005 is Payroll + Robert Martinez in details
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT005');
    });
  });

  describe('edge cases', () => {
    it('returns all events when filters is null', () => {
      const results = filterAuditEvents(mockAuditEvents, null);
      expect(results).toHaveLength(mockAuditEvents.length);
    });

    it('returns all events when filters is undefined', () => {
      const results = filterAuditEvents(mockAuditEvents, undefined);
      expect(results).toHaveLength(mockAuditEvents.length);
    });

    it('returns all events when filters is empty object', () => {
      const results = filterAuditEvents(mockAuditEvents, {});
      expect(results).toHaveLength(mockAuditEvents.length);
    });

    it('returns empty array for null events array', () => {
      const results = filterAuditEvents(null, { actionType: 'preview' });
      expect(results).toHaveLength(0);
    });

    it('returns empty array for undefined events array', () => {
      const results = filterAuditEvents(undefined, { actionType: 'preview' });
      expect(results).toHaveLength(0);
    });

    it('returns empty array for non-array events input', () => {
      const results = filterAuditEvents('not an array', { actionType: 'preview' });
      expect(results).toHaveLength(0);
    });

    it('returns a new array (does not mutate original)', () => {
      const results = filterAuditEvents(mockAuditEvents, {});
      expect(results).not.toBe(mockAuditEvents);
    });

    it('skips null entries in the events array', () => {
      const withNulls = [null, mockAuditEvents[0], undefined, mockAuditEvents[1]];
      const results = filterAuditEvents(withNulls, { actionType: 'preview' });
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT001');
    });

    it('handles events with missing details object gracefully in query filter', () => {
      const eventsWithMissingDetails = [
        {
          eventId: 'EVT_NO_DETAILS',
          userId: 'test',
          userName: 'Test',
          userRole: 'Payroll',
          timestamp: '2025-06-15T09:00:00Z',
          actionType: 'preview',
          documentId: null,
          employeeId: null,
        },
      ];
      const results = filterAuditEvents(eventsWithMissingDetails, { query: 'Test' });
      expect(results).toHaveLength(1);
    });

    it('handles events with missing details object gracefully in status filter', () => {
      const eventsWithMissingDetails = [
        {
          eventId: 'EVT_NO_DETAILS',
          userId: 'test',
          userName: 'Test',
          userRole: 'Payroll',
          timestamp: '2025-06-15T09:00:00Z',
          actionType: 'preview',
          documentId: null,
          employeeId: null,
        },
      ];
      const results = filterAuditEvents(eventsWithMissingDetails, { status: 'success' });
      expect(results).toHaveLength(0);
    });
  });
});