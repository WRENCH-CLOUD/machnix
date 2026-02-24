import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

/**
 * Global setup: authenticates a test user and saves session state.
 * All subsequent test projects reuse this auth state via `storageState`.
 *
 * Configure credentials in .env.test:
 *   E2E_USER_EMAIL=test@wrenchcloud.in
 *   E2E_USER_PASSWORD=your-test-password
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test for authentication setup.',
    );
  }

  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder(/password/i).fill(password);

  // Submit the form
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();

  // Wait for successful redirect (auth resolve or dashboard)
  await expect(page).toHaveURL(/\/(auth\/resolve|dashboard)/, { timeout: 15_000 });

  // Wait for final landing page
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
