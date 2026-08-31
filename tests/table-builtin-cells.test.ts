import { expect, test } from '@playwright/test';

test.describe('Table — built-in cell renderers', () => {
  test('tag and tag-array cells render Pills with consumer classes', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-builtin-cells');
    await expect(table).toBeVisible();
    await expect(table.getByTestId('builtin-state-0')).toContainText('Active');
    await expect(table.getByTestId('builtin-state-1')).toContainText('Paused');
    await expect(table.getByTestId('builtin-state-2')).toContainText('Expired');
    // tag-array: row 0 has two Web/App chips, row 1 one chip
    await expect(table.getByTestId('builtin-channels-web-0')).toContainText('Web');
    await expect(table.getByTestId('builtin-channels-app-0')).toContainText('App');
    await expect(table.getByTestId('builtin-channels-web-1')).toContainText('Web');
  });

  test('two-line-text cells render primary and secondary lines', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-builtin-cells');
    const bodyRows = table.getByRole('rowgroup').last().getByRole('row');
    const firstPlanCell = bodyRows.first().getByRole('cell').first();
    await expect(firstPlanCell).toContainText('Growth Monthly');
    await expect(firstPlanCell).toContainText('PLN-0042');
  });

  test('avatar-stack caps at 4 chips and shows the +N overflow', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-builtin-cells');
    const secondRow = table.getByRole('rowgroup').last().getByRole('row').nth(1);
    await expect(secondRow).toContainText('+2');
  });

  test('compare cells render primary, comparison, and colored trend; scalar rows fall back to text', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-builtin-cells');
    const bodyRows = table.getByRole('rowgroup').last().getByRole('row');
    const firstRevenue = bodyRows.nth(0).getByRole('cell').nth(4);
    await expect(firstRevenue).toContainText('₹4,938.10');
    await expect(firstRevenue).toContainText('₹4,100.00');
    await expect(firstRevenue.getByTestId('builtin-revenue-trend-up')).toContainText('20%');
    const secondRevenue = bodyRows.nth(1).getByRole('cell').nth(4);
    await expect(secondRevenue.getByTestId('builtin-revenue-trend-down')).toContainText('-20%');
    const thirdRevenue = bodyRows.nth(2).getByRole('cell').nth(4);
    await expect(thirdRevenue).toContainText('n/a');
  });

  test('toggle cells emit the column onToggle with row index and the NEW post-flip state', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-builtin-cells');
    // Row 0 starts checked: true — flipping off must report the new state (false).
    // Click the switch wrapper, not the checkbox role: the native input is
    // visually hidden (width/height: 0) for the styled-slider pattern, so it
    // has a zero-size bounding box and fails Playwright's actionability check.
    await table.getByTestId('builtin-toggle-0').click();
    await expect(page.getByTestId('builtin-toggle-result')).toContainText('row 0 → false');
    // Row 1 starts checked: false — flipping on must report the new state (true).
    await table.getByTestId('builtin-toggle-1').click();
    await expect(page.getByTestId('builtin-toggle-result')).toContainText('row 1 → true');
  });

  test('link cells render an anchor, copy affordance opt-out, and null fallback', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-builtin-cells');
    const firstLink = table.getByTestId('builtin-docs-link-0');
    await expect(firstLink).toHaveAttribute('href', 'https://example.com/plans/42');
    await expect(firstLink).toContainText('plans/42');
    await expect(table.getByTestId('builtin-docs-copy-0')).toBeVisible();
    // Row 1 sets copyable: false — no copy button
    await expect(table.getByTestId('builtin-docs-copy-1')).toHaveCount(0);
    // Row 2 has a null link value — plain dash fallback
    const thirdDocs = table
      .getByRole('rowgroup')
      .last()
      .getByRole('row')
      .nth(2)
      .getByRole('cell')
      .nth(6);
    await expect(thirdDocs).toContainText('-');
  });

  test('copy button writes the url to the clipboard and shows Copied', async ({
    page,
    context
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/components/table');
    const table = page.getByTestId('table-builtin-cells');
    await table.getByTestId('builtin-docs-copy-0').click();
    await expect(table.getByTestId('builtin-docs-link-copied')).toContainText('Copied');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('https://example.com/plans/42');
  });

  test('icon-label cells render leading icons with the label, icon-less rows label only', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-media-cells');
    const bodyRows = table.getByRole('rowgroup').last().getByRole('row');
    const firstGateway = bodyRows.first().getByRole('cell').first();
    await expect(firstGateway.getByTestId('builtin-gateway-icon-0')).toBeVisible();
    await expect(firstGateway.getByTestId('builtin-gateway-icon-1')).toBeVisible();
    await expect(firstGateway).toContainText('UPI + Card');
    const secondGateway = bodyRows.nth(1).getByRole('cell').first();
    await expect(secondGateway.getByTestId('builtin-gateway-icon-0')).toHaveCount(0);
    await expect(secondGateway).toContainText('NetBanking');
  });

  test('image-two-line-text cells render a thumbnail or placeholder plus both lines', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-media-cells');
    const bodyRows = table.getByRole('rowgroup').last().getByRole('row');
    const firstProduct = bodyRows.first().getByRole('cell').nth(1);
    await expect(firstProduct.getByTestId('builtin-product-thumb')).toBeVisible();
    await expect(firstProduct).toContainText('Silk Kurta');
    await expect(firstProduct).toContainText('SKU-1042');
    const secondProduct = bodyRows.nth(1).getByRole('cell').nth(1);
    await expect(secondProduct.getByTestId('builtin-product-thumb-placeholder')).toBeVisible();
    await expect(secondProduct).toContainText('Cotton Saree');
  });
});
