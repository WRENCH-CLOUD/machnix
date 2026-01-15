import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login redirects to dashboard on success', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.getByLabel('Email').fill('admin@demo.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Expect redirect to dashboard
    // Checks that we are not on login page anymore and see dashboard content
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email').fill('wrong@email.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid login credentials')).toBeVisible();
  });
});
