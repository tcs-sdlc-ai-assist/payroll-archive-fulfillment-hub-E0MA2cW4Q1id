# Deployment Guide

This document covers the deployment process for the **Payroll Archive & Fulfillment Hub** application, including Vercel static hosting setup, environment variables, build configuration, and CI/CD notes.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build Configuration](#build-configuration)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
  - [Initial Setup](#initial-setup)
  - [SPA Rewrite Configuration](#spa-rewrite-configuration)
  - [Build Settings](#build-settings)
  - [Git-Based Deploys](#git-based-deploys)
- [Manual Deployment](#manual-deployment)
- [CI/CD Notes](#cicd-notes)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have the following:

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later
- A [Vercel](https://vercel.com/) account (for Vercel deployment)
- Git repository connected to Vercel (for automatic deploys)

---

## Build Configuration

The application uses [Vite 5](https://vitejs.dev/) as its build tool. The build configuration is defined in `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

### Build Commands

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm install`        | Install all dependencies                         |
| `npm run dev`        | Start the development server at `localhost:5173`  |
| `npm run build`      | Create a production build in the `dist/` directory|
| `npm run preview`    | Preview the production build locally              |
| `npm run test`       | Run all tests via Vitest                          |
| `npm run test:watch` | Run tests in watch mode                           |

### Production Build

To create a production build:

```bash
npm install
npm run build
```

The output will be generated in the `dist/` directory. This directory contains:

- `index.html` — The single HTML entry point
- `assets/` — Hashed JavaScript and CSS bundles
- `data/` — Static JSON fixture files (copied from `public/data/`)
- `vite.svg` — Favicon

---

## Environment Variables

Environment variables are managed via `.env` files and accessed in the application using `import.meta.env.VITE_*`.

### Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Configure the variables as needed:

| Variable         | Description          | Default              | Required |
|------------------|----------------------|----------------------|----------|
| `VITE_APP_TITLE` | Application title    | Payroll Archive Hub  | No       |

### Environment File Precedence

Vite loads environment files in the following order (later files override earlier ones):

1. `.env` — Loaded in all cases
2. `.env.local` — Loaded in all cases, ignored by Git
3. `.env.development` — Loaded in development mode
4. `.env.development.local` — Loaded in development mode, ignored by Git
5. `.env.production` — Loaded in production mode
6. `.env.production.local` — Loaded in production mode, ignored by Git

### Vercel Environment Variables

When deploying to Vercel, environment variables can be configured in the Vercel dashboard:

1. Navigate to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Settings** → **Environment Variables**
3. Add each variable with the appropriate scope (Production, Preview, Development)

> **Note:** Only variables prefixed with `VITE_` are exposed to the client-side application. Do not store secrets or sensitive credentials in `VITE_*` variables, as they are embedded in the client bundle.

---

## Vercel Deployment

### Initial Setup

1. **Create a Vercel account** at [vercel.com](https://vercel.com/) if you don't have one.

2. **Import your Git repository:**
   - Go to the [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New…** → **Project**
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Choose the `payroll-archive-hub` repository
   - Click **Import**

3. **Configure the project:**
   - Vercel will automatically detect the Vite framework
   - Verify the build settings (see [Build Settings](#build-settings) below)
   - Add any required environment variables
   - Click **Deploy**

### SPA Rewrite Configuration

The application uses client-side routing via React Router v6 with `createBrowserRouter`. All routes must be rewritten to `index.html` so the client-side router can handle them.

This is configured in `vercel.json` at the project root:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This rewrite rule ensures that:

- Direct navigation to any route (e.g., `/dashboard`, `/search`, `/employee/EMP001`) serves `index.html`
- The React Router client-side router then handles the route and renders the correct component
- Static assets in `assets/` and `data/` are still served directly (Vercel serves static files before applying rewrites)
- 404 pages are handled by the client-side router

> **Important:** The `vercel.json` file must be present in the repository root. Without it, direct navigation to any route other than `/` will return a 404 error.

### Build Settings

When configuring the project in Vercel, use the following settings:

| Setting            | Value           |
|--------------------|-----------------|
| **Framework Preset** | Vite            |
| **Build Command**    | `npm run build` |
| **Output Directory** | `dist`          |
| **Install Command**  | `npm install`   |
| **Node.js Version**  | 18.x or later   |

These settings are typically auto-detected by Vercel when it identifies the Vite framework from `vite.config.js` and `package.json`.

### Git-Based Deploys

Vercel supports automatic deployments triggered by Git pushes:

#### Production Deployments

- **Trigger:** Push to the `main` (or `master`) branch
- **URL:** Your production domain (e.g., `payroll-archive-hub.vercel.app`)
- **Environment:** Production environment variables are used

#### Preview Deployments

- **Trigger:** Push to any non-production branch, or opening a pull request
- **URL:** A unique preview URL is generated for each deployment (e.g., `payroll-archive-hub-git-feature-branch.vercel.app`)
- **Environment:** Preview environment variables are used
- **Pull Request Comments:** Vercel automatically comments on pull requests with the preview URL

#### Branch Configuration

To configure which branch triggers production deployments:

1. Go to **Settings** → **Git** in the Vercel Dashboard
2. Set the **Production Branch** to your desired branch (default: `main`)

---

## Manual Deployment

If you prefer to deploy manually without Git integration, you can use the Vercel CLI:

### Install the Vercel CLI

```bash
npm install -g vercel
```

### Deploy

```bash
# Login to Vercel
vercel login

# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod
```

### Deploy a Pre-Built Bundle

If you want to build locally and deploy the output:

```bash
# Build the application
npm run build

# Deploy the dist directory
vercel deploy dist --prod
```

---

## CI/CD Notes

### Pre-Deployment Checks

Before deploying, the following checks should pass:

1. **Linting:** Ensure no linting errors exist in the codebase
2. **Tests:** Run the full test suite to verify all tests pass

```bash
# Run all tests
npm run test

# Build the application (also validates the build)
npm run build
```

### Recommended CI/CD Pipeline

For teams using GitHub Actions or similar CI/CD tools, the recommended pipeline is:

1. **Install dependencies:** `npm install`
2. **Run tests:** `npm run test`
3. **Build:** `npm run build`
4. **Deploy:** Automatic via Vercel Git integration (no additional step needed)

#### Example GitHub Actions Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
```

> **Note:** When using Vercel's Git integration, Vercel handles the build and deployment automatically on each push. The CI workflow above is for running tests and validating the build before Vercel deploys.

### Vercel Build Hooks

For triggering deployments from external CI/CD systems:

1. Go to **Settings** → **Git** → **Deploy Hooks** in the Vercel Dashboard
2. Create a deploy hook with a name and branch
3. Use the generated webhook URL to trigger deployments via HTTP POST:

```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/your-hook-id
```

---

## Troubleshooting

### Common Issues

#### 1. Routes return 404 on direct navigation

**Cause:** The `vercel.json` SPA rewrite rule is missing or misconfigured.

**Solution:** Ensure `vercel.json` exists in the project root with the following content:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 2. Static JSON data files not loading

**Cause:** The `public/data/` directory is not included in the build output.

**Solution:** Vite automatically copies files from the `public/` directory to the build output. Verify that the `public/data/` directory contains all required JSON files:

- `archiveHealth.json`
- `assistantResponses.json`
- `auditLog.json`
- `documents.json`
- `employees.json`
- `users.json`

#### 3. Environment variables not available in the application

**Cause:** Variables are not prefixed with `VITE_` or are not set in the Vercel environment.

**Solution:**
- Ensure all client-side environment variables are prefixed with `VITE_`
- Verify variables are set in the Vercel Dashboard under **Settings** → **Environment Variables**
- Redeploy after adding or changing environment variables

#### 4. Build fails with dependency errors

**Cause:** Node.js version mismatch or corrupted `node_modules`.

**Solution:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Verify Node.js version
node --version  # Should be 18.x or later
```

#### 5. Blank page after deployment

**Cause:** The base URL is misconfigured or assets are not loading.

**Solution:**
- Check the browser console for errors
- Verify that `vite.config.js` does not set a custom `base` path (the default `/` is correct for Vercel)
- Ensure the build completed successfully without errors

---

## Data & Architecture Notes

- **No backend API:** The application operates entirely client-side with static JSON fixtures served from the `public/data/` directory
- **Session-local state:** Audit events and user sessions are stored in-memory and reset on page reload
- **localStorage persistence:** The selected user profile is persisted in `localStorage` under the key `payroll_archive_hub_user`
- **Fixture caching:** JSON fixtures are cached in-memory after the first fetch to prevent redundant network requests (see `src/utils/fixtureLoader.js`)

---

## Related Files

| File                  | Purpose                                          |
|-----------------------|--------------------------------------------------|
| `vercel.json`         | Vercel deployment configuration with SPA rewrites|
| `vite.config.js`      | Vite build tool configuration                    |
| `package.json`        | Dependencies, scripts, and project metadata      |
| `.env.example`        | Example environment variables                    |
| `public/data/`        | Static JSON fixture data files                   |
| `tailwind.config.js`  | Tailwind CSS configuration with Kelly branding   |
| `postcss.config.js`   | PostCSS configuration for Tailwind               |