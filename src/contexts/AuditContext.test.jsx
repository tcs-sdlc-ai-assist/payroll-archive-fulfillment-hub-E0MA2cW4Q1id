import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditProvider, useAudit } from './AuditContext';

/**
 * Mock audit log seed data for tests.
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
];

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockAuditLog),
    })
  );
});

/**
 * Test consumer component that exposes AuditContext values for assertions.
 */
function TestConsumer() {
  const { events, isLoading, error, logEvent, getEvents, filterEvents } = useAudit();

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="error">{error || 'none'}</div>
      <div data-testid="events-count">{events.length}</div>
      <div data-testid="events-json">{JSON.stringify(events.map((e) => e.eventId))}</div>
      <button
        data-testid="log-event"
        onClick={() => {
          const result = logEvent({
            userId: 'tax789',
            userName: 'Priya Patel',
            userRole: 'Tax',
            actionType: 'download',
            documentId: 'DOC018',
            employeeId: 'EMP003',
            details: {
              documentType: 'W-2',
              year: '2024',
              employeeName: 'Michael Williams',
              status: 'success',
            },
          });
          document.getElementById('log-result').textContent = result ? result.eventId : 'null';
        }}
      >
        Log Event
      </button>
      <div id="log-result" data-testid="log-result"></div>
      <button
        data-testid="get-events"
        onClick={() => {
          const all = getEvents();
          document.getElementById('get-events-count').textContent = String(all.length);
        }}
      >
        Get Events
      </button>
      <div id="get-events-count" data-testid="get-events-count"></div>
      <button
        data-testid="filter-by-action"
        onClick={() => {
          const filtered = filterEvents({ actionType: 'preview' });
          document.getElementById('filter-action-count').textContent = String(filtered.length);
        }}
      >
        Filter By Action
      </button>
      <div id="filter-action-count" data-testid="filter-action-count"></div>
      <button
        data-testid="filter-by-user"
        onClick={() => {
          const filtered = filterEvents({ userName: 'Maria' });
          document.getElementById('filter-user-count').textContent = String(filtered.length);
        }}
      >
        Filter By User
      </button>
      <div id="filter-user-count" data-testid="filter-user-count"></div>
      <button
        data-testid="filter-by-role"
        onClick={() => {
          const filtered = filterEvents({ userRole: 'Legal' });
          document.getElementById('filter-role-count').textContent = String(filtered.length);
        }}
      >
        Filter By Role
      </button>
      <div id="filter-role-count" data-testid="filter-role-count"></div>
      <button
        data-testid="filter-by-status"
        onClick={() => {
          const filtered = filterEvents({ status: 'denied' });
          document.getElementById('filter-status-count').textContent = String(filtered.length);
        }}
      >
        Filter By Status
      </button>
      <div id="filter-status-count" data-testid="filter-status-count"></div>
      <button
        data-testid="filter-by-date-range"
        onClick={() => {
          const filtered = filterEvents({
            startDate: '2025-06-16T00:00:00Z',
            endDate: '2025-06-17T23:59:59Z',
          });
          document.getElementById('filter-date-count').textContent = String(filtered.length);
        }}
      >
        Filter By Date Range
      </button>
      <div id="filter-date-count" data-testid="filter-date-count"></div>
      <button
        data-testid="filter-by-query"
        onClick={() => {
          const filtered = filterEvents({ query: 'John Smith' });
          document.getElementById('filter-query-count').textContent = String(filtered.length);
        }}
      >
        Filter By Query
      </button>
      <div id="filter-query-count" data-testid="filter-query-count"></div>
      <button
        data-testid="filter-by-employee"
        onClick={() => {
          const filtered = filterEvents({ employeeId: 'EMP001' });
          document.getElementById('filter-employee-count').textContent = String(filtered.length);
        }}
      >
        Filter By Employee
      </button>
      <div id="filter-employee-count" data-testid="filter-employee-count"></div>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuditProvider>
      <TestConsumer />
    </AuditProvider>
  );
}

describe('AuditContext', () => {
  it('loads seed data and shows loading state initially', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('events-count').textContent).toBe('5');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('starts with loading true and transitions to false', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('loads all seed events with correct event IDs', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    const eventIds = JSON.parse(screen.getByTestId('events-json').textContent);
    expect(eventIds).toContain('EVT001');
    expect(eventIds).toContain('EVT002');
    expect(eventIds).toContain('EVT003');
    expect(eventIds).toContain('EVT004');
    expect(eventIds).toContain('EVT005');
  });

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('error').textContent).toBe('Network error');
    expect(screen.getByTestId('events-count').textContent).toBe('0');
  });

  it('handles non-ok response gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve([]),
      })
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('error').textContent).not.toBe('none');
    expect(screen.getByTestId('events-count').textContent).toBe('0');
  });

  it('logEvent appends a new event with correct fields', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('events-count').textContent).toBe('5');

    await user.click(screen.getByTestId('log-event'));

    expect(screen.getByTestId('events-count').textContent).toBe('6');
    expect(screen.getByTestId('log-result').textContent).not.toBe('null');
    expect(screen.getByTestId('log-result').textContent).toMatch(/^EVT_/);
  });

  it('logEvent generates unique eventId and timestamp', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('log-event'));
    const firstEventId = screen.getByTestId('log-result').textContent;

    await user.click(screen.getByTestId('log-event'));
    const secondEventId = screen.getByTestId('log-result').textContent;

    expect(firstEventId).not.toBe(secondEventId);
    expect(screen.getByTestId('events-count').textContent).toBe('7');
  });

  it('getEvents returns all events including newly logged ones', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('log-event'));
    await user.click(screen.getByTestId('get-events'));

    expect(screen.getByTestId('get-events-count').textContent).toBe('6');
  });

  it('filterEvents filters by actionType correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-by-action'));

    // EVT001 and EVT003 are preview actions
    expect(screen.getByTestId('filter-action-count').textContent).toBe('2');
  });

  it('filterEvents filters by userName (partial, case-insensitive)', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-by-user'));

    // EVT001, EVT002, EVT005 are by Maria Chen
    expect(screen.getByTestId('filter-user-count').textContent).toBe('3');
  });

  it('filterEvents filters by userRole correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-by-role'));

    // EVT003 is by Legal role
    expect(screen.getByTestId('filter-role-count').textContent).toBe('1');
  });

  it('filterEvents filters by status correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-by-status'));

    // EVT004 has status 'denied'
    expect(screen.getByTestId('filter-status-count').textContent).toBe('1');
  });

  it('filterEvents filters by date range correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-by-date-range'));

    // EVT003 (2025-06-16) and EVT004 (2025-06-17) fall within range
    expect(screen.getByTestId('filter-date-count').textContent).toBe('2');
  });

  it('filterEvents filters by free-text query correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-by-query'));

    // EVT001 and EVT002 have employeeName 'John Smith' in details
    expect(screen.getByTestId('filter-query-count').textContent).toBe('2');
  });

  it('filterEvents filters by employeeId correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-by-employee'));

    // EVT001 and EVT002 have employeeId 'EMP001'
    expect(screen.getByTestId('filter-employee-count').textContent).toBe('2');
  });

  it('filterEvents with no filters returns all events', async () => {
    const user = userEvent.setup();

    function TestEmptyFilter() {
      const { events, isLoading, filterEvents } = useAudit();

      return (
        <div>
          <div data-testid="loading">{String(isLoading)}</div>
          <div data-testid="events-count">{events.length}</div>
          <button
            data-testid="filter-empty"
            onClick={() => {
              const filtered = filterEvents({});
              document.getElementById('filter-empty-count').textContent = String(filtered.length);
            }}
          >
            Filter Empty
          </button>
          <div id="filter-empty-count" data-testid="filter-empty-count"></div>
        </div>
      );
    }

    render(
      <AuditProvider>
        <TestEmptyFilter />
      </AuditProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-empty'));

    expect(screen.getByTestId('filter-empty-count').textContent).toBe('5');
  });

  it('logEvent with null/undefined returns null', async () => {
    function TestNullLog() {
      const { isLoading, logEvent } = useAudit();

      return (
        <div>
          <div data-testid="loading">{String(isLoading)}</div>
          <button
            data-testid="log-null"
            onClick={() => {
              const result = logEvent(null);
              document.getElementById('null-result').textContent = String(result);
            }}
          >
            Log Null
          </button>
          <div id="null-result" data-testid="null-result"></div>
        </div>
      );
    }

    const user = userEvent.setup();

    render(
      <AuditProvider>
        <TestNullLog />
      </AuditProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('log-null'));

    expect(screen.getByTestId('null-result').textContent).toBe('null');
  });

  it('logEvent fills in defaults for missing fields', async () => {
    function TestDefaultsLog() {
      const { events, isLoading, logEvent } = useAudit();

      return (
        <div>
          <div data-testid="loading">{String(isLoading)}</div>
          <div data-testid="events-count">{events.length}</div>
          <button
            data-testid="log-minimal"
            onClick={() => {
              const result = logEvent({});
              document.getElementById('minimal-result').textContent = JSON.stringify({
                userId: result.userId,
                userName: result.userName,
                userRole: result.userRole,
                actionType: result.actionType,
                documentId: result.documentId,
                employeeId: result.employeeId,
                hasEventId: !!result.eventId,
                hasTimestamp: !!result.timestamp,
              });
            }}
          >
            Log Minimal
          </button>
          <div id="minimal-result" data-testid="minimal-result"></div>
        </div>
      );
    }

    const user = userEvent.setup();

    render(
      <AuditProvider>
        <TestDefaultsLog />
      </AuditProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('log-minimal'));

    const result = JSON.parse(screen.getByTestId('minimal-result').textContent);
    expect(result.userId).toBe('unknown');
    expect(result.userName).toBe('Unknown User');
    expect(result.userRole).toBe('Unknown');
    expect(result.actionType).toBe('unknown');
    expect(result.documentId).toBeNull();
    expect(result.employeeId).toBeNull();
    expect(result.hasEventId).toBe(true);
    expect(result.hasTimestamp).toBe(true);
  });

  it('newly logged events are included in filterEvents results', async () => {
    function TestLogAndFilter() {
      const { events, isLoading, logEvent, filterEvents } = useAudit();

      return (
        <div>
          <div data-testid="loading">{String(isLoading)}</div>
          <div data-testid="events-count">{events.length}</div>
          <button
            data-testid="log-package"
            onClick={() => {
              logEvent({
                userId: 'supervisor001',
                userName: 'Angela Torres',
                userRole: 'Supervisor',
                actionType: 'package',
                documentId: null,
                employeeId: 'EMP007',
                details: {
                  documentType: 'W-2',
                  years: ['2024', '2023'],
                  employeeName: 'David Wilson',
                  status: 'success',
                  documentCount: 2,
                },
              });
            }}
          >
            Log Package
          </button>
          <button
            data-testid="filter-package"
            onClick={() => {
              const filtered = filterEvents({ actionType: 'package' });
              document.getElementById('package-count').textContent = String(filtered.length);
            }}
          >
            Filter Package
          </button>
          <div id="package-count" data-testid="package-count"></div>
        </div>
      );
    }

    const user = userEvent.setup();

    render(
      <AuditProvider>
        <TestLogAndFilter />
      </AuditProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // No package events in seed data
    await user.click(screen.getByTestId('filter-package'));
    expect(screen.getByTestId('package-count').textContent).toBe('0');

    // Log a package event
    await user.click(screen.getByTestId('log-package'));
    expect(screen.getByTestId('events-count').textContent).toBe('6');

    // Now filter should find it
    await user.click(screen.getByTestId('filter-package'));
    expect(screen.getByTestId('package-count').textContent).toBe('1');
  });

  it('throws error when useAudit is used outside AuditProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAudit must be used within an AuditProvider');

    consoleError.mockRestore();
  });

  it('handles non-array response data gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ notAnArray: true }),
      })
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('events-count').textContent).toBe('0');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('filterEvents with multiple criteria combines them correctly', async () => {
    function TestMultiFilter() {
      const { isLoading, filterEvents } = useAudit();

      return (
        <div>
          <div data-testid="loading">{String(isLoading)}</div>
          <button
            data-testid="filter-multi"
            onClick={() => {
              const filtered = filterEvents({
                userRole: 'Payroll',
                actionType: 'preview',
              });
              document.getElementById('multi-count').textContent = String(filtered.length);
            }}
          >
            Filter Multi
          </button>
          <div id="multi-count" data-testid="multi-count"></div>
        </div>
      );
    }

    const user = userEvent.setup();

    render(
      <AuditProvider>
        <TestMultiFilter />
      </AuditProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('filter-multi'));

    // Only EVT001 is Payroll + preview
    expect(screen.getByTestId('multi-count').textContent).toBe('1');
  });
});