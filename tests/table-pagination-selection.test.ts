import { expect, test } from '@playwright/test';

test.describe('Table — built-in pagination + row numbers', () => {
  test('client mode slices rows, shows the range, and pages forward', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paginated');
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(5);
    await expect(table.getByTestId('table-paginated-paginator-range')).toContainText('1-5 of 23');
    await expect(table.getByRole('rowgroup').last().getByRole('row').first()).toContainText(
      'Item 01'
    );

    await table.getByTestId('paged-pages').getByRole('button', { name: 'Page 2' }).click();
    await expect(table.getByRole('rowgroup').last().getByRole('row').first()).toContainText(
      'Item 06'
    );
    await expect(table.getByTestId('table-paginated-paginator-range')).toContainText('6-10 of 23');
  });

  test('row numbers are pagination-aware', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paginated');
    await expect(
      table.getByRole('rowgroup').last().getByRole('row').first().getByRole('cell').first()
    ).toContainText('1');
    // From page 1 the pager truncates to [1, 2, …, 5]; the last page is always present.
    await table.getByTestId('paged-pages').getByRole('button', { name: 'Page 5' }).click();
    await expect(
      table.getByRole('rowgroup').last().getByRole('row').first().getByRole('cell').first()
    ).toContainText('21');
  });

  test('handlers receive GLOBAL row indices under client pagination, not page-local', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paginated');
    // Page 1: first row is global index 0.
    await expect(table.getByTestId('paged-idx-0')).toHaveCount(1);
    await table.getByTestId('paged-pages').getByRole('button', { name: 'Page 2' }).click();
    // Page 2: first row must be global index 5 (page-local would be 0 again).
    await expect(table.getByTestId('paged-idx-5')).toHaveCount(1);
    await expect(table.getByTestId('paged-idx-0')).toHaveCount(0);
  });

  test('page-size change re-slices and snaps back to page 1', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paginated');
    await table.getByTestId('paged-pages').getByRole('button', { name: 'Page 2' }).click();
    await expect(table.getByTestId('table-paginated-paginator-range')).toContainText('6-10 of 23');

    const sizeSelect = table.getByTestId('paged-page-size');
    await sizeSelect.getByRole('combobox').click();
    await sizeSelect.getByRole('listbox').getByText('10', { exact: true }).click();
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(10);
    await expect(table.getByTestId('table-paginated-paginator-range')).toContainText('1-10 of 23');
  });

  test('search filters across all pages and snaps back to page 1', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paginated');
    await table.getByTestId('paged-pages').getByRole('button', { name: 'Page 2' }).click();
    // The search bar renders above the table wrapper, outside the testId element.
    await page.getByTestId('paged-search').fill('Item 2');
    // Item 20, 21, 22, 23 match "Item 2" (plus Item 02 does not — padded "02")
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(4);
    // DataGrid parity: once the filtered set fits on one page, the pagination
    // chrome disappears entirely (footer, range text, steppers).
    await expect(table.getByTestId('paged')).toHaveCount(0);

    // Clearing the search restores multi-page data and the paginator with it.
    await page.getByTestId('paged-search').fill('');
    await expect(table.getByTestId('table-paginated-paginator-range')).toContainText('1-5 of 23');
  });
});

test.describe('Table — server-mode pagination', () => {
  test('server mode renders consumer rows untouched with chrome from page/totalItems', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-server-paginated');
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(5);
    await expect(table.getByRole('rowgroup').last().getByRole('row').first()).toContainText(
      'Record 01'
    );
    await expect(table.getByTestId('table-server-paginated-paginator-range')).toContainText(
      '1-5 of 12'
    );
    // pageSizeOptions: [] hides the page-size selector entirely.
    await expect(table.getByTestId('srv-paged-page-size')).toHaveCount(0);
  });

  test('page change reports to the consumer, which swaps the rows (incl. short last page)', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-server-paginated');
    await table.getByTestId('srv-paged-pages').getByRole('button', { name: 'Page 3' }).click();
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(2);
    await expect(table.getByRole('rowgroup').last().getByRole('row').first()).toContainText(
      'Record 11'
    );
    await expect(table.getByTestId('table-server-paginated-paginator-range')).toContainText(
      '11-12 of 12'
    );
  });

  test('getRowTestId emits row-level data-pw for keyed rows', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-server-paginated');
    await expect(table.getByTestId('srv-row-Record 01')).toHaveCount(1);
  });
});

test.describe('Table — page-scoped select-all under client pagination', () => {
  test('header select-all selects ONLY the current page (skipping disabled rows); second click clears it', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paged-select');
    const log = page.getByTestId('paged-select-log');

    // Page 1 shows Members 1-5; Member 2 is disabled.
    await table.getByTestId('table-paged-select-select-all').click();
    await expect(log).toContainText('Member 1,Member 3,Member 4,Member 5');
    await expect(log).not.toContainText('Member 6');
    await expect(table.getByTestId('table-paged-select-select-all')).toHaveAttribute(
      'aria-checked',
      'true'
    );

    // Second click must DESELECT the page (the DataGrid-parity regression:
    // cross-page scope left the header at 'some' and re-selected instead).
    await table.getByTestId('table-paged-select-select-all').click();
    await expect(log).toContainText('Selected: empty');
    await expect(
      table.getByRole('rowgroup').last().getByRole('checkbox', { checked: true })
    ).toHaveCount(0);
  });

  test('header toggle on page 2 leaves page-1 selections intact', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paged-select');
    const log = page.getByTestId('paged-select-log');

    await table.getByTestId('table-paged-select-row-checkbox-Member 1').click();
    await expect(log).toContainText('Selected: Member 1');

    await table.getByTestId('psel-pages').getByRole('button', { name: 'Page 2' }).click();
    await table.getByTestId('table-paged-select-select-all').click();
    await expect(log).toContainText('Member 1,Member 6,Member 7');

    // Deselecting page 2 must not touch the page-1 selection.
    await table.getByTestId('table-paged-select-select-all').click();
    await expect(log).toContainText('Selected: Member 1');
    await expect(log).not.toContainText('Member 6');
  });

  test('row checkboxes expose DataGrid-parity aria-labels; header keeps its own label', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paged-select');
    await expect(table.getByRole('checkbox', { name: 'Select row Member 1' })).toHaveCount(1);
    await expect(
      table.getByRole('rowgroup').first().getByRole('checkbox', { name: 'Select all rows' })
    ).toHaveCount(1);
    await expect(
      table
        .getByRole('rowgroup')
        .first()
        .getByRole('checkbox', { name: /^Select row/ })
    ).toHaveCount(0);
  });
});

test.describe('Table — controlled selection + toolbar', () => {
  test('controlled selection renders from the consumer set and reports next sets', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-controlled-selection');
    await expect(page.getByTestId('bulk-count')).toHaveCount(0);

    await table.getByTestId('table-controlled-selection-row-checkbox-Alice').click();
    await expect(page.getByTestId('bulk-count')).toContainText('1 selected');

    // Header select-all extends the controlled set to every row
    await table.getByTestId('table-controlled-selection-select-all').click();
    await expect(page.getByTestId('bulk-count')).toContainText('4 selected');
  });

  test('toolbar action consumes the selection and clearing hides the toolbar', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-controlled-selection');
    await table.getByTestId('table-controlled-selection-row-checkbox-Bob').click();
    await table.getByTestId('table-controlled-selection-row-checkbox-Carol').click();
    await expect(page.getByTestId('bulk-count')).toContainText('2 selected');

    await page.getByTestId('bulk-delete').click();
    await expect(page.getByTestId('bulk-action-log')).toContainText('deleted Bob,Carol');
    await expect(page.getByTestId('bulk-count')).toHaveCount(0);
    await expect(table.getByRole('checkbox', { checked: true })).toHaveCount(0);
  });

  test('getRowAttributes spreads onto the row checkboxes (header gets -1 sentinel)', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-controlled-selection');
    await expect(
      table.getByTestId('table-controlled-selection-row-checkbox-Alice')
    ).toHaveAttribute('data-selrow', 'Alice');
    await expect(table.getByTestId('table-controlled-selection-select-all')).toHaveAttribute(
      'data-selrow',
      '__header__'
    );
  });
});
