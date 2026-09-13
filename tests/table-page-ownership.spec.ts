import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * In a real browser. The client-mode half is about a dataset that shrinks
 * while the reader is on a later page: the page must resolve to one that has
 * rows, and the range text must describe the data that is actually there. The
 * server-mode half is the opposite obligation — the page and page size belong
 * to the consumer, and the built-in controls only ask.
 */

const rowsOf = (page: Page, table: string) => page.locator(`[data-pw="${table}"] tbody tr`);

test.describe('Table — client pagination survives an external shrink', () => {
  test('a dataset that shrinks under a later page resolves to a page with rows', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');
    const range = page.getByTestId('table-page-shrink-paginator-range');

    await page.getByTestId('shrink-paged-pages').getByRole('button', { name: 'Page 5' }).click();
    await expect(range).toContainText('21-23 of 23');

    await page.getByTestId('shrink-to-five').click();

    // Not a blank page 5 reporting "21-5 of 5".
    await expect(rowsOf(page, 'table-page-shrink')).toHaveCount(5);
    await expect(rowsOf(page, 'table-page-shrink').first()).toContainText('Row 01');
    await expect(range).toContainText('1-5 of 5');
  });

  test('it lands on the last page that still exists, not always page 1', async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    const range = page.getByTestId('table-page-shrink-paginator-range');

    await page.getByTestId('shrink-paged-pages').getByRole('button', { name: 'Page 5' }).click();
    await page.getByTestId('shrink-to-twelve').click();

    await expect(range).toContainText('11-12 of 12');
    await expect(rowsOf(page, 'table-page-shrink')).toHaveCount(2);
    await expect(rowsOf(page, 'table-page-shrink').first()).toContainText('Row 11');
  });

  test('an emptied dataset shows the empty state instead of a page past the end', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('shrink-paged-pages').getByRole('button', { name: 'Page 5' }).click();
    await page.getByTestId('shrink-to-none').click();

    await expect(page.getByTestId('shrink-empty')).toBeVisible();
    await expect(page.getByTestId('table-page-shrink-paginator-range')).toHaveText('');

    // Restoring the data restores a working paginator — and puts the reader
    // back on the page they had chosen. Resolving a too-large page is a
    // display decision taken per render, not a write-back that discards the
    // choice, so a dataset that shrinks and returns (a refetch, a filter
    // widening again) does not silently move the reader to page 1.
    await page.getByTestId('shrink-restore').click();
    await expect(page.getByTestId('table-page-shrink-paginator-range')).toContainText(
      '21-23 of 23'
    );
  });
});

test.describe('Table — server pagination asks, it does not take', () => {
  test('a refused page request leaves the served page on screen', async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    const range = page.getByTestId('table-server-refusal-paginator-range');

    await expect(rowsOf(page, 'table-server-refusal').first()).toContainText('Record 06');
    await expect(range).toContainText('6-10 of 40');

    await page.getByTestId('refusal-paged-pages').getByRole('button', { name: 'Page 3' }).click();

    await expect(page.getByTestId('refusal-log')).toContainText('Requested: 3');
    await expect(page.getByTestId('refusal-log')).toContainText('Serving page 2');
    await expect(rowsOf(page, 'table-server-refusal').first()).toContainText('Record 06');
    await expect(range).toContainText('6-10 of 40');
  });

  test('accepting the request later moves the table', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('refusal-paged-pages').getByRole('button', { name: 'Page 3' }).click();
    await page.getByTestId('refusal-apply').click();

    await expect(rowsOf(page, 'table-server-refusal').first()).toContainText('Record 11');
    await expect(page.getByTestId('table-server-refusal-paginator-range')).toContainText(
      '11-15 of 40'
    );
  });

  test('a declared page size stays authoritative until the consumer changes it', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');
    const range = page.getByTestId('table-server-refusal-paginator-range');

    const sizeSelect = page.getByTestId('refusal-paged-page-size');
    await sizeSelect.getByRole('combobox').click();
    // The page-size dropdown portals its listbox to <body>.
    await page.getByRole('listbox').getByText('10', { exact: true }).click();

    await expect(page.getByTestId('refusal-log')).toContainText('/ 10');
    // Still describing pages of 5, because that is what the server served.
    await expect(range).toContainText('6-10 of 40');

    await page.getByTestId('refusal-apply').click();
    await expect(range).toContainText('11-20 of 40');
  });
});
