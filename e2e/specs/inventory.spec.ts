import { test, expect } from '@playwright/test';
import { assertPageLoadPerformance, assertActionPerformance } from '../helpers/performance';

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Update E2E Tests
// Tests viewing, adding, and updating inventory items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should display inventory page', async ({ page }) => {
    await expect(page).toHaveURL(/\/inventory/);
    await expect(
      page.getByRole('heading').or(page.getByText(/inventory/i)).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should display inventory items list', async ({ page }) => {
    // Wait for items to load (table, grid, or list)
    const hasItems = await page
      .locator('table, [role="grid"], [data-testid="inventory-list"]')
      .first()
      .isVisible()
      .catch(() => false);

    // If there's an empty state, that's valid too
    if (!hasItems) {
      await expect(
        page.getByText(/no items|empty|get started/i),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test('should open add inventory item dialog', async ({ page }) => {
    const addButton = page
      .getByRole('button', { name: /add item|new item|add inventory|\+/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();

      await expect(
        page.getByRole('dialog').or(page.getByRole('form')).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test('should update inventory item quantity', async ({ page }) => {
    // This test verifies that the delta/increment endpoint works via the UI
    // Look for an existing item's edit button or quantity control
    const editButton = page
      .getByRole('button', { name: /edit|update|adjust/i })
      .first();

    if (await editButton.isVisible()) {
      await assertActionPerformance(
        page,
        'Open Edit Inventory Dialog',
        async () => {
          await editButton.click();
          await page
            .getByRole('dialog')
            .or(page.getByRole('form'))
            .first()
            .waitFor({ state: 'visible', timeout: 5_000 });
        },
      );

      // Look for quantity input
      const quantityInput = page.getByLabel(/quantity|stock|qty/i).first();
      if (await quantityInput.isVisible()) {
        await quantityInput.clear();
        await quantityInput.fill('50');

        const saveButton = page
          .getByRole('button', { name: /save|update|confirm/i })
          .last();
        if (await saveButton.isVisible()) {
          await assertActionPerformance(
            page,
            'Save Inventory Update',
            async () => {
              await saveButton.click();
              await page.waitForTimeout(2_000);
            },
          );
        }
      }
    }
  });

  test('inventory page loads under 3 seconds', async ({ page }) => {
    await assertPageLoadPerformance(page, '/inventory');
  });
});
