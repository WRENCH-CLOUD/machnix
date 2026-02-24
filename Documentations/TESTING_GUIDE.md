# 🧪 WrenchCloud Testing & CI/CD Guide

> Everything you need to know about running tests, pre-commit hooks, and the CI pipeline.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Unit Tests (Jest)](#2-unit-tests-jest)
3. [E2E Tests (Playwright)](#3-e2e-tests-playwright)
4. [Performance Tests](#4-performance-tests)
5. [Pre-Commit Hooks (Husky)](#5-pre-commit-hooks-husky)
6. [CI/CD Pipeline (GitHub Actions)](#6-cicd-pipeline-github-actions)
7. [Writing New Tests](#7-writing-new-tests)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Quick Start

### First-time setup

```bash
# 1. Install all dependencies (also sets up Husky hooks automatically)
npm install

# 2. Install Playwright browsers (only needed once)
npx playwright install --with-deps chromium

# 3. Set up E2E test credentials
cp .env.test.example .env.test
# Then edit .env.test and add your test user's email & password
```

### Day-to-day commands

| What you want to do                  | Command                  |
| ------------------------------------ | ------------------------ |
| Run unit tests                       | `npm run test:unit`      |
| Run unit tests in watch mode         | `npm run test:watch`     |
| Run all E2E tests                    | `npm run test:e2e`       |
| Run E2E tests with interactive UI    | `npm run test:e2e:ui`    |
| Run performance regression tests     | `npm run test:perf`      |
| View the last E2E test report        | `npm run test:e2e:report`|
| Run lint + typecheck + format + test | `npm run check-all`      |
| Format all code with Prettier        | `npm run format`         |
| Check formatting without writing     | `npm run format:check`   |

---

## 2. Unit Tests (Jest)

Unit tests use **Jest** with `jest-environment-jsdom` for React component tests.

### Running

```bash
# Run all unit tests
npm run test:unit

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run a specific test file
npx jest src/components/landing/__tests__/faq-section.test.tsx

# Run with coverage report
npx jest --coverage
```

### Where to put unit tests

Unit tests go **next to** the code they test, inside a `__tests__` folder:

```
src/
├── components/
│   └── landing/
│       ├── __tests__/
│       │   └── faq-section.test.tsx   ← unit test
│       └── faq-section.tsx            ← component
├── modules/
│   └── job/
│       └── application/
│           ├── __tests__/
│           │   └── create-job.use-case.test.ts
│           └── create-job.use-case.ts
```

### Example unit test

```typescript
// src/modules/job/application/__tests__/create-job.use-case.test.ts
import { describe, it, expect, jest } from '@jest/globals';

describe('CreateJobUseCase', () => {
  it('should validate that customer name is required', () => {
    // your test logic here
    expect(true).toBe(true);
  });
});
```

---

## 3. E2E Tests (Playwright)

E2E tests verify **real user flows** in a headless browser. They test the full stack — UI, API routes, and database.

### Setup

Before running E2E tests, you need test credentials:

```bash
# Copy the example env file
cp .env.test.example .env.test
```

Edit `.env.test` and fill in:

```env
E2E_BASE_URL=http://localhost:3000
E2E_USER_EMAIL=your-test-user@example.com
E2E_USER_PASSWORD=your-test-password
```

> **Tip:** Create a dedicated test user account in your dev/staging environment.

### Running

```bash
# Run all E2E tests (starts dev server automatically)
npm run test:e2e

# Run with the Playwright UI (great for debugging)
npm run test:e2e:ui

# Run a specific test file
npx playwright test e2e/specs/login.spec.ts

# Run only Chromium (faster)
npx playwright test --project=chromium

# Run in headed mode (see the browser)
npx playwright test --headed

# View the HTML test report after a run
npm run test:e2e:report
```

### What's being tested

| Test File                       | What it covers                                       |
| ------------------------------- | ---------------------------------------------------- |
| `e2e/specs/login.spec.ts`      | Login page display, invalid creds, successful login  |
| `e2e/specs/job-card.spec.ts`   | Creating a job card, opening the form, submitting     |
| `e2e/specs/inventory.spec.ts`  | Viewing inventory, adding items, updating quantities |
| `e2e/specs/performance.spec.ts`| All critical routes load under 3 seconds             |

### How authentication works

Playwright authenticates **once** in `e2e/global.setup.ts` and saves the session to `e2e/.auth/user.json`. All other tests reuse this session, so they don't need to log in again. This makes tests faster and more reliable.

### Debugging a failed test

```bash
# 1. Run with trace recording
npx playwright test --trace on

# 2. Open the trace viewer
npx playwright show-trace test-results/<test-name>/trace.zip

# 3. Or use the UI mode for step-by-step debugging
npm run test:e2e:ui
```

When tests fail, Playwright saves:
- **Screenshots** → `test-results/` folder
- **Videos** → `test-results/` folder (on failure)
- **Trace files** → `test-results/` folder (on retry)

---

## 4. Performance Tests

Performance tests ensure that **no page takes longer than 3 seconds** to load. They use the `assertPageLoadPerformance()` helper from `e2e/helpers/performance.ts`.

### Running

```bash
# Run performance tests only
npm run test:perf
```

### What's checked

For each critical route, the performance helper checks:

| Metric                     | Threshold                | What it means                              |
| -------------------------- | ------------------------ | ------------------------------------------ |
| **Total Load Time**        | ≤ 3,000ms               | Time from navigation start to `load` event |
| **TTFB (Time to First Byte)** | ≤ 1,000ms (budget/3) | Server response time                       |
| **LCP (Largest Contentful Paint)** | ≤ 3,000ms        | When the main content becomes visible      |

### Routes currently tested

| Route          | Budget  |
| -------------- | ------- |
| `/login`       | 3,000ms |
| `/dashboard`   | 3,000ms |
| `/jobs-board`  | 3,000ms |
| `/all-jobs`    | 3,000ms |
| `/inventory`   | 3,000ms |
| `/customers`   | 3,000ms |
| `/settings`    | 3,000ms |
| `/vehicles`    | 3,000ms |

### Adding a new route to perf tests

Edit `e2e/specs/performance.spec.ts` and add to the `CRITICAL_ROUTES` array:

```typescript
const CRITICAL_ROUTES = [
  // ... existing routes
  { path: '/reports', label: 'Reports', budget: 3_000 },  // ← add here
];
```

### Using the performance helper in your own tests

```typescript
import { assertPageLoadPerformance, assertActionPerformance } from '../helpers/performance';

// Check that a page loads within the budget
await assertPageLoadPerformance(page, '/dashboard', { maxLoadTimeMs: 2500 });

// Check that a user action completes within the budget
await assertActionPerformance(page, 'Submit Job Form', async () => {
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForURL(/\/jobs\//);
}, { maxLoadTimeMs: 2000 });
```

---

## 5. Pre-Commit Hooks (Husky)

Husky is configured to **automatically block bad commits and pushes**.

### What happens automatically

| When you...     | Hook runs...   | What it checks                                                  |
| --------------- | -------------- | --------------------------------------------------------------- |
| `git commit`    | `pre-commit`   | **lint-staged** → ESLint + Prettier on your **staged files only** |
| `git push`      | `pre-push`     | **TypeScript type check** (`tsc --noEmit`)                      |

### What does lint-staged do?

It only checks the files you're actually committing (not the whole repo), so it's fast:

- `*.ts, *.tsx` → ESLint fix + Prettier format
- `*.js, *.jsx` → ESLint fix + Prettier format
- `*.json, *.md, *.yml, *.css` → Prettier format

### Bypassing hooks (emergency only)

```bash
# Skip pre-commit hook
git commit --no-verify -m "hotfix: emergency patch"

# Skip pre-push hook
git push --no-verify
```

> ⚠️ CI will still catch issues even if you skip hooks locally.

### If hooks aren't running

```bash
# Reinstall Husky
npx husky install

# Or re-run prepare
npm run prepare
```

---

## 6. CI/CD Pipeline (GitHub Actions)

The pipeline at `.github/workflows/ci.yml` runs on every **push and PR** to `main` and `develop`.

### Pipeline stages

```
Push/PR to main or develop
         │
         ▼
    ┌─────────────┐
    │  🔍 Quality  │   ← ESLint + TypeScript type check
    └──────┬──────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────┐
│ 🧪 Unit │ │ 🎭 E2E   │   ← Jest tests + Playwright (Chromium)
│  Tests  │ │  Tests   │
└────┬────┘ └────┬─────┘
     │           │
     └─────┬─────┘
           ▼
    ┌──────────────┐
    │ ⚡ Perf Tests │   ← Only on main branch pushes
    └──────────────┘
```

### GitHub Secrets you need to set

Go to **GitHub → Repo → Settings → Secrets and variables → Actions** and add:

| Secret                          | Value                                | Required For    |
| ------------------------------- | ------------------------------------ | --------------- |
| `E2E_USER_EMAIL`                | Test user email                      | E2E tests       |
| `E2E_USER_PASSWORD`             | Test user password                   | E2E tests       |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL            | Build step      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key               | Build step      |

### What happens on failure

- **Lint/Typecheck fails** → PR is blocked, errors shown in GitHub annotations
- **Unit tests fail** → Coverage report uploaded as artifact
- **E2E tests fail** → Playwright HTML report + screenshots + videos uploaded as artifacts
- **Perf tests fail** → Report uploaded as artifact

### Downloading failure reports

1. Go to the failed workflow run on GitHub
2. Scroll to the bottom → **Artifacts** section
3. Download `playwright-report` or `coverage-report`
4. Unzip and open `index.html` in your browser

---

## 7. Writing New Tests

### Adding a new E2E test

1. Create a new file under `e2e/specs/`:

```typescript
// e2e/specs/customers.spec.ts
import { test, expect } from '@playwright/test';
import { assertPageLoadPerformance } from '../helpers/performance';

test.describe('Customer Management', () => {
  test('should display customers list', async ({ page }) => {
    await page.goto('/customers');
    await expect(page).toHaveURL(/\/customers/);
    // add your assertions...
  });

  test('customers page loads under 3s', async ({ page }) => {
    await assertPageLoadPerformance(page, '/customers');
  });
});
```

2. That's it — Playwright auto-discovers `*.spec.ts` files in `e2e/`.

### Adding a new unit test

1. Create a `__tests__` folder next to the code you're testing:

```typescript
// src/modules/inventory/application/__tests__/update-stock.test.ts
import { describe, it, expect } from '@jest/globals';

describe('UpdateStock', () => {
  it('should not allow negative quantities', () => {
    // your test logic
  });
});
```

2. Jest auto-discovers files matching `*.test.ts` or `*.spec.ts`.

### Test naming conventions

| Type          | File pattern              | Location                           |
| ------------- | ------------------------- | ---------------------------------- |
| Unit test     | `*.test.ts` / `*.test.tsx`| `src/**/__tests__/`                |
| E2E test      | `*.spec.ts`               | `e2e/specs/`                       |
| E2E helper    | `*.ts`                    | `e2e/helpers/`                     |

---

## 8. Troubleshooting

### "Playwright browsers not installed"

```bash
npx playwright install --with-deps chromium
# Or install all browsers:
npx playwright install --with-deps
```

### "E2E tests skip authentication tests"

Make sure `.env.test` exists and has valid credentials:

```bash
cp .env.test.example .env.test
# Edit .env.test with your test user's email and password
```

### "Pre-commit hook fails on formatting"

The hook auto-fixes formatting, but if it still fails:

```bash
# Format everything manually
npm run format

# Then stage the fixed files
git add .
git commit -m "your message"
```

### "TypeScript errors on push"

The `pre-push` hook runs `tsc --noEmit`. Fix type errors before pushing:

```bash
npm run typecheck
```

### "CI build fails but works locally"

Common causes:
- Missing environment variables → Add them as GitHub Secrets
- Different Node.js version → CI uses Node 20
- Dependencies changed → Make sure `package-lock.json` is committed

### Running the full CI check locally

Before pushing a big PR, run the same checks CI runs:

```bash
npm run check-all
```

This runs: **lint → typecheck → format check → unit tests** — all in sequence.
