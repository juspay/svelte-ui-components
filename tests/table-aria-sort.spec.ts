import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.describe('Table — the sorted column announces its direction', () => {
  // The table drew a sort arrow and changed row order, and said none of it in the
  // accessibility tree: the arrow is a decorative glyph inside a button whose label
  // is only "Sort by Name". A screen-reader user could operate the control and never
  // learn which column the table is ordered by, or in which direction -- the state
  // existed solely as a shape on screen. aria-sort is the one attribute that carries
  // it, and it belongs on the header cell rather than the button, because the cell is
  // what a table-navigation command lands on.
  // Scoped to the keyed-features table, as every other locator in this file already
  // is. `featureColumns` is shared with the mobileCardLayout demo further down the
  // same page, so this testId matches two header cells and a bare page-wide
  // getByTestId is a strict-mode violation rather than an ambiguity Playwright picks
  // a winner for.
  const TABLE = 'table-keyed-features';
  const HEADER = 'keyed-header-name';

  test('a sortable column starts at none and cycles ascending then descending', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    const nameHeader = page.getByTestId(TABLE).getByTestId(HEADER);
    // Unsorted, but sortable: "none" is what says the control exists and is unused.
    // Omitting the attribute here would be indistinguishable from a column that
    // cannot be sorted at all.
    await expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    const sortButton = nameHeader.getByRole('button', { name: /sort by name/i });
    await sortButton.click();
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    await sortButton.click();
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('the attribute tracks the column actually sorted, not every sortable one', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    const nameHeader = page.getByTestId(TABLE).getByTestId(HEADER);
    await nameHeader.getByRole('button', { name: /sort by name/i }).click();
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // Sorting a second column must return the first to "none". Two columns both
    // claiming to be the sort key is worse than none claiming it.
    const statusHeader = page.locator('[data-pw="table-keyed-features"] th').nth(2);
    await statusHeader.getByRole('button', { name: /sort by status/i }).click();

    await expect(statusHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  test('a column that cannot be sorted carries no aria-sort at all', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    // `sortable: false` on the Department column. "none" would advertise a control
    // that is not there, so the attribute must be absent rather than empty.
    const department = page.locator('[data-pw="table-keyed-features"] th').nth(1);
    await expect(department).toHaveText(/Department/);
    await expect(department).not.toHaveAttribute('aria-sort', /.*/);
  });
});
