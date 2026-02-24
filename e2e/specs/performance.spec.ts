import { test } from '@playwright/test';
import { assertPageLoadPerformance } from '../helpers/performance';

// ─────────────────────────────────────────────────────────────────────────────
// Performance Regression Tests
// Runs page-load checks against all critical routes in WrenchCloud.
// Every route must load within its allotted time budget.
// ─────────────────────────────────────────────────────────────────────────────

const CRITICAL_ROUTES = [
  { path: '/login',      label: 'Login Page',      budget: 3_000 },
  { path: '/dashboard',  label: 'Dashboard',       budget: 3_000 },
  { path: '/jobs-board', label: 'Jobs Board',       budget: 3_000 },
  { path: '/all-jobs',   label: 'All Jobs',         budget: 3_000 },
  { path: '/inventory',  label: 'Inventory',        budget: 3_000 },
  { path: '/customers',  label: 'Customers',        budget: 3_000 },
  { path: '/settings',   label: 'Settings',         budget: 3_000 },
  { path: '/vehicles',   label: 'Vehicles',         budget: 3_000 },
] as const;

test.describe('Performance Regression Suite', () => {
  for (const route of CRITICAL_ROUTES) {
    test(`${route.label} (${route.path}) loads within ${route.budget}ms`, async ({ page }) => {
      await assertPageLoadPerformance(page, route.path, {
        maxLoadTimeMs: route.budget,
      });
    });
  }
});
