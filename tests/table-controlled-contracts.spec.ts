import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * In a real browser: a consumer holding sort state outside the table can
 * restore it into the built-in header, clear it, update it, and change which
 * columns are visible without the sort silently re-pointing at another field.
 *
 * The demo's state is keyed by column ID, which is what makes the last part
 * possible — the same contract expressed as a column index moves with the
 * POSITION, so hiding a column hands the sort to whatever slid into its slot.
 */

const TABLE = 'table-controlled-sort';

const bodyColumn = (page: Page, colIndex: number) =>
  page.locator(`[data-pw="${TABLE}"] tbody tr td:nth-child(${colIndex + 1})`);

const header = (page: Page, testId: string) => page.getByTestId(testId);

test.describe('Table — controlled sort keyed by column ID', () => {
  test('restores the consumer sort into the header and the row order', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    // The demo starts from { columnId: 'score', direction: 'desc' } — state a
    // consumer would have read out of a URL.
    await expect(header(page, 'ctrl-score')).toHaveAttribute('aria-sort', 'descending');
    await expect(header(page, 'ctrl-name')).toHaveAttribute('aria-sort', 'none');
    await expect(bodyColumn(page, 1)).toHaveText(['30', '20', '10']);
  });

  test('clears to no sort and restores another one from outside the table', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('ctrl-clear-sort').click();
    await expect(header(page, 'ctrl-score')).toHaveAttribute('aria-sort', 'none');
    await expect(header(page, 'ctrl-name')).toHaveAttribute('aria-sort', 'none');
    // Unsorted is the consumer's row order, not the last sort left in place.
    await expect(bodyColumn(page, 0)).toHaveText(['Bob', 'Alice', 'Carol']);

    await page.getByTestId('ctrl-restore-desc').click();
    await expect(header(page, 'ctrl-name')).toHaveAttribute('aria-sort', 'descending');
    await expect(bodyColumn(page, 0)).toHaveText(['Carol', 'Bob', 'Alice']);
  });

  test('a header click reports to the consumer, which decides what the table shows', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    await header(page, 'ctrl-name')
      .getByRole('button', { name: /sort by name/i })
      .click();

    await expect(page.getByTestId('ctrl-sort-log')).toContainText('Reported: name asc');
    await expect(page.getByTestId('ctrl-sort-log')).toContainText('Sort: name asc');
    await expect(bodyColumn(page, 0)).toHaveText(['Alice', 'Bob', 'Carol']);
  });

  test('reordering the columns keeps the sort on the same field', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('ctrl-reverse-columns').click();

    // Score is now the first column and still carries the descending sort.
    await expect(header(page, 'ctrl-score')).toHaveAttribute('aria-sort', 'descending');
    await expect(header(page, 'ctrl-name')).toHaveAttribute('aria-sort', 'none');
    await expect(bodyColumn(page, 0)).toHaveText(['30', '20', '10']);
    await expect(bodyColumn(page, 1)).toHaveText(['Alice', 'Bob', 'Carol']);
  });

  test('hiding the sorted column sorts nothing, rather than sorting its replacement', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('ctrl-hide-score').click();

    await expect(header(page, 'ctrl-score')).toHaveCount(0);
    await expect(header(page, 'ctrl-name')).toHaveAttribute('aria-sort', 'none');
    await expect(bodyColumn(page, 0)).toHaveText(['Bob', 'Alice', 'Carol']);

    // Bringing it back restores the sort it still holds.
    await page.getByTestId('ctrl-hide-score').click();
    await expect(header(page, 'ctrl-score')).toHaveAttribute('aria-sort', 'descending');
    await expect(bodyColumn(page, 1)).toHaveText(['30', '20', '10']);
  });
});

test.describe('Table — controlled search term', () => {
  test('an externally set term appears in the input and filters the rows', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('ctrl-set-search').click();

    await expect(page.getByTestId('ctrl-search')).toHaveValue('Alice');
    await expect(bodyColumn(page, 0)).toHaveText(['Alice']);
  });

  test('typing routes through the consumer and still filters client-side', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('ctrl-search').fill('Carol');

    await expect(page.getByTestId('ctrl-sort-log')).toContainText('Term: Carol');
    await expect(bodyColumn(page, 0)).toHaveText(['Carol']);

    await page.getByTestId('ctrl-search').fill('');
    await expect(page.getByTestId('ctrl-sort-log')).toContainText('Term: empty');
    await expect(bodyColumn(page, 0)).toHaveCount(3);
  });
});
