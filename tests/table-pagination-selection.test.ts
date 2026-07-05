import { expect, test } from '@playwright/test';

test.describe('Table — built-in pagination + row numbers', () => {
  test('client mode slices rows, shows the range, and pages forward', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paginated"]');
    await expect(table.locator('tbody tr')).toHaveCount(5);
    await expect(table.locator('.table-paginator-range')).toContainText('1-5 of 23');
    await expect(table.locator('tbody tr').first()).toContainText('Item 01');

    await table.locator('[data-pw="paged-pages"]').getByRole('button', { name: 'Page 2' }).click();
    await expect(table.locator('tbody tr').first()).toContainText('Item 06');
    await expect(table.locator('.table-paginator-range')).toContainText('6-10 of 23');
  });

  test('row numbers are pagination-aware', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paginated"]');
    await expect(table.locator('tbody tr').first().locator('td').first()).toContainText('1');
    // From page 1 the pager truncates to [1, 2, …, 5]; the last page is always present.
    await table.locator('[data-pw="paged-pages"]').getByRole('button', { name: 'Page 5' }).click();
    await expect(table.locator('tbody tr').first().locator('td').first()).toContainText('21');
  });

  test('handlers receive GLOBAL row indices under client pagination, not page-local', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paginated"]');
    // Page 1: first row is global index 0.
    await expect(table.locator('tr[data-pw="paged-idx-0"]')).toHaveCount(1);
    await table.locator('[data-pw="paged-pages"]').getByRole('button', { name: 'Page 2' }).click();
    // Page 2: first row must be global index 5 (page-local would be 0 again).
    await expect(table.locator('tr[data-pw="paged-idx-5"]')).toHaveCount(1);
    await expect(table.locator('tr[data-pw="paged-idx-0"]')).toHaveCount(0);
  });

  test('page-size change re-slices and snaps back to page 1', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paginated"]');
    await table.locator('[data-pw="paged-pages"]').getByRole('button', { name: 'Page 2' }).click();
    await expect(table.locator('.table-paginator-range')).toContainText('6-10 of 23');

    const sizeSelect = table.locator('[data-pw="paged-page-size"]');
    await sizeSelect.getByRole('combobox').click();
    await sizeSelect.getByRole('listbox').getByText('10', { exact: true }).click();
    await expect(table.locator('tbody tr')).toHaveCount(10);
    await expect(table.locator('.table-paginator-range')).toContainText('1-10 of 23');
  });

  test('search filters across all pages and snaps back to page 1', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paginated"]');
    await table.locator('[data-pw="paged-pages"]').getByRole('button', { name: 'Page 2' }).click();
    // The search bar renders above the table wrapper, outside the testId element.
    await page.locator('[data-pw="paged-search"]').fill('Item 2');
    // Item 20, 21, 22, 23 match "Item 2" (plus Item 02 does not — padded "02")
    await expect(table.locator('tbody tr')).toHaveCount(4);
    // DataGrid parity: once the filtered set fits on one page, the pagination
    // chrome disappears entirely (footer, range text, steppers).
    await expect(table.locator('.table-paginator')).toHaveCount(0);

    // Clearing the search restores multi-page data and the paginator with it.
    await page.locator('[data-pw="paged-search"]').fill('');
    await expect(table.locator('.table-paginator-range')).toContainText('1-5 of 23');
  });
});

test.describe('Table — server-mode pagination', () => {
  test('server mode renders consumer rows untouched with chrome from page/totalItems', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-server-paginated"]');
    await expect(table.locator('tbody tr')).toHaveCount(5);
    await expect(table.locator('tbody tr').first()).toContainText('Record 01');
    await expect(table.locator('.table-paginator-range')).toContainText('1-5 of 12');
    // pageSizeOptions: [] hides the page-size selector entirely.
    await expect(table.locator('[data-pw="srv-paged-page-size"]')).toHaveCount(0);
  });

  test('page change reports to the consumer, which swaps the rows (incl. short last page)', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-server-paginated"]');
    await table.locator('[data-pw="srv-paged-pages"]').getByRole('button', { name: 'Page 3' }).click();
    await expect(table.locator('tbody tr')).toHaveCount(2);
    await expect(table.locator('tbody tr').first()).toContainText('Record 11');
    await expect(table.locator('.table-paginator-range')).toContainText('11-12 of 12');
  });

  test('getRowTestId emits row-level data-pw for keyed rows', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-server-paginated"]');
    await expect(table.locator('tr[data-pw="srv-row-Record 01"]')).toHaveCount(1);
  });
});

test.describe('Table — page-scoped select-all under client pagination', () => {
  test('header select-all selects ONLY the current page (skipping disabled rows); second click clears it', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paged-select"]');
    const log = page.locator('[data-pw="paged-select-log"]');

    // Page 1 shows Members 1-5; Member 2 is disabled.
    await table.locator('thead .table-checkbox-box').click();
    await expect(log).toContainText('Member 1,Member 3,Member 4,Member 5');
    await expect(log).not.toContainText('Member 6');
    await expect(table.locator('thead .table-checkbox-box')).toHaveAttribute(
      'aria-checked',
      'true'
    );

    // Second click must DESELECT the page (the DataGrid-parity regression:
    // cross-page scope left the header at 'some' and re-selected instead).
    await table.locator('thead .table-checkbox-box').click();
    await expect(log).toContainText('Selected: empty');
    await expect(table.locator('tbody [aria-checked="true"]')).toHaveCount(0);
  });

  test('header toggle on page 2 leaves page-1 selections intact', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paged-select"]');
    const log = page.locator('[data-pw="paged-select-log"]');

    await table.locator('[id="row-checkbox-Member 1"]').click();
    await expect(log).toContainText('Selected: Member 1');

    await table.locator('[data-pw="psel-pages"]').getByRole('button', { name: 'Page 2' }).click();
    await table.locator('thead .table-checkbox-box').click();
    await expect(log).toContainText('Member 1,Member 6,Member 7');

    // Deselecting page 2 must not touch the page-1 selection.
    await table.locator('thead .table-checkbox-box').click();
    await expect(log).toContainText('Selected: Member 1');
    await expect(log).not.toContainText('Member 6');
  });

  test('row checkboxes expose DataGrid-parity aria-labels; header keeps its own label', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-paged-select"]');
    await expect(
      table.locator('[role="checkbox"][aria-label="Select row Member 1"]')
    ).toHaveCount(1);
    await expect(table.locator('thead [aria-label="Select all rows"]')).toHaveCount(1);
    await expect(table.locator('thead [aria-label^="Select row"]')).toHaveCount(0);
  });
});

test.describe('Table — controlled selection + toolbar', () => {
  test('controlled selection renders from the consumer set and reports next sets', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-controlled-selection"]');
    await expect(page.locator('[data-pw="bulk-count"]')).toHaveCount(0);

    await table.locator('#row-checkbox-Alice').click();
    await expect(page.locator('[data-pw="bulk-count"]')).toContainText('1 selected');

    // Header select-all extends the controlled set to every row
    await table.locator('thead .table-checkbox-box').click();
    await expect(page.locator('[data-pw="bulk-count"]')).toContainText('4 selected');
  });

  test('toolbar action consumes the selection and clearing hides the toolbar', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-controlled-selection"]');
    await table.locator('#row-checkbox-Bob').click();
    await table.locator('#row-checkbox-Carol').click();
    await expect(page.locator('[data-pw="bulk-count"]')).toContainText('2 selected');

    await page.locator('[data-pw="bulk-delete"]').click();
    await expect(page.locator('[data-pw="bulk-action-log"]')).toContainText('deleted Bob,Carol');
    await expect(page.locator('[data-pw="bulk-count"]')).toHaveCount(0);
    await expect(table.locator('.table-checkbox-box.checked')).toHaveCount(0);
  });

  test('getRowAttributes spreads onto the row checkboxes (header gets -1 sentinel)', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.locator('[data-pw="table-controlled-selection"]');
    await expect(table.locator('[data-selrow="Alice"]')).toHaveCount(1);
    await expect(table.locator('thead [data-selrow="__header__"]')).toHaveCount(1);
  });
});
