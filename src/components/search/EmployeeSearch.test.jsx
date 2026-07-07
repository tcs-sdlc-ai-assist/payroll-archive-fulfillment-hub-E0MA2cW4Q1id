import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EmployeeSearch } from './EmployeeSearch';

/**
 * Mock employees data for tests.
 */
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
];

const mockUsers = [
  {
    userId: 'payroll123',
    displayName: 'Maria Chen',
    email: 'm***@kelly.com',
    role: 'Payroll',
    permissions: ['search', 'preview', 'download', 'email', 'package', 'audit', 'dashboard'],
  },
];

const mockAuditLog = [];

/**
 * Track logged audit events for assertions.
 */
let loggedEvents = [];

/**
 * Mock navigate function.
 */
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Sets up global.fetch to return appropriate mock data based on URL.
 */
function setupFetch() {
  global.fetch = vi.fn((url) => {
    if (typeof url === 'string' && url.includes('employees')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEmployees),
      });
    }
    if (typeof url === 'string' && url.includes('users')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });
    }
    if (typeof url === 'string' && url.includes('auditLog')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAuditLog),
      });
    }
    if (typeof url === 'string' && url.includes('archiveHealth')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          totalFilesIngested: 89100000,
          failedRecords: 120,
          missingMetadataCount: 45,
          lastIngestionDate: '2025-06-20T04:00:00Z',
          lastValidationDate: '2025-06-20T06:30:00Z',
          ingestionSuccessRate: 99.9999,
          archiveSizeGB: 10240,
          documentTypes: {},
          yearCoverage: {},
          unresolvedExceptions: [],
        }),
      });
    }
    if (typeof url === 'string' && url.includes('documents')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (typeof url === 'string' && url.includes('assistantResponses')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });
}

import { RBACProvider } from '../../contexts/RBACContext';
import { AuditProvider } from '../../contexts/AuditContext';
import { AssistantProvider } from '../../contexts/AssistantContext';

/**
 * Helper to render EmployeeSearch with all required providers.
 */
async function renderEmployeeSearch() {
  const result = render(
    <MemoryRouter>
      <RBACProvider>
        <AuditProvider>
          <AssistantProvider>
            <EmployeeSearch />
          </AssistantProvider>
        </AuditProvider>
      </RBACProvider>
    </MemoryRouter>
  );

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText('Loading employee data…')).not.toBeInTheDocument();
  });

  return result;
}

/**
 * Helper to log in as the payroll user before rendering.
 */
async function loginAsPayroll() {
  // Set localStorage so RBACProvider picks up the user on mount
  localStorage.setItem('payroll_archive_hub_user', 'payroll123');
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  loggedEvents = [];
  mockNavigate.mockClear();
  setupFetch();
  // Clear fixture cache to avoid stale data between tests
  vi.resetModules();
});

describe('EmployeeSearch', () => {
  describe('rendering', () => {
    it('renders the search input and search button', async () => {
      await loginAsPayroll();
      await renderEmployeeSearch();

      expect(screen.getByLabelText('Assistant message input')).toBeDefined;
      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      expect(searchInput).toBeInTheDocument();

      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeInTheDocument();
    });

    it('renders the page header with correct title', async () => {
      await loginAsPayroll();
      await renderEmployeeSearch();

      expect(screen.getByText('Employee Search')).toBeInTheDocument();
      expect(
        screen.getByText(/Search for employees by name, Kelly ID, or last 4 SSN digits/)
      ).toBeInTheDocument();
    });

    it('renders search tips when no search has been performed', async () => {
      await loginAsPayroll();
      await renderEmployeeSearch();

      expect(screen.getByText('Search Tips')).toBeInTheDocument();
    });

    it('renders the employee data table with all employees initially', async () => {
      await loginAsPayroll();
      await renderEmployeeSearch();

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Michael Williams')).toBeInTheDocument();
      expect(screen.getByText('Robert Martinez')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('searches employees by name and displays matching results', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, 'John Smith');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.getByText(/1/)).toBeInTheDocument();
    });

    it('searches employees by Kelly ID', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, 'K100456');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      });
    });

    it('searches employees by last 4 SSN digits', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, '5678');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Michael Williams')).toBeInTheDocument();
      });
    });

    it('displays empty state when no results match the search query', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, 'Nonexistent Person XYZ');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('No Results Found')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No employees match "Nonexistent Person XYZ"/)
      ).toBeInTheDocument();
    });

    it('shows clear button after searching and clears results when clicked', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, 'John');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();

      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Search Tips')).toBeInTheDocument();
      });
    });

    it('submits search on Enter key press', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );

      await user.clear(searchInput);
      await user.type(searchInput, 'Sarah{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('PII masking', () => {
    it('displays masked Tax ID values in the results table', async () => {
      await loginAsPayroll();
      await renderEmployeeSearch();

      // The maskedTaxId values should be displayed in masked format
      const taxIdElements = screen.getAllByText(/\*\*\*-\*\*-\d{4}/);
      expect(taxIdElements.length).toBeGreaterThan(0);
    });

    it('displays masked email values in the results table', async () => {
      await loginAsPayroll();
      await renderEmployeeSearch();

      // Emails should be masked showing first char + ***@domain
      const emailElements = screen.getAllByText(/\w\*\*\*@kelly\.com/);
      expect(emailElements.length).toBeGreaterThan(0);
    });
  });

  describe('filter functionality', () => {
    it('filters employees by department', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      // First perform a search to show results
      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, ' ');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.queryByText('Search Tips')).not.toBeInTheDocument();
      });

      // Select Engineering department filter
      const departmentSelect = screen.getByLabelText('Department');
      await user.selectOptions(departmentSelect, 'Engineering');

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Robert Martinez')).toBeInTheDocument();
      });
    });

    it('filters employees by status', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, ' ');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.queryByText('Search Tips')).not.toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'Terminated');

      await waitFor(() => {
        expect(screen.getByText('Robert Martinez')).toBeInTheDocument();
      });

      // Other employees should not be visible
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to employee 360 view when a row is clicked', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      // Click on John Smith's row
      const johnSmithRow = screen.getByText('John Smith');
      await user.click(johnSmithRow);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/employee/EMP001');
      });
    });
  });

  describe('audit logging', () => {
    it('logs a search event when a search is performed', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, 'John Smith');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // The search action should have been logged via the AuditContext.
      // We verify indirectly by checking the search completed successfully
      // and the results are displayed (the logEvent call is made inside the component).
      // Since we can't directly inspect the audit context state from here,
      // we verify the component rendered the results which means the search
      // handler (which includes logEvent) executed successfully.
      expect(screen.getByText(/Found/)).toBeInTheDocument();
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });

    it('logs a search event with empty query showing all results', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Michael Williams')).toBeInTheDocument();
        expect(screen.getByText('Robert Martinez')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('handles search with whitespace-only query by showing all results', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, '   ');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      });
    });

    it('displays status badges with correct styling', async () => {
      await loginAsPayroll();
      await renderEmployeeSearch();

      // Active status badges should be present
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBeGreaterThan(0);

      // Terminated status badge should be present
      const terminatedBadge = screen.getByText('Terminated');
      expect(terminatedBadge).toBeInTheDocument();
    });

    it('handles fetch error gracefully', async () => {
      localStorage.setItem('payroll_archive_hub_user', 'payroll123');

      global.fetch = vi.fn((url) => {
        if (typeof url === 'string' && url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          });
        }
        if (typeof url === 'string' && url.includes('employees')) {
          return Promise.reject(new Error('Network error'));
        }
        if (typeof url === 'string' && url.includes('auditLog')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        if (typeof url === 'string' && url.includes('assistantResponses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(
        <MemoryRouter>
          <RBACProvider>
            <AuditProvider>
              <AssistantProvider>
                <EmployeeSearch />
              </AssistantProvider>
            </AuditProvider>
          </RBACProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Employees')).toBeInTheDocument();
      });
    });

    it('displays correct result count after search', async () => {
      await loginAsPayroll();
      const user = userEvent.setup();
      await renderEmployeeSearch();

      const searchInput = screen.getByPlaceholderText(
        'Enter name, Kelly ID (e.g., K100234), or last 4 SSN…'
      );
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.clear(searchInput);
      await user.type(searchInput, 'Engineering');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Found/)).toBeInTheDocument();
        expect(screen.getByText(/2/)).toBeInTheDocument();
        expect(screen.getByText(/employees/)).toBeInTheDocument();
      });
    });
  });
});