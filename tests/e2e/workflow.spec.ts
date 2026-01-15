import { test, expect } from '@playwright/test';

test.describe('Core Business Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('mechanic@demo.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Customer -> Vehicle -> Job Card -> Invoice flow', async ({ page }) => {
    // 1. Create Customer
    await page.getByRole('link', { name: 'Customers' }).click();
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await page.getByLabel('Full Name').fill('Test Customer');
    await page.getByLabel('Email').fill('test@customer.com');
    await page.getByRole('button', { name: 'Create Customer' }).click();
    
    // Verify customer created and we are on their profile
    await expect(page.getByRole('heading', { name: 'Test Customer' })).toBeVisible();

    // 2. Add Vehicle
    await page.getByRole('button', { name: 'Add Vehicle' }).click();
    await page.getByLabel('Make').fill('Toyota');
    await page.getByLabel('Model').fill('Camry');
    await page.getByLabel('Year').fill('2022');
    await page.getByLabel('License Plate').fill('TEST-123');
    await page.getByRole('button', { name: 'Save Vehicle' }).click();

    // 3. Open Job Card
    await page.getByRole('button', { name: 'New Job Card' }).click();
    // Assuming a modal or redirect to new job form
    await expect(page.getByRole('heading', { name: 'New Job Card' })).toBeVisible();
    await page.getByRole('button', { name: 'Create Job' }).click();
    
    // 4. Convert Estimate/Job to Invoice
    // Navigate to financials or click action on job
    await page.getByRole('button', { name: 'Generate Invoice' }).click();
    
    // Verify Invoice
    await expect(page).toHaveURL(/.*invoices.*/);
    await expect(page.getByText('Invoice Created')).toBeVisible();
  });
});
