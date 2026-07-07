# Changelog

All notable changes to the Payroll Archive & Fulfillment Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-20

### Added

#### Authentication & Role-Based Access Control (SCRUM-261, SCRUM-265, SCRUM-266)
- Simulated login screen with role selection dropdown for mock user profiles
- Six user roles: Payroll, Legal, Tax, EFSC, Supervisor, and Unauthorized
- Permission-aware UI rendering across all views — buttons disabled or hidden based on user role
- Access denied screen for unauthorized users with audit logging of denied attempts
- Session persistence via localStorage for selected user profile
- Protected route component with permission-based route guards

#### Employee Search (SCRUM-255)
- Search employees by name, Kelly ID, or last 4 SSN digits
- Filter results by department, location, and employment status
- Masked PII display with reveal toggle for authorized users
- Clickable search results navigating to Employee 360 view
- Search actions logged to audit trail

#### Employee 360 View (SCRUM-254, SCRUM-255)
- Complete employee profile with masked PII fields (Tax ID, email)
- Document archive grouped by type (W-2, Paystub) and year
- Filter documents by type, year, and status
- Document summary cards showing total, available, missing, W-2, and paystub counts
- Inline actions for preview, download, email, and packaging per document
- Tabbed interface for Documents, Fulfillment, and Package Builder views

#### Document Preview (SCRUM-256)
- Mock PDF viewer displaying document metadata (type, year, period, employee name, Kelly ID)
- Document details panel with employee information
- Download and email actions from the preview view
- Preview action automatically logged to audit trail

#### Document Fulfillment (SCRUM-252, SCRUM-253, SCRUM-257)
- **Download:** Simulated file download with confirmation modal
- **Email:** Send documents to employee email with recipient confirmation
- **Package:** Multi-document bundling for legal or tax requests with document selection
- All actions require explicit confirmation before execution via ConfirmationModal
- Permission-aware UI — buttons disabled or hidden based on user role
- Success and error result banners with dismiss functionality
- All fulfillment actions logged to audit trail

#### Package Builder (SCRUM-257)
- Multi-document selection with checkboxes and select-all toggle
- Filter documents by type and year within the package builder
- Selection summary showing document count, year range, and types
- Create Package button with confirmation modal
- Package creation logged to audit trail

#### Conversational Assistant (SCRUM-259)
- Slide-in panel with floating action button toggle in bottom-right corner
- Natural language query processing for employee and document search
- Employee lookup by name, Kelly ID, or last 4 SSN
- Document search with type and year extraction from natural language
- Contextual follow-up actions (view documents, download, email, package)
- Confirmation prompts for fulfillment actions via chat
- Suggested action buttons for guided interaction
- Greeting and help responses with capability overview
- Access denied responses for unauthorized actions
- Unread message indicator badge on toggle button

#### Audit Logging (SCRUM-258, SCRUM-263)
- Automatic logging of all document access events (preview, download, email, package)
- Denied access attempts recorded with reason
- Filterable audit log view with user, role, action type, status, date range, and free-text search filters
- Summary cards showing total events, success, denied, previews, downloads, emails, and packages
- Session-local audit data seeded from 50 initial audit events
- Audit data resets on page reload (simulated environment)

#### Governance Dashboard (SCRUM-264)
- Compliance overview with summary metrics (total events, successful, denied, unique users)
- Recent denied access attempt highlights with user and reason details
- Unresolved archive exception highlights with type and description
- Filterable audit events table with action type, role, and status filters
- Archive health overview with files ingested, success rate, and document type breakdown
- Accessible to Supervisor role only

#### Archive Health Monitoring (SCRUM-260)
- Total files ingested (89.1M), success rate (99.9999%), failed records, and missing metadata counts
- Document type breakdown with progress bars (W-2, Paystub)
- Year coverage grid for tax years 2019–2024
- Unresolved exceptions list with type, status, description, and associated employee/document IDs
- Exception type breakdown summary
- Recently resolved exceptions section
- Last ingestion and validation timestamps

#### PII Masking
- MaskedField component with reveal toggle for authorized users
- SSN masking to `***-**-XXXX` format
- Tax ID masking to `***-**-XXXX` format
- Email masking showing only first character of local part (`j***@kelly.com`)
- Sensitive field detection via PII_FIELDS constant list
- Object-level PII masking utility for bulk operations

#### Shared UI Components
- DataTable with sortable columns, pagination, and optional row selection checkboxes
- FilterBar with select dropdowns, text inputs, and date range pickers
- StatusBadge with color-coded backgrounds for document, employee, exception, and audit statuses
- ConfirmationModal with action-specific icons, document details, and processing state
- EmptyState with variant-specific icons and messages (search, document, audit, error, filter)
- LoadingSpinner with Kelly green accent and optional message
- Header with Kelly Services branding, user display, role badge, and logout button
- Sidebar with role-based navigation menu items and mobile-responsive collapse
- Layout component with Header, Sidebar, and main content area

#### Kelly Services Branding
- Kelly green (#00AE42) primary color throughout the application
- Custom Tailwind CSS color palette for kelly-green, kelly-dark, and kelly-gray scales
- Kelly "K" logo in header and login screen
- Consistent typography and spacing following Kelly brand guidelines

#### Data & Infrastructure
- Static JSON fixture data for employees (20 records), documents (145 records), audit log (50 events), archive health metrics, and user profiles
- Fixture loader with in-memory caching to prevent redundant network requests
- Search utilities for employees, documents, and audit events with multi-field filtering
- Date utilities for timestamp formatting, range checking, and year generation
- React Router v6 with createBrowserRouter and protected route configuration
- Context providers for RBAC, Audit, and Assistant state management
- Custom hooks for employees, documents, and archive health data loading
- Vercel deployment configuration with SPA rewrite rules

#### Testing
- Unit tests for masking utilities (maskSSN, maskTaxId, maskEmail, maskLast4SSN, maskObjectPII)
- Unit tests for search utilities (filterEmployees, filterDocuments, filterAuditEvents, matchesQuery)
- Integration tests for RBACContext (login, logout, permissions, role switching, localStorage persistence)
- Integration tests for AuditContext (seed data loading, event logging, filtering, error handling)
- Component tests for EmployeeSearch (search, filters, navigation, PII masking, error states)
- Component tests for DocumentFulfillment (download, email, package, permissions, result banners)
- Component tests for GovernanceDashboard (summary cards, denied access, exceptions, filters, access control)

[1.0.0]: https://github.com/kelly-services/payroll-archive-hub/releases/tag/v1.0.0