import { expect, test } from '@playwright/test';

// Covers the extended StatCard: backward-compatible single value, multi-row layout
// with dividers + per-row deltas, the breakdown grid, a header that renders without
// a title, the onCheckboxChange callback, and the guard that keeps checkbox
// interaction from firing an interactive card's click action.
test.describe('StatCard', () => {
  test('renders a basic single value (backward compatible)', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.locator('[data-pw="basic-positive"]');
    await expect(card).toBeVisible();
    await expect(card.locator('.statcard-value')).toHaveText('8,610');
  });

  test('multi-row card renders a row and a divider per metric', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.locator('[data-pw="multi-row"]');
    await expect(card.locator('.statcard-row')).toHaveCount(3);
    await expect(card.locator('.statcard-row-divider')).toHaveCount(2);
    await expect(card.locator('.delta-indicator')).toHaveCount(3);
  });

  test('horizontal rows lay the sections side by side', async ({ page }) => {
    await page.goto('/components/stat-card');

    const rowsContainer = page.locator('[data-pw="horizontal-rows"] .statcard-rows');
    await expect(rowsContainer).toHaveClass(/statcard-rows-horizontal/);
    await expect(rowsContainer).toHaveCSS('flex-direction', 'row');

    // Sections sit side by side: every row shares the same vertical top.
    const tops = await page
      .locator('[data-pw="horizontal-rows"] .statcard-row')
      .evaluateAll((rows) => rows.map((row) => Math.round(row.getBoundingClientRect().top)));
    expect(tops.length).toBe(3);
    expect(new Set(tops).size).toBe(1);
  });

  test('breakdown grid renders one item per breakdown entry', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.locator('[data-pw="with-breakdown"]');
    await expect(card.locator('.statcard-breakdown-item')).toHaveCount(3);
  });

  test('renders the header even when no title is set', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.locator('[data-pw="headerless-card"]');
    await expect(card.locator('.statcard-header')).toHaveCount(1);
    await expect(card.locator('.statcard-title')).toHaveCount(0);
    await expect(card.getByRole('checkbox')).toBeVisible();
  });

  test('checkbox toggle fires onCheckboxChange', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.locator('[data-pw="with-checkbox"]');
    await expect(card.locator('.statcard-value')).toHaveText('₹10.9Cr');
    await card.getByRole('checkbox').click();
    await expect(card.locator('.statcard-value')).toHaveText('₹12.4Cr');
  });

  test('toggling the checkbox does not trigger the card action', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.locator('[data-pw="clickable-checkbox-card"]');
    const clickCount = page.locator('[data-pw="card-click-count"]');
    await expect(clickCount).toHaveText('0');

    // Checkbox toggles without firing the card's onclick.
    await card.getByRole('checkbox').click();
    await expect(card.locator('.box')).toHaveClass(/checked/);
    await expect(clickCount).toHaveText('0');

    // Clicking the card body still fires the action.
    await card.locator('.statcard-value').click();
    await expect(clickCount).toHaveText('1');
  });
});
