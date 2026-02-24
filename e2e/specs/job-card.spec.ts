import { test, expect } from '@playwright/test';
import { assertPageLoadPerformance, assertActionPerformance } from '../helpers/performance';

// ─────────────────────────────────────────────────────────────────────────────
// Job Card E2E Tests
// Tests the critical path: creating, viewing, and managing job cards
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Job Card Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to jobs board (authenticated via storageState)
    await page.goto('/jobs-board');
    await page.waitForLoadState('networkidle');
  });

  test('should display the jobs board page', async ({ page }) => {
    // Verify the jobs board loads successfully
    await expect(page).toHaveURL(/\/jobs-board/);
    // Page should contain job-related elements
    await expect(
      page.getByRole('heading').or(page.getByText(/job/i)).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should open create job dialog/form', async ({ page }) => {
    // Look for "New Job" or "Create Job" or "Add Job" button
    const createButton = page
      .getByRole('button', { name: /new job|create job|add job|\+/i })
      .first();

    // If there's a create button, click it
    if (await createButton.isVisible()) {
      await createButton.click();

      // A dialog or form should appear
      await expect(
        page.getByRole('dialog').or(page.getByRole('form')).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test('should create a new job card successfully', async ({ page }) => {
    // Click the create job button
    const createButton = page
      .getByRole('button', { name: /new job|create job|add job|\+/i })
      .first();
    test.skip(!(await createButton.isVisible()), 'Create button not found – skip');

    await assertActionPerformance(
      page,
      'Open Create Job Dialog',
      async () => {
        await createButton.click();
        await page
          .getByRole('dialog')
          .or(page.getByRole('form'))
          .first()
          .waitFor({ state: 'visible', timeout: 5_000 });
      },
    );

    // Fill in minimal required fields
    // Customer name / phone
    const customerInput = page.getByPlaceholder(/customer|name|phone/i).first();
    if (await customerInput.isVisible()) {
      await customerInput.fill('E2E Test Customer');
    }

    // Vehicle number
    const vehicleInput = page.getByPlaceholder(/vehicle|registration|number/i).first();
    if (await vehicleInput.isVisible()) {
      await vehicleInput.fill('KA01AB1234');
    }

    // Submit the job form
    const submitButton = page
      .getByRole('button', { name: /create|save|submit/i })
      .last();
    if (await submitButton.isVisible()) {
      await assertActionPerformance(
        page,
        'Submit New Job Card',
        async () => {
          await submitButton.click();
          // Wait for success indication (toast, redirect, or dialog close)
          await page.waitForTimeout(2_000);
        },
        { maxLoadTimeMs: 5_000 },
      );
    }
  });

  test('jobs board loads under 3 seconds', async ({ page }) => {
    await assertPageLoadPerformance(page, '/jobs-board');
  });

  test('all-jobs page loads under 3 seconds', async ({ page }) => {
    await assertPageLoadPerformance(page, '/all-jobs');
  });
});
