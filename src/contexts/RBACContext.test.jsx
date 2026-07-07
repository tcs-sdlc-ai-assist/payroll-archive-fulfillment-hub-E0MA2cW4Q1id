import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RBACProvider, useRBAC } from './RBACContext';

/**
 * Mock fetch to return users.json data for tests.
 */
const mockUsers = [
  {
    userId: 'payroll123',
    displayName: 'Maria Chen',
    email: 'm***@kelly.com',
    role: 'Payroll',
    permissions: ['search', 'preview', 'download', 'email', 'package', 'audit', 'dashboard'],
  },
  {
    userId: 'legal456',
    displayName: 'James Wright',
    email: 'j***@kelly.com',
    role: 'Legal',
    permissions: ['search', 'preview', 'download', 'package', 'audit', 'dashboard'],
  },
  {
    userId: 'efsc321',
    displayName: 'David Kim',
    email: 'd***@kelly.com',
    role: 'EFSC',
    permissions: ['search', 'preview', 'audit', 'dashboard'],
  },
  {
    userId: 'supervisor001',
    displayName: 'Angela Torres',
    email: 'a***@kelly.com',
    role: 'Supervisor',
    permissions: ['search', 'preview', 'download', 'email', 'package', 'audit', 'dashboard', 'governance'],
  },
  {
    userId: 'unauth999',
    displayName: 'Test User',
    email: 't***@kelly.com',
    role: 'Unauthorized',
    permissions: [],
  },
];

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    })
  );
});

/**
 * Test consumer component that exposes RBAC context values for assertions.
 */
function TestConsumer() {
  const { currentUser, users, isAuthorized, isLoading, login, logout, hasPermission } = useRBAC();

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="is-authorized">{String(isAuthorized)}</div>
      <div data-testid="current-user">{currentUser ? currentUser.displayName : 'none'}</div>
      <div data-testid="current-role">{currentUser ? currentUser.role : 'none'}</div>
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="has-search">{String(hasPermission('search'))}</div>
      <div data-testid="has-download">{String(hasPermission('download'))}</div>
      <div data-testid="has-email">{String(hasPermission('email'))}</div>
      <div data-testid="has-package">{String(hasPermission('package'))}</div>
      <div data-testid="has-governance">{String(hasPermission('governance'))}</div>
      <button data-testid="login-payroll" onClick={() => login('payroll123')}>Login Payroll</button>
      <button data-testid="login-legal" onClick={() => login('legal456')}>Login Legal</button>
      <button data-testid="login-efsc" onClick={() => login('efsc321')}>Login EFSC</button>
      <button data-testid="login-supervisor" onClick={() => login('supervisor001')}>Login Supervisor</button>
      <button data-testid="login-unauth" onClick={() => login('unauth999')}>Login Unauth</button>
      <button data-testid="logout" onClick={logout}>Logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <RBACProvider>
      <TestConsumer />
    </RBACProvider>
  );
}

describe('RBACContext', () => {
  it('loads users and shows loading state initially', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('users-count').textContent).toBe('5');
  });

  it('starts with no current user and not authorized', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('current-user').textContent).toBe('none');
    expect(screen.getByTestId('is-authorized').textContent).toBe('false');
  });

  it('login sets current user correctly for Payroll role', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-payroll'));

    expect(screen.getByTestId('current-user').textContent).toBe('Maria Chen');
    expect(screen.getByTestId('current-role').textContent).toBe('Payroll');
    expect(screen.getByTestId('is-authorized').textContent).toBe('true');
  });

  it('logout clears the current user', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-payroll'));
    expect(screen.getByTestId('current-user').textContent).toBe('Maria Chen');

    await user.click(screen.getByTestId('logout'));
    expect(screen.getByTestId('current-user').textContent).toBe('none');
    expect(screen.getByTestId('is-authorized').textContent).toBe('false');
  });

  it('hasPermission returns correct values for Payroll role', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-payroll'));

    expect(screen.getByTestId('has-search').textContent).toBe('true');
    expect(screen.getByTestId('has-download').textContent).toBe('true');
    expect(screen.getByTestId('has-email').textContent).toBe('true');
    expect(screen.getByTestId('has-package').textContent).toBe('true');
    expect(screen.getByTestId('has-governance').textContent).toBe('false');
  });

  it('hasPermission returns correct values for Legal role (no email)', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-legal'));

    expect(screen.getByTestId('has-search').textContent).toBe('true');
    expect(screen.getByTestId('has-download').textContent).toBe('true');
    expect(screen.getByTestId('has-email').textContent).toBe('false');
    expect(screen.getByTestId('has-package').textContent).toBe('true');
    expect(screen.getByTestId('has-governance').textContent).toBe('false');
  });

  it('hasPermission returns correct values for EFSC role (limited permissions)', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-efsc'));

    expect(screen.getByTestId('has-search').textContent).toBe('true');
    expect(screen.getByTestId('has-download').textContent).toBe('false');
    expect(screen.getByTestId('has-email').textContent).toBe('false');
    expect(screen.getByTestId('has-package').textContent).toBe('false');
    expect(screen.getByTestId('has-governance').textContent).toBe('false');
  });

  it('hasPermission returns correct values for Supervisor role (all permissions)', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-supervisor'));

    expect(screen.getByTestId('has-search').textContent).toBe('true');
    expect(screen.getByTestId('has-download').textContent).toBe('true');
    expect(screen.getByTestId('has-email').textContent).toBe('true');
    expect(screen.getByTestId('has-package').textContent).toBe('true');
    expect(screen.getByTestId('has-governance').textContent).toBe('true');
  });

  it('unauthorized user is correctly identified as not authorized', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-unauth'));

    expect(screen.getByTestId('current-user').textContent).toBe('Test User');
    expect(screen.getByTestId('current-role').textContent).toBe('Unauthorized');
    expect(screen.getByTestId('is-authorized').textContent).toBe('false');
  });

  it('unauthorized user has no permissions', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-unauth'));

    expect(screen.getByTestId('has-search').textContent).toBe('false');
    expect(screen.getByTestId('has-download').textContent).toBe('false');
    expect(screen.getByTestId('has-email').textContent).toBe('false');
    expect(screen.getByTestId('has-package').textContent).toBe('false');
    expect(screen.getByTestId('has-governance').textContent).toBe('false');
  });

  it('hasPermission returns false when no user is logged in', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('has-search').textContent).toBe('false');
    expect(screen.getByTestId('has-download').textContent).toBe('false');
  });

  it('login with invalid userId returns false and does not set user', async () => {
    const user = userEvent.setup();

    function TestInvalidLogin() {
      const { currentUser, login } = useRBAC();
      const handleClick = () => {
        const result = login('nonexistent_user');
        document.getElementById('login-result').textContent = String(result);
      };
      return (
        <div>
          <div data-testid="current-user">{currentUser ? currentUser.displayName : 'none'}</div>
          <div id="login-result" data-testid="login-result"></div>
          <button data-testid="login-invalid" onClick={handleClick}>Login Invalid</button>
        </div>
      );
    }

    render(
      <RBACProvider>
        <TestInvalidLogin />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-user').textContent).toBe('none');
    });

    await user.click(screen.getByTestId('login-invalid'));

    expect(screen.getByTestId('login-result').textContent).toBe('false');
    expect(screen.getByTestId('current-user').textContent).toBe('none');
  });

  it('persists user to localStorage on login and clears on logout', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-payroll'));
    expect(localStorage.getItem('payroll_archive_hub_user')).toBe('payroll123');

    await user.click(screen.getByTestId('logout'));
    expect(localStorage.getItem('payroll_archive_hub_user')).toBeNull();
  });

  it('restores user from localStorage on mount', async () => {
    localStorage.setItem('payroll_archive_hub_user', 'legal456');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('current-user').textContent).toBe('James Wright');
    expect(screen.getByTestId('current-role').textContent).toBe('Legal');
    expect(screen.getByTestId('is-authorized').textContent).toBe('true');
  });

  it('switching users updates permissions correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-payroll'));
    expect(screen.getByTestId('has-email').textContent).toBe('true');
    expect(screen.getByTestId('has-governance').textContent).toBe('false');

    await user.click(screen.getByTestId('login-supervisor'));
    expect(screen.getByTestId('has-email').textContent).toBe('true');
    expect(screen.getByTestId('has-governance').textContent).toBe('true');

    await user.click(screen.getByTestId('login-efsc'));
    expect(screen.getByTestId('has-email').textContent).toBe('false');
    expect(screen.getByTestId('has-download').textContent).toBe('false');
  });

  it('throws error when useRBAC is used outside RBACProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useRBAC must be used within an RBACProvider');

    consoleError.mockRestore();
  });
});