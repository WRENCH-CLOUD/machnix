import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test or .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * WrenchCloud E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // ─── Test Discovery ───────────────────────────────────────────────────────────
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  // ─── Execution ────────────────────────────────────────────────────────────────
  fullyParallel: true,
  forbidOnly: !!process.env.CI,          // Fail CI if .only() is left in
  retries: process.env.CI ? 2 : 0,       // Retry flaky tests on CI
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,                        // Per-test timeout

  // ─── Reporting ────────────────────────────────────────────────────────────────
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]  // CI: HTML report + GitHub annotations
    : [['html', { open: 'on-failure' }]],         // Local: auto-open on failure

  // ─── Shared Settings ──────────────────────────────────────────────────────────
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',                // Capture trace on first retry
    screenshot: 'only-on-failure',           // Screenshot on failure
    video: 'retain-on-failure',              // Video on failure
    actionTimeout: 10_000,                   // Per-action timeout
  },

  // ─── Browser Matrix ───────────────────────────────────────────────────────────
  projects: [
    // Setup project: runs auth flow and stores session state
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    // Chromium
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Firefox
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // WebKit (Safari)
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // ─── Dev Server ───────────────────────────────────────────────────────────────
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
