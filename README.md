# Payroll Archive & Fulfillment Hub

A comprehensive payroll document archive and fulfillment application built for Kelly Services. This application enables authorized users to search employees, retrieve historical tax documents (W-2s, paystubs), fulfill document requests (download, email, package), and monitor archive health — all with role-based access control and full audit logging.

## Tech Stack

- **Framework:** [React 18](https://react.dev/) with JavaScript (JSX)
- **Build Tool:** [Vite 5](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Routing:** [React Router 6](https://reactrouter.com/) (createBrowserRouter)
- **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Deployment:** [Vercel](https://vercel.com/)

## Features

### Employee Search (SCRUM-255)
- Search employees by name, Kelly ID, or last 4 SSN digits
- Filter results by department, location, and employment status
- Masked PII display with reveal toggle for authorized users

### Employee 360 View (SCRUM-254, SCRUM-255)
- Complete employee profile with masked PII fields
- Document archive grouped by type (W-2, Paystub) and year
- Filter documents by type, year, and status
- Inline actions for preview, download, email, and packaging

### Document Preview (SCRUM-256)
- Mock PDF viewer displaying document metadata
- Document details panel with employee information
- Download and email actions from the preview view

### Document Fulfillment (SCRUM-252, SCRUM-253, SCRUM-257)
- **Download:** Simulated file download with confirmation modal
- **Email:** Send documents to employee email with confirmation
- **Package:** Multi-document bundling for legal or tax requests
- All actions require explicit confirmation before execution
- Permission-aware UI — buttons disabled or hidden based on user role

### Conversational Assistant (SCRUM-259)
- Natural language query processing for employee and document search
- Contextual follow-up actions (view documents, download, email, package)
- Confirmation prompts for fulfillment actions via chat
- Suggested action buttons for guided interaction

### Audit Logging (SCRUM-258, SCRUM-263)
- Automatic logging of all document access events (preview, download, email, package)
- Denied access attempts recorded with reason
- Filterable audit log view with date range, user, role, action type, and status filters
- Session-local audit data (resets on page reload)

### Governance Dashboard (SCRUM-264)
- Compliance overview with summary metrics
- Recent denied access attempt highlights
- Unresolved archive exception highlights
- Filterable audit events table
- Accessible to Supervisor role only

### Archive Health Monitoring (SCRUM-260)
- Total files ingested, success rate, failed records, and missing metadata counts
- Document type and year coverage breakdowns
- Unresolved exceptions list with type, status, and description
- Last ingestion and validation timestamps

### Role-Based Access Control (SCRUM-261, SCRUM-265, SCRUM-266)
- Simulated login with role selection (Payroll, Legal, Tax, EFSC, Supervisor, Unauthorized)
- Permission-aware UI rendering across all views
- Access denied screen for unauthorized users
- All denied access attempts logged to audit

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Build

Create a production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Testing

Run all tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Folder Structure

```
payroll-archive-hub/
├── public/
│   └── data/                        # Static JSON fixture data
│       ├── archiveHealth.json       # Archive health metrics and exceptions
│       ├── assistantResponses.json  # Assistant response templates
│       ├── auditLog.json            # Seed audit log events
│       ├── documents.json           # Employee document records
│       ├── employees.json           # Employee master records
│       └── users.json               # Mock user profiles and permissions
├── src/
│   ├── components/
│   │   ├── assistant/               # Conversational assistant components
│   │   │   ├── AssistantMessage.jsx # Individual chat message component
│   │   │   ├── AssistantPanel.jsx   # Slide-in assistant panel
│   │   │   └── AssistantToggle.jsx  # Floating action button toggle
│   │   ├── audit/
│   │   │   └── AuditLogView.jsx     # Filterable audit log table
│   │   ├── auth/
│   │   │   ├── AccessDeniedScreen.jsx # Access denied page
│   │   │   ├── LoginScreen.jsx      # Mock login with role selection
│   │   │   └── ProtectedRoute.jsx   # Route guard component
│   │   ├── documents/
│   │   │   ├── DocumentFulfillment.jsx # Download, email, package actions
│   │   │   ├── DocumentPreview.jsx  # Mock PDF viewer
│   │   │   └── PackageBuilder.jsx   # Multi-document package builder
│   │   ├── governance/
│   │   │   ├── ArchiveHealthView.jsx # Archive health monitoring
│   │   │   └── GovernanceDashboard.jsx # Compliance dashboard
│   │   ├── search/
│   │   │   ├── Employee360.jsx      # Employee detail and document view
│   │   │   └── EmployeeSearch.jsx   # Employee search with filters
│   │   └── shared/                  # Reusable UI components
│   │       ├── ConfirmationModal.jsx
│   │       ├── DataTable.jsx
│   │       ├── EmptyState.jsx
│   │       ├── FilterBar.jsx
│   │       ├── Header.jsx
│   │       ├── Layout.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── MaskedField.jsx
│   │       ├── Sidebar.jsx
│   │       └── StatusBadge.jsx
│   ├── contexts/                    # React context providers
│   │   ├── AssistantContext.jsx      # Conversational assistant state
│   │   ├── AuditContext.jsx         # In-memory audit logging
│   │   └── RBACContext.jsx          # Role-based access control
│   ├── hooks/                       # Custom React hooks
│   │   ├── useArchiveHealth.js      # Archive health data loading
│   │   ├── useDocuments.js          # Document data loading and filtering
│   │   └── useEmployees.js          # Employee data loading and search
│   ├── pages/                       # Page-level route components
│   │   ├── ArchiveHealthPage.jsx
│   │   ├── AuditPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── Employee360Page.jsx
│   │   ├── GovernancePage.jsx
│   │   ├── PreviewPage.jsx
│   │   └── SearchPage.jsx
│   ├── utils/                       # Utility functions
│   │   ├── constants.js             # Application-wide constants
│   │   ├── dateUtils.js             # Date formatting and range utilities
│   │   ├── fixtureLoader.js         # JSON fixture loading with caching
│   │   ├── maskingUtils.js          # PII masking functions
│   │   └── searchUtils.js           # Search and filter utilities
│   ├── App.jsx                      # Root component with providers
│   ├── index.css                    # Tailwind CSS imports
│   ├── main.jsx                     # Application entry point
│   └── router.jsx                   # Route configuration
├── index.html                       # HTML entry point
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json                      # Vercel deployment configuration
├── vite.config.js
└── vitest.config.js
```

## User Roles and Permissions

| Role         | Search | Preview | Download | Email | Package | Audit | Dashboard | Governance |
|--------------|--------|---------|----------|-------|---------|-------|-----------|------------|
| Payroll      | ✅     | ✅      | ✅       | ✅    | ✅      | ✅    | ✅        | ❌         |
| Legal        | ✅     | ✅      | ✅       | ❌    | ✅      | ✅    | ✅        | ❌         |
| Tax          | ✅     | ✅      | ✅       | ❌    | ✅      | ✅    | ✅        | ❌         |
| EFSC         | ✅     | ✅      | ❌       | ❌    | ❌      | ✅    | ✅        | ❌         |
| Supervisor   | ✅     | ✅      | ✅       | ✅    | ✅      | ✅    | ✅        | ✅         |
| Unauthorized | ❌     | ❌      | ❌       | ❌    | ❌      | ❌    | ❌        | ❌         |

## Mock Users

| User           | Role         | User ID        |
|----------------|--------------|----------------|
| Maria Chen     | Payroll      | payroll123     |
| James Wright   | Legal        | legal456       |
| Priya Patel    | Tax          | tax789         |
| David Kim      | EFSC         | efsc321        |
| Angela Torres  | Supervisor   | supervisor001  |
| Test User      | Unauthorized | unauth999      |

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

| Variable         | Description          | Default              |
|------------------|----------------------|----------------------|
| VITE_APP_TITLE   | Application title    | Payroll Archive Hub  |

## Deployment

### Vercel

This project is configured for deployment on [Vercel](https://vercel.com/). The `vercel.json` file includes SPA rewrite rules to support client-side routing.

1. Connect your repository to Vercel
2. Vercel will automatically detect the Vite framework
3. Build command: `npm run build`
4. Output directory: `dist`

All client-side routes are rewritten to `index.html` via the `vercel.json` configuration.

## Data

All data is loaded from static JSON fixtures in the `public/data/` directory. The application operates entirely client-side with no backend API. Audit events are stored in-memory and reset on page reload.

- **Employees:** 20 mock employee records across 4 locations and 7 departments
- **Documents:** 145 mock document records (W-2s and paystubs) covering tax years 2019–2024
- **Audit Log:** 50 seed audit events demonstrating various access patterns
- **Archive Health:** Simulated metrics for 89.1 million ingested files with 10 exception records

## License

Private