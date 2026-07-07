import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DocumentFulfillment } from './DocumentFulfillment';
import { RBACProvider } from '../../contexts/RBACContext';
import { AuditProvider } from '../../contexts/AuditContext';
import { AssistantProvider } from '../../contexts/AssistantContext';

/**
 * Mock document data for tests.
 */
const mockDocument = {
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
};

const mockMissingDocument = {
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
};

const mockDocuments = [
  mockDocument,
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
];

const mockEmployee = {
  employeeId: 'EMP001',
  kellyId: 'K100234',
  name: 'John Smith',
  email: 'j***@kelly.com',
  department: 'Engineering',
  location: 'Troy, MI',
  status: 'Active',
};

/**
 * Mock users data for tests.
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
    userId: 'efsc321',
    displayName: 'David Kim',
    email: 'd***@kelly.com',
    role: 'EFSC',
    permissions: ['search', 'preview', 'audit', 'dashboard'],
  },
  {
    userId: 'legal456',
    displayName: 'James Wright',
    email: 'j***@kelly.com',
    role: 'Legal',
    permissions: ['search', 'preview', 'download', 'package', 'audit', 'dashboard'],
  },
];

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
    if (typeof url === 'string' && url.includes('employees')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (typeof url === 'string' && url.includes('auditLog')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
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

/**
 * Helper to log in as a specific user before rendering.
 * @param {string} userId - The userId to log in as
 */
function loginAs(userId) {
  localStorage.setItem('payroll_archive_hub_user', userId);
}

/**
 * Helper to render DocumentFulfillment with all required providers.
 * @param {Object} props - Props to pass to DocumentFulfillment
 */
function renderDocumentFulfillment(props = {}) {
  return render(
    <MemoryRouter>
      <RBACProvider>
        <AuditProvider>
          <AssistantProvider>
            <DocumentFulfillment {...props} />
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
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  setupFetch();
  vi.resetModules();
});

describe('DocumentFulfillment', () => {
  describe('rendering', () => {
    it('renders empty state when no document or documents are provided', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment();
      await waitForLoad();

      expect(screen.getByText('No Documents Selected')).toBeInTheDocument();
    });

    it('renders document actions section when a single document is provided', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('Document Actions')).toBeInTheDocument();
      expect(screen.getByText('W-2 2024')).toBeInTheDocument();
      expect(screen.getByText('W2_2024_John_Smith.pdf')).toBeInTheDocument();
      expect(screen.getByText('245 KB')).toBeInTheDocument();
    });

    it('renders download and email buttons for authorized user', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).not.toBeDisabled();

      const emailButton = screen.getByRole('button', { name: /email to employee/i });
      expect(emailButton).toBeInTheDocument();
      expect(emailButton).not.toBeDisabled();
    });

    it('renders package documents section when multiple documents are provided', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockDocument,
        documents: mockDocuments,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('Package Documents')).toBeInTheDocument();
      expect(screen.getByText('3 available documents')).toBeInTheDocument();
    });

    it('shows disabled buttons for missing document', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockMissingDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeDisabled();

      const emailButton = screen.getByRole('button', { name: /email to employee/i });
      expect(emailButton).toBeDisabled();
    });

    it('shows missing document warning message', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockMissingDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText(/This document is currently marked as missing/)).toBeInTheDocument();
    });

    it('shows audit notice', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('All actions are recorded in the audit log.')).toBeInTheDocument();
    });
  });

  describe('download action', () => {
    it('shows confirmation modal when download button is clicked', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Download')).toBeInTheDocument();
      });

      expect(screen.getByText('This action will be recorded in the audit log.')).toBeInTheDocument();
    });

    it('completes download action after confirmation', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      const onComplete = vi.fn();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
        onComplete,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Download')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Download initiated/)).toBeInTheDocument();
      });

      expect(onComplete).toHaveBeenCalledWith('download');
    });

    it('cancels download action when cancel is clicked', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      const onCancel = vi.fn();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
        onCancel,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Download')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Download')).not.toBeInTheDocument();
      });

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('email action', () => {
    it('shows confirmation modal when email button is clicked', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const emailButton = screen.getByRole('button', { name: /email to employee/i });
      await user.click(emailButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Email')).toBeInTheDocument();
      });
    });

    it('completes email action after confirmation', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      const onComplete = vi.fn();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
        onComplete,
      });
      await waitForLoad();

      const emailButton = screen.getByRole('button', { name: /email to employee/i });
      await user.click(emailButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Email')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Email sent successfully/)).toBeInTheDocument();
      });

      expect(onComplete).toHaveBeenCalledWith('email');
    });

    it('shows recipient email in the email button', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText(/j\*\*\*@kelly\.com/)).toBeInTheDocument();
    });
  });

  describe('package action', () => {
    it('renders package section with document list', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockDocument,
        documents: mockDocuments,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('Package Documents')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('allows selecting documents for packaging', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        documents: mockDocuments,
        employee: mockEmployee,
      });
      await waitForLoad();

      const selectAllCheckbox = screen.getByLabelText('Select all documents');
      await user.click(selectAllCheckbox);

      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeInTheDocument();
      });
    });

    it('shows confirmation modal when package button is clicked', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        documents: mockDocuments,
        employee: mockEmployee,
      });
      await waitForLoad();

      // Click the package button (packages all when none selected)
      const packageButton = screen.getByRole('button', { name: /package all/i });
      await user.click(packageButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Package')).toBeInTheDocument();
      });
    });

    it('completes package action after confirmation', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      const onComplete = vi.fn();
      renderDocumentFulfillment({
        document: mockDocument,
        documents: mockDocuments,
        employee: mockEmployee,
        onComplete,
      });
      await waitForLoad();

      const packageButton = screen.getByRole('button', { name: /package all/i });
      await user.click(packageButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Package')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Document package created successfully/)).toBeInTheDocument();
      });

      expect(onComplete).toHaveBeenCalledWith('package');
    });
  });

  describe('permission checks', () => {
    it('shows no permission indicator for download when user lacks download permission', async () => {
      loginAs('efsc321');
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('Download (No Permission)')).toBeInTheDocument();
    });

    it('shows no permission indicator for email when user lacks email permission', async () => {
      loginAs('efsc321');
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('Email (No Permission)')).toBeInTheDocument();
    });

    it('shows no permission indicator for package when user lacks package permission', async () => {
      loginAs('efsc321');
      renderDocumentFulfillment({
        document: mockDocument,
        documents: mockDocuments,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('Package (No Permission)')).toBeInTheDocument();
    });

    it('shows access denied message when unauthorized user attempts download', async () => {
      loginAs('efsc321');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      // The download button should show "No Permission" and not be clickable
      expect(screen.getByText('Download (No Permission)')).toBeInTheDocument();
      // No confirmation modal should appear
      expect(screen.queryByText('Confirm Download')).not.toBeInTheDocument();
    });

    it('allows download for Legal role user who has download permission', async () => {
      loginAs('legal456');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).not.toBeDisabled();

      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Download')).toBeInTheDocument();
      });
    });

    it('shows no permission for email for Legal role user who lacks email permission', async () => {
      loginAs('legal456');
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      expect(screen.getByText('Email (No Permission)')).toBeInTheDocument();
    });
  });

  describe('result banners', () => {
    it('shows success banner after successful download', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Download')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText(/Download initiated for W2_2024_John_Smith.pdf/)).toBeInTheDocument();
      });
    });

    it('allows dismissing the result banner', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Download')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Dismiss');
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('Success')).not.toBeInTheDocument();
      });
    });

    it('shows success banner after successful email', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const emailButton = screen.getByRole('button', { name: /email to employee/i });
      await user.click(emailButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Email')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText(/Email sent successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('does not open modal for download when document is missing', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockMissingDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeDisabled();

      // Attempting to click a disabled button should not open modal
      await user.click(downloadButton);

      expect(screen.queryByText('Confirm Download')).not.toBeInTheDocument();
    });

    it('does not open modal for email when document is missing', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        document: mockMissingDocument,
        employee: mockEmployee,
      });
      await waitForLoad();

      const emailButton = screen.getByRole('button', { name: /email to employee/i });
      expect(emailButton).toBeDisabled();

      await user.click(emailButton);

      expect(screen.queryByText('Confirm Email')).not.toBeInTheDocument();
    });

    it('renders correctly without employee prop', async () => {
      loginAs('payroll123');
      renderDocumentFulfillment({
        document: mockDocument,
      });
      await waitForLoad();

      expect(screen.getByText('Document Actions')).toBeInTheDocument();
      expect(screen.getByText('W-2 2024')).toBeInTheDocument();
    });

    it('handles select all toggle for package documents', async () => {
      loginAs('payroll123');
      const user = userEvent.setup();
      renderDocumentFulfillment({
        documents: mockDocuments,
        employee: mockEmployee,
      });
      await waitForLoad();

      const selectAllCheckbox = screen.getByLabelText('Select all documents');

      // Select all
      await user.click(selectAllCheckbox);
      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeInTheDocument();
      });

      // Deselect all
      await user.click(selectAllCheckbox);
      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeInTheDocument();
      });
    });
  });
});