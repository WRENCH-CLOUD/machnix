import { test, expect } from '@playwright/test';
import { assertPageLoadPerformance } from '../helpers/performance';

// ─────────────────────────────────────────────────────────────────────────────
// Login Flow E2E Tests
// Tests the complete authentication journey for WrenchCloud
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login Flow', () => {
  // Use a fresh context (no stored auth) for login tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display the login page correctly', async ({ page }) => {
    await page.goto('/login');

    // Verify the login form is present
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in|login/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('wrong@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();

    // Wait for error message
    await expect(
      page.getByText(/invalid|failed|incorrect|error/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, 'E2E credentials not configured');

    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill(email!);
    await page.getByPlaceholder(/password/i).fill(password!);
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();

    // Should be redirected away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('login page loads under 3 seconds', async ({ page }) => {
    await assertPageLoadPerformance(page, '/login');
  });
});
