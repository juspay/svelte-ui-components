import { expect, test } from '@playwright/test';

// Covers the extended StatCard: backward-compatible single value, multi-row layout
// with dividers + per-row deltas, the breakdown grid, a header that renders without
// a title, the onCheckboxChange callback, and the guard that keeps checkbox
// interaction from firing an interactive card's click action.
test.describe('StatCard', () => {
  test('renders a basic single value (backward compatible)', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('basic-positive');
    await expect(card).toBeVisible();
    await expect(card.getByTestId('basic-positive-value')).toHaveText('8,610');
  });

  test('multi-row card renders a row and a divider per metric', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('multi-row');
    await expect(card.getByTestId(/^checkout-row-\d+$/)).toHaveCount(3);
    await expect(card.getByTestId(/^multi-row-row-divider-\d+$/)).toHaveCount(2);
    await expect(card.getByTestId(/^multi-row-delta-\d+$/)).toHaveCount(3);
  });

  test('horizontal rows lay the sections side by side', async ({ page }) => {
    await page.goto('/components/stat-card');

    const rowsContainer = page.getByTestId('horizontal-rows-rows');
    await expect(rowsContainer).toHaveClass(/statcard-rows-horizontal/);
    await expect(rowsContainer).toHaveCSS('flex-direction', 'row');

    // Sections sit side by side: every row shares the same vertical top.
    const tops = await page
      .getByTestId('horizontal-rows')
      .getByTestId(/^checkout-row-\d+$/)
      .evaluateAll((rows) => rows.map((row) => Math.round(row.getBoundingClientRect().top)));
    expect(tops.length).toBe(3);
    expect(new Set(tops).size).toBe(1);
  });

  test('breakdown grid renders one item per breakdown entry', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('with-breakdown');
    await expect(card.getByTestId(/^with-breakdown-breakdown-item-\d+-\d+$/)).toHaveCount(3);
  });

  test('renders the header even when no title is set', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('headerless-card');
    await expect(card.getByTestId('headerless-card-header')).toHaveCount(1);
    await expect(card.getByTestId('headerless-card-title')).toHaveCount(0);
    await expect(card.getByRole('checkbox')).toBeVisible();
  });

  test('checkbox toggle fires onCheckboxChange', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('with-checkbox');
    await expect(card.getByTestId('with-checkbox-value')).toHaveText('₹10.9Cr');
    await card.getByRole('checkbox').click();
    await expect(card.getByTestId('with-checkbox-value')).toHaveText('₹12.4Cr');
  });

  test('toggling the checkbox does not trigger the card action', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('clickable-checkbox-card');
    const clickCount = page.getByTestId('card-click-count');
    await expect(clickCount).toHaveText('0');

    // Checkbox toggles without firing the card's onclick.
    await card.getByRole('checkbox').click();
    await expect(card.getByRole('checkbox')).toHaveClass(/checked/);
    await expect(clickCount).toHaveText('0');

    // Clicking the card body still fires the action.
    await card.getByTestId('clickable-checkbox-card-value').click();
    await expect(clickCount).toHaveText('1');
  });

  test('renders the subtitle below metric rows', async ({ page }) => {
    await page.goto('/components/stat-card');

    // Regression: the subtitle block previously lived inside the no-rows {:else}
    // branch, so a card given both `rows` and `subtitle` silently dropped the
    // subtitle (e.g. the "Today vs Yesterday" comparison label).
    const card = page.getByTestId('rows-with-subtitle');
    await expect(card.getByTestId(/^checkout-row-\d+$/)).toHaveCount(3);
    await expect(card.getByTestId('rows-with-subtitle-subtitle')).toHaveText('Today vs Yesterday');
  });

  test('still renders the subtitle for a single-value card', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('with-subtitle');
    await expect(card.getByTestId(/^checkout-row-\d+$/)).toHaveCount(0);
    await expect(card.getByTestId('with-subtitle-subtitle')).toHaveText('vs last 30 days');
  });
});
