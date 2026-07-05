import { expect, test } from '@playwright/test';

test.describe('Table — built-in cell renderers', () => {
  test('tag and tag-array cells render Pills with consumer classes', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-builtin-cells"]');
    await expect(table).toBeVisible();
    await expect(table.locator('td .pill-success')).toHaveCount(1);
    await expect(table.locator('td .pill-warning')).toHaveCount(1);
    await expect(table.locator('td .pill-error')).toHaveCount(1);
    // tag-array: row 0 has two Web/App chips, row 1 one chip
    await expect(table.locator('td .pill-info')).toHaveCount(3);
  });

  test('two-line-text cells render primary and secondary lines', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-builtin-cells"]');
    const firstPlanCell = table.locator('tbody tr').first().locator('td').first();
    await expect(firstPlanCell).toContainText('Growth Monthly');
    await expect(firstPlanCell).toContainText('PLN-0042');
  });

  test('avatar-stack caps at 4 chips and shows the +N overflow', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-builtin-cells"]');
    const secondRow = table.locator('tbody tr').nth(1);
    await expect(secondRow).toContainText('+2');
  });

  test('compare cells render primary, comparison, and colored trend; scalar rows fall back to text', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-builtin-cells"]');
    const firstRevenue = table.locator('tbody tr').nth(0).locator('td').nth(4);
    await expect(firstRevenue).toContainText('₹4,938.10');
    await expect(firstRevenue).toContainText('₹4,100.00');
    await expect(firstRevenue.locator('.builtin-trend-up')).toContainText('20%');
    const secondRevenue = table.locator('tbody tr').nth(1).locator('td').nth(4);
    await expect(secondRevenue.locator('.builtin-trend-down')).toContainText('-20%');
    const thirdRevenue = table.locator('tbody tr').nth(2).locator('td').nth(4);
    await expect(thirdRevenue).toContainText('n/a');
  });

  test('toggle cells emit the column onToggle with row index and the NEW post-flip state', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-builtin-cells"]');
    // Row 0 starts checked: true — flipping off must report the new state (false).
    await table.locator('[data-pw="builtin-toggle-0"] label.switch').click();
    await expect(page.locator('[data-pw="builtin-toggle-result"]')).toContainText('row 0 → false');
    // Row 1 starts checked: false — flipping on must report the new state (true).
    await table.locator('[data-pw="builtin-toggle-1"] label.switch').click();
    await expect(page.locator('[data-pw="builtin-toggle-result"]')).toContainText('row 1 → true');
  });

  test('link cells render an anchor, copy affordance opt-out, and null fallback', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-builtin-cells"]');
    const firstLink = table.locator('[data-pw="builtin-docs-link-0"]');
    await expect(firstLink).toHaveAttribute('href', 'https://example.com/plans/42');
    await expect(firstLink).toContainText('plans/42');
    await expect(table.locator('[data-pw="builtin-docs-copy-0"]')).toBeVisible();
    // Row 1 sets copyable: false — no copy button
    await expect(table.locator('[data-pw="builtin-docs-copy-1"]')).toHaveCount(0);
    // Row 2 has a null link value — plain dash fallback
    const thirdDocs = table.locator('tbody tr').nth(2).locator('td').nth(6);
    await expect(thirdDocs).toContainText('-');
  });

  test('copy button writes the url to the clipboard and shows Copied', async ({
    page,
    context
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-builtin-cells"]');
    await table.locator('[data-pw="builtin-docs-copy-0"]').click();
    await expect(table.locator('.builtin-link-copied')).toContainText('Copied');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('https://example.com/plans/42');
  });

  test('icon-label cells render leading icons with the label, icon-less rows label only', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-media-cells"]');
    const firstGateway = table.locator('tbody tr').first().locator('td').first();
    await expect(firstGateway.locator('.builtin-icon-label-icon')).toHaveCount(2);
    await expect(firstGateway).toContainText('UPI + Card');
    const secondGateway = table.locator('tbody tr').nth(1).locator('td').first();
    await expect(secondGateway.locator('.builtin-icon-label-icon')).toHaveCount(0);
    await expect(secondGateway).toContainText('NetBanking');
  });

  test('image-two-line-text cells render a thumbnail or placeholder plus both lines', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-media-cells"]');
    const firstProduct = table.locator('tbody tr').first().locator('td').nth(1);
    await expect(firstProduct.locator('.builtin-thumb:not(.builtin-thumb-placeholder)')).toHaveCount(
      1
    );
    await expect(firstProduct).toContainText('Silk Kurta');
    await expect(firstProduct).toContainText('SKU-1042');
    const secondProduct = table.locator('tbody tr').nth(1).locator('td').nth(1);
    await expect(secondProduct.locator('.builtin-thumb-placeholder')).toHaveCount(1);
    await expect(secondProduct).toContainText('Cotton Saree');
  });
});
