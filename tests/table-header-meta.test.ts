import { expect, test } from '@playwright/test';

test.describe('Table — header metadata + controlled sort', () => {
  test('align: right applies to the header and body cells of that column only', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-header-meta');
    await expect(table.getByTestId('meta-amount')).toHaveCSS('text-align', 'right');
    const amountCell = table
      .getByRole('rowgroup')
      .last()
      .getByRole('row')
      .first()
      .getByRole('cell')
      .nth(2);
    await expect(amountCell).toHaveCSS('text-align', 'right');
    await expect(table.getByTestId('meta-name')).toHaveCSS('text-align', 'left');
  });

  test('maxWidth caps the column and ellipsizes scalar cells with a title tooltip', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-header-meta');
    const longIdTd = table
      .getByRole('rowgroup')
      .last()
      .getByRole('row')
      .first()
      .getByRole('cell')
      .first();
    await expect(longIdTd).toHaveCSS('max-width', '120px');
    await expect(longIdTd).toHaveAttribute('title', 'ORD-9f3k2m8x7c1v5b9n4q6w2e');
    await expect(table.getByTestId('meta-id-cell-0')).toHaveCSS('text-overflow', 'ellipsis');
  });

  test('header tooltip renders on hover', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-header-meta');
    const nameHeader = table.getByTestId('meta-name');
    // Hover the tooltip's own trigger label, not the wider <th>: this column
    // is sortable, so a sort button also lives inside the same header cell,
    // and the <th>'s own padding surrounds both — hovering the cell's
    // geometric center (Playwright's default target) lands on that padding
    // or the sort button, never on the element Tooltip listens for
    // mouseenter on.
    await nameHeader.locator('.table-header-label').hover();
    // Scope to the header's own bubble — the docs code sample on the page repeats the text.
    await expect(nameHeader.getByRole('tooltip')).toContainText('Customer display name');
  });

  test('filter dropdown filters via the consumer and clears on re-select', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-header-meta');
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(3);

    await table.getByTestId('meta-status-filter-trigger').click();
    // Scope to the open dropdown — pills and docs samples on the page repeat the text.
    await page.getByRole('listbox').getByText('Paused', { exact: true }).click();
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(1);
    await expect(table.getByRole('rowgroup').last().getByRole('row').first()).toContainText('Bob');

    // Re-selecting the active option clears the filter (onFilterChange(null))
    await table.getByTestId('meta-status-filter-trigger').click();
    await page.getByRole('listbox').getByText('Paused', { exact: true }).click();
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(3);
  });

  test('headers and cells wrap at word boundaries, not mid-word (word-break fix)', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-header-meta');
    const header = table.getByTestId('meta-name');
    await expect(header).toHaveCSS('word-break', 'normal');
    await expect(header).toHaveCSS('overflow-wrap', 'break-word');
    const bodyCell = table
      .getByRole('rowgroup')
      .last()
      .getByRole('row')
      .first()
      .getByRole('cell')
      .nth(1);
    await expect(bodyCell).toHaveCSS('word-break', 'normal');
  });

  test('getSortValue sorts currency numerically, not lexicographically', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-header-meta');
    await table.getByRole('button', { name: 'Sort by Amount' }).click();
    const amounts = await table.getByTestId(/^meta-amount-cell-\d+$/).allInnerTexts();
    expect(amounts).toEqual(['₹1,200.00', '₹4,938.10', '₹19,752.40']);
    // Lexicographic order would have been 1,200.00 / 19,752.40 / 4,938.10
    await table.getByRole('button', { name: 'Sort by Amount' }).click();
    const descending = await table.getByTestId(/^meta-amount-cell-\d+$/).allInnerTexts();
    expect(descending).toEqual(['₹19,752.40', '₹4,938.10', '₹1,200.00']);
  });

  test('sortMode server keeps header UI and onSort but lets the consumer reorder', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-server-sort');
    await expect(table.getByTestId('srv-sort-name-cell-0')).toContainText('Gamma');

    await table.getByRole('button', { name: 'Sort by Score' }).click();
    await expect(page.getByTestId('server-sort-log')).toContainText('col 1 asc');
    const names = await table.getByTestId(/^srv-sort-name-cell-\d+$/).allInnerTexts();
    expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);

    await table.getByRole('button', { name: 'Sort by Score' }).click();
    await expect(page.getByTestId('server-sort-log')).toContainText('col 1 desc');
    const reversed = await table.getByTestId(/^srv-sort-name-cell-\d+$/).allInnerTexts();
    expect(reversed).toEqual(['Gamma', 'Beta', 'Alpha']);
  });
});
