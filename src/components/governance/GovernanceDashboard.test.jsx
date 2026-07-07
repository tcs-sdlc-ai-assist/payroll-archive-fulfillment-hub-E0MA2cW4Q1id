import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GovernanceDashboard } from './GovernanceDashboard';
import { RBACProvider } from '../../contexts/RBACContext';
import { AuditProvider } from '../../contexts/AuditContext';
import { AssistantProvider } from '../../contexts/AssistantContext';

/**
 * Mock users data for tests.
 */
const mockUsers = [
  {
    userId: 'supervisor001',
    displayName: 'Angela Torres',
    email: 'a***@kelly.com',
    role: 'Supervisor',
    permissions: ['search', 'preview', 'download', 'email', 'package', 'audit', 'dashboard', 'governance'],
  },
  {
    userId: 'payroll123',
    displayName: 'Maria Chen',
    email: 'm***@kelly.com',
    role: 'Payroll',
    permissions: ['search', 'preview', 'download', 'email', 'package', 'audit', 'dashboard'],
  },
  {
    userId: 'efsc321',
    displayName: 'David Kim',
    email: 'd***@kelly.com',
    role: 'EFSC',
    permissions: ['search', 'preview', 'audit', 'dashboard'],
  },
];

/**
 * Mock audit log data for tests.
 */
const mockAuditLog = [
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

/**
 * Mock archive health data for tests.
 */
const mockArchiveHealth = {
  totalFilesIngested: 89100000,
  failedRecords: 120,
  missingMetadataCount: 45,
  lastIngestionDate: '2025-06-20T04:00:00Z',
  lastValidationDate: '2025-06-20T06:30:00Z',
  ingestionSuccessRate: 99.9999,
  archiveSizeGB: 10240,
  documentTypes: {
    'W-2': 62370000,
    'Paystub': 26730000,
  },
  yearCoverage: {
    '2019': 14850000,
    '2020': 14850000,
    '2021': 14850000,
    '2022': 14850000,
    '2023': 14850000,
    '2024': 14850000,
  },
  unresolvedExceptions: [
    {
      id: 'EXC001',
      type: 'Missing SSN',
      description: 'Employee record missing Social Security Number',
      status: 'open',
      employeeId: 'EMP005',
      documentId: 'DOC035',
      timestamp: '2025-06-18T09:15:22Z',
    },
    {
      id: 'EXC002',
      type: 'Duplicate Record',
      description: 'Duplicate W-2 detected for tax year 2022',
      status: 'open',
      employeeId: 'EMP008',
      documentId: 'DOC062',
      timestamp: '2025-06-17T14:30:10Z',
    },
    {
      id: 'EXC003',
      type: 'Missing Metadata',
      description: 'Document ingested without required metadata fields',
      status: 'in_review',
      employeeId: 'EMP013',
      documentId: 'DOC091',
      timestamp: '2025-06-16T11:45:33Z',
    },
  ],
};

/**
 * Sets up global.fetch to return appropriate mock data based on URL.
 */
function setupFetch() {
  global.fetch = vi.fn((url) => {
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
        json: () => Promise.resolve(mockArchiveHealth),
      });
    }
    if (typeof url === 'string' && url.includes('employees')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
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

/**
 * Helper to log in as a specific user before rendering.
 * @param {string} userId - The userId to log in as
 */
function loginAs(userId) {
  localStorage.setItem('payroll_archive_hub_user', userId);
}

/**
 * Helper to render GovernanceDashboard with all required providers.
 */
function renderGovernanceDashboard() {
  return render(
    <MemoryRouter>
      <RBACProvider>
        <AuditProvider>
          <AssistantProvider>
            <GovernanceDashboard />
          </AssistantProvider>
        </AuditProvider>
      </RBACProvider>
    </MemoryRouter>
  );
}

/**
 * Helper to wait for providers to finish loading.
 */
async function waitForLoad() {
  await waitFor(() => {
    expect(screen.queryByText('Loading governance dashboard…')).not.toBeInTheDocument();
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  setupFetch();
  vi.resetModules();
});

describe('GovernanceDashboard', () => {
  describe('rendering for Supervisor role', () => {
    it('renders the page header with correct title', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Governance Dashboard')).toBeInTheDocument();
    });

    it('renders the page description with user info', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText(/Compliance overview, audit event summaries, and exception highlights/)).toBeInTheDocument();
      expect(screen.getByText('Angela Torres')).toBeInTheDocument();
    });

    it('renders summary cards with correct total events count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      // Total Events should be 6
      const totalEventsLabel = screen.getByText('Total Events');
      expect(totalEventsLabel).toBeInTheDocument();

      // Find the card containing "Total Events" and check the count
      const totalEventsCard = totalEventsLabel.closest('div');
      expect(totalEventsCard).toHaveTextContent('6');
    });

    it('renders summary cards with correct denied count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      // Denied count should be 1 (EVT004)
      const deniedLabel = screen.getByText('Denied');
      expect(deniedLabel).toBeInTheDocument();

      const deniedCard = deniedLabel.closest('div');
      expect(deniedCard).toHaveTextContent('1');
    });

    it('renders summary cards with correct successful count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const successfulLabel = screen.getByText('Successful');
      expect(successfulLabel).toBeInTheDocument();

      const successfulCard = successfulLabel.closest('div');
      expect(successfulCard).toHaveTextContent('5');
    });

    it('renders summary cards with correct previews count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const previewsLabel = screen.getByText('Previews');
      expect(previewsLabel).toBeInTheDocument();

      const previewsCard = previewsLabel.closest('div');
      expect(previewsCard).toHaveTextContent('2');
    });

    it('renders summary cards with correct downloads count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const downloadsLabel = screen.getByText('Downloads');
      expect(downloadsLabel).toBeInTheDocument();

      const downloadsCard = downloadsLabel.closest('div');
      expect(downloadsCard).toHaveTextContent('1');
    });

    it('renders summary cards with correct emails count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const emailsLabel = screen.getByText('Emails');
      expect(emailsLabel).toBeInTheDocument();

      const emailsCard = emailsLabel.closest('div');
      expect(emailsCard).toHaveTextContent('1');
    });

    it('renders summary cards with correct packages count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const packagesLabel = screen.getByText('Packages');
      expect(packagesLabel).toBeInTheDocument();

      const packagesCard = packagesLabel.closest('div');
      expect(packagesCard).toHaveTextContent('1');
    });

    it('renders summary cards with correct unique users count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const uniqueUsersLabel = screen.getByText('Unique Users');
      expect(uniqueUsersLabel).toBeInTheDocument();

      const uniqueUsersCard = uniqueUsersLabel.closest('div');
      // payroll123, legal456, unauth999, supervisor001 = 4 unique users
      expect(uniqueUsersCard).toHaveTextContent('4');
    });
  });

  describe('denied access highlights', () => {
    it('renders the Recent Denied Access Attempts section', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Recent Denied Access Attempts')).toBeInTheDocument();
    });

    it('displays denied access event details', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      // EVT004 is the denied access event by Test User
      expect(screen.getByText('1 total')).toBeInTheDocument();
      // The denied event should show the user name and reason
      const deniedSection = screen.getByText('Recent Denied Access Attempts').closest('div');
      expect(deniedSection).toHaveTextContent('Test User');
      expect(deniedSection).toHaveTextContent('Unauthorized');
    });
  });

  describe('unresolved exceptions highlights', () => {
    it('renders the Unresolved Archive Exceptions section', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Unresolved Archive Exceptions')).toBeInTheDocument();
    });

    it('displays the correct count of unresolved exceptions', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      // 3 exceptions total, but only 2 open + 1 in_review = 3 unresolved
      expect(screen.getByText('3 unresolved')).toBeInTheDocument();
    });

    it('displays exception type labels', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const exceptionsSection = screen.getByText('Unresolved Archive Exceptions').closest('div');
      expect(exceptionsSection).toHaveTextContent('Missing SSN');
      expect(exceptionsSection).toHaveTextContent('Duplicate Record');
      expect(exceptionsSection).toHaveTextContent('Missing Metadata');
    });

    it('displays exception descriptions', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText(/Employee record missing Social Security Number/)).toBeInTheDocument();
      expect(screen.getByText(/Duplicate W-2 detected for tax year 2022/)).toBeInTheDocument();
    });
  });

  describe('archive health overview', () => {
    it('renders the Archive Health Overview section', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Archive Health Overview')).toBeInTheDocument();
    });

    it('displays files ingested count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const healthSection = screen.getByText('Archive Health Overview').closest('div');
      expect(healthSection).toHaveTextContent('89,100,000');
    });

    it('displays success rate', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const healthSection = screen.getByText('Archive Health Overview').closest('div');
      expect(healthSection).toHaveTextContent('99.9999%');
    });

    it('displays failed records count', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const healthSection = screen.getByText('Archive Health Overview').closest('div');
      expect(healthSection).toHaveTextContent('120');
    });

    it('displays document types breakdown', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Document Types')).toBeInTheDocument();
    });

    it('displays year coverage', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Year Coverage')).toBeInTheDocument();
    });
  });

  describe('audit events table', () => {
    it('renders the Audit Events section', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Audit Events')).toBeInTheDocument();
    });

    it('displays the correct number of events', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('displays event IDs in the table', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('EVT001')).toBeInTheDocument();
      expect(screen.getByText('EVT002')).toBeInTheDocument();
      expect(screen.getByText('EVT003')).toBeInTheDocument();
      expect(screen.getByText('EVT004')).toBeInTheDocument();
      expect(screen.getByText('EVT005')).toBeInTheDocument();
      expect(screen.getByText('EVT006')).toBeInTheDocument();
    });

    it('displays user names in the table', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      // Maria Chen appears in multiple events
      const mariaChenElements = screen.getAllByText('Maria Chen');
      expect(mariaChenElements.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('James Wright')).toBeInTheDocument();
    });

    it('displays action type badges in the table', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      // Action badges
      const previewBadges = screen.getAllByText('Preview');
      expect(previewBadges.length).toBeGreaterThanOrEqual(1);

      const downloadBadges = screen.getAllByText('Download');
      expect(downloadBadges.length).toBeGreaterThanOrEqual(1);

      const emailBadges = screen.getAllByText('Email');
      expect(emailBadges.length).toBeGreaterThanOrEqual(1);

      const packageBadges = screen.getAllByText('Package');
      expect(packageBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('displays status badges in the table', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      const successBadges = screen.getAllByText('Success');
      expect(successBadges.length).toBeGreaterThanOrEqual(1);

      const deniedBadges = screen.getAllByText('Denied');
      expect(deniedBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('filter functionality', () => {
    it('renders filter controls', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByLabelText('Action')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('filters events by action type', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'preview');

      await waitFor(() => {
        // Should show 2 preview events
        expect(screen.getByText(/Showing/)).toBeInTheDocument();
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('2');
      });
    });

    it('filters events by role', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const roleSelect = screen.getByLabelText('Role');
      await user.selectOptions(roleSelect, 'Legal');

      await waitFor(() => {
        // Should show 1 Legal event
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('1');
      });
    });

    it('filters events by status', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'denied');

      await waitFor(() => {
        // Should show 1 denied event
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('1');
      });
    });

    it('shows filtered indicator when filters are active', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'download');

      await waitFor(() => {
        expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument();
      });
    });

    it('shows clear all filters button when filters are active', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'download');

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });
    });

    it('clears filters when clear all filters is clicked', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'download');

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear all filters');
      await user.click(clearButton);

      await waitFor(() => {
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('6');
      });
    });

    it('shows empty state when filters match no events', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      // Filter by action type that combined with role yields no results
      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'package');

      const roleSelect = screen.getByLabelText('Role');
      await user.selectOptions(roleSelect, 'Payroll');

      await waitFor(() => {
        expect(screen.getByText('No Audit Events Found')).toBeInTheDocument();
      });
    });
  });

  describe('access control', () => {
    it('shows access restricted message for non-Supervisor role', async () => {
      loginAs('payroll123');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.getByText(/The Governance Dashboard is accessible to Supervisor role only/)).toBeInTheDocument();
    });

    it('shows access restricted message for EFSC role', async () => {
      loginAs('efsc321');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });

    it('renders full dashboard for Supervisor role', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
      expect(screen.getByText('Governance Dashboard')).toBeInTheDocument();
    });
  });

  describe('governance notice', () => {
    it('renders the About the Governance Dashboard section', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText('About the Governance Dashboard')).toBeInTheDocument();
    });

    it('displays governance notice information', async () => {
      loginAs('supervisor001');
      renderGovernanceDashboard();
      await waitForLoad();

      expect(screen.getByText(/This dashboard provides a compliance overview/)).toBeInTheDocument();
      expect(screen.getByText(/Denied access attempts are highlighted for security review/)).toBeInTheDocument();
    });
  });

  describe('loading and error states', () => {
    it('shows loading spinner while data is loading', async () => {
      loginAs('supervisor001');

      // Make fetch hang to keep loading state
      let resolveUsers;
      global.fetch = vi.fn((url) => {
        if (typeof url === 'string' && url.includes('users')) {
          return new Promise((resolve) => {
            resolveUsers = resolve;
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
            json: () => Promise.resolve(mockArchiveHealth),
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

      renderGovernanceDashboard();

      // Should show loading state
      expect(screen.getByText('Loading governance dashboard…')).toBeInTheDocument();

      // Resolve the hanging fetch
      if (resolveUsers) {
        resolveUsers({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        });
      }
    });

    it('shows error state when audit log fails to load', async () => {
      loginAs('supervisor001');

      global.fetch = vi.fn((url) => {
        if (typeof url === 'string' && url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          });
        }
        if (typeof url === 'string' && url.includes('auditLog')) {
          return Promise.reject(new Error('Network error'));
        }
        if (typeof url === 'string' && url.includes('archiveHealth')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockArchiveHealth),
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

      renderGovernanceDashboard();

      await waitFor(() => {
        expect(screen.getByText('Error Loading Governance Data')).toBeInTheDocument();
      });
    });
  });

  describe('combined filters', () => {
    it('combines action type and status filters', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'preview');

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'success');

      await waitFor(() => {
        // 2 preview events, both success
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('2');
      });
    });

    it('combines role and action type filters', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const roleSelect = screen.getByLabelText('Role');
      await user.selectOptions(roleSelect, 'Payroll');

      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'preview');

      await waitFor(() => {
        // Only EVT001 is Payroll + preview
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('1');
      });
    });
  });

  describe('reset filters', () => {
    it('resets filters via the Reset button in the filter bar', async () => {
      loginAs('supervisor001');
      const user = userEvent.setup();
      renderGovernanceDashboard();
      await waitForLoad();

      const actionSelect = screen.getByLabelText('Action');
      await user.selectOptions(actionSelect, 'download');

      await waitFor(() => {
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('1');
      });

      // Click the Reset button in the FilterBar
      const resetButtons = screen.getAllByRole('button', { name: /reset/i });
      // There should be at least one reset button
      expect(resetButtons.length).toBeGreaterThanOrEqual(1);
      await user.click(resetButtons[0]);

      await waitFor(() => {
        const showingText = screen.getByText(/Showing/).textContent;
        expect(showingText).toContain('6');
      });
    });
  });
});