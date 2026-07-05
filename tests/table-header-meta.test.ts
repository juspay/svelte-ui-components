import { expect, test } from '@playwright/test';

test.describe('Table — header metadata + controlled sort', () => {
  test('align: right applies to the header and body cells of that column only', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-header-meta"]');
    await expect(table.locator('th[data-pw="meta-amount"]')).toHaveCSS('text-align', 'right');
    const amountCell = table.locator('tbody tr').first().locator('td').nth(2);
    await expect(amountCell).toHaveCSS('text-align', 'right');
    await expect(table.locator('th[data-pw="meta-name"]')).toHaveCSS('text-align', 'left');
  });

  test('maxWidth caps the column and ellipsizes scalar cells with a title tooltip', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-header-meta"]');
    const longIdCell = table.locator('tbody tr').first().locator('td').first();
    await expect(longIdCell).toHaveCSS('max-width', '120px');
    await expect(longIdCell).toHaveAttribute('title', 'ORD-9f3k2m8x7c1v5b9n4q6w2e');
    await expect(longIdCell.locator('.table-cell-clamp')).toHaveCSS('text-overflow', 'ellipsis');
  });

  test('header tooltip renders on hover', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-header-meta"]');
    await table.locator('th[data-pw="meta-name"] .table-header-label').hover();
    // Scope to the header's own bubble — the docs code sample on the page repeats the text.
    await expect(table.locator('th[data-pw="meta-name"] [role="tooltip"]')).toContainText(
      'Customer display name'
    );
  });

  test('filter dropdown filters via the consumer and clears on re-select', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-header-meta"]');
    await expect(table.locator('tbody tr')).toHaveCount(3);

    await table.locator('[data-pw="meta-status-filter-trigger"]').click();
    // Scope to the open dropdown — pills and docs samples on the page repeat the text.
    await page.getByRole('listbox').getByText('Paused', { exact: true }).click();
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table.locator('tbody tr').first()).toContainText('Bob');

    // Re-selecting the active option clears the filter (onFilterChange(null))
    await table.locator('[data-pw="meta-status-filter-trigger"]').click();
    await page.getByRole('listbox').getByText('Paused', { exact: true }).click();
    await expect(table.locator('tbody tr')).toHaveCount(3);
  });

  test('headers and cells wrap at word boundaries, not mid-word (word-break fix)', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-header-meta"]');
    const header = table.locator('th[data-pw="meta-name"]');
    await expect(header).toHaveCSS('word-break', 'normal');
    await expect(header).toHaveCSS('overflow-wrap', 'break-word');
    const bodyCell = table.locator('tbody tr').first().locator('td').nth(1);
    await expect(bodyCell).toHaveCSS('word-break', 'normal');
  });

  test('getSortValue sorts currency numerically, not lexicographically', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-header-meta"]');
    await table.getByRole('button', { name: 'Sort by Amount' }).click();
    const amounts = await table.locator('tbody tr td:nth-child(3)').allInnerTexts();
    expect(amounts).toEqual(['₹1,200.00', '₹4,938.10', '₹19,752.40']);
    // Lexicographic order would have been 1,200.00 / 19,752.40 / 4,938.10
    await table.getByRole('button', { name: 'Sort by Amount' }).click();
    const descending = await table.locator('tbody tr td:nth-child(3)').allInnerTexts();
    expect(descending).toEqual(['₹19,752.40', '₹4,938.10', '₹1,200.00']);
  });

  test('sortMode server keeps header UI and onSort but lets the consumer reorder', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-server-sort"]');
    await expect(table.locator('tbody tr td:first-child').first()).toContainText('Gamma');

    await table.getByRole('button', { name: 'Sort by Score' }).click();
    await expect(page.locator('[data-pw="server-sort-log"]')).toContainText('col 1 asc');
    const names = await table.locator('tbody tr td:first-child').allInnerTexts();
    expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);

    await table.getByRole('button', { name: 'Sort by Score' }).click();
    await expect(page.locator('[data-pw="server-sort-log"]')).toContainText('col 1 desc');
    const reversed = await table.locator('tbody tr td:first-child').allInnerTexts();
    expect(reversed).toEqual(['Gamma', 'Beta', 'Alpha']);
  });
});
