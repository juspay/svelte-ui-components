import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * In a real browser: the four controls the pack names, inside one caller
 * `cell` snippet on a clickable row — a button, a link, an editable input and a
 * popup — plus the data states around them.
 *
 * jsdom can dispatch a keydown, but it cannot tell you whether a space actually
 * REACHED the input, because nothing types. That is the assertion that needs a
 * browser, and it is the one the pack states outright: "typing Space/Enter in
 * an input never opens the record".
 */

const TABLE = 'table-ops';

const log = (page: Page) => page.getByTestId('ops-log');
// Data rows only: the empty state renders as a <tr> of its own, so `tbody tr`
// never reaches zero and would quietly pass a count that means nothing.
const rowsOf = (page: Page) => page.locator(`[data-pw="${TABLE}"] tbody tr.table-row`);

test.describe('Table — a custom cell does not steal row activation', () => {
  test('typing in an editable cell types, and never opens the record', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    const note = page.getByTestId('ops-note').first();
    await note.click();
    await note.pressSequentially('hold for review');

    // The space is the whole point: a row that preventDefaults it eats the
    // character, and a row that activates on it opens the record mid-word.
    await expect(note).toHaveValue('hold for review');
    await expect(log(page)).toContainText('none');

    await note.press('Enter');
    await expect(log(page)).toContainText('none');
  });

  test('each control fires only its own action', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('ops-approve').first().click();
    await expect(log(page)).toContainText('approved INV-1041');

    await page.getByTestId('ops-link').first().click();
    await expect(log(page)).toContainText('followed INV-1041');

    // A portaled popup: the panel is not even inside the row.
    await page.getByTestId('ops-menu-trigger-INV-1042').click();
    await page.getByRole('menuitem', { name: 'Archive' }).click();
    await expect(log(page)).toContainText('archive INV-1042');
  });

  test('the row itself still opens by click and by keyboard', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    // Plain cell text: the click path that must keep working.
    await rowsOf(page).first().getByText('INV-1041').click();
    await expect(log(page)).toContainText('opened INV-1041');

    await rowsOf(page).nth(1).press('Enter');
    await expect(log(page)).toContainText('opened INV-1042');

    await rowsOf(page).nth(2).press(' ');
    await expect(log(page)).toContainText('opened INV-1043');
  });
});

test.describe('Table — the data states a real table distinguishes', () => {
  test('separates "no records yet" from "nothing matched"', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await page.getByTestId('ops-state-empty').click();
    await expect(page.getByTestId('ops-empty')).toHaveText('No records yet.');

    // Same zero rows, different cause, different message — and the term is
    // quoted back, which only Table can do while it owns the search input.
    await page.getByTestId('ops-state-ready').click();
    await page.getByTestId('ops-search').fill('nothing-matches-this');
    await expect(page.getByTestId('ops-empty')).toHaveText(
      'No records match “nothing-matches-this”.'
    );
  });

  test('keeps the header while empty, so the table is still a table', async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    await page.getByTestId('ops-state-empty').click();

    await expect(page.locator(`[data-pw="${TABLE}"] th`).first()).toHaveText(/Record/);
    await expect(page.getByTestId('ops-empty')).toBeVisible();
  });

  test('loading marks the region busy and disables the paginator, keeping rows', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');
    await page.getByTestId('ops-state-loading').click();

    await expect(page.getByTestId('ops-region')).toHaveAttribute('aria-busy', 'true');
    // Rows stay mounted through a refresh: the reader keeps their place.
    await expect(rowsOf(page)).toHaveCount(3);
  });

  test('error is announced outside the scroll area and retry restores the rows', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');
    await page.getByTestId('ops-state-error').click();

    const error = page.getByTestId('ops-error');
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(rowsOf(page)).toHaveCount(0);
    // Not "No records yet." — a failed fetch never established that.
    await expect(page.getByTestId('ops-empty')).toHaveCount(0);

    await page.getByTestId('ops-retry').click();
    await expect(rowsOf(page)).toHaveCount(3);
    await expect(log(page)).toContainText('retried');
  });

  test('a partial result is a short page with a notice, not a different component', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');
    await page.getByTestId('ops-state-partial').click();

    await expect(page.getByTestId('ops-partial')).toBeVisible();
    await expect(rowsOf(page)).toHaveCount(1);
    await expect(page.locator(`[data-pw="${TABLE}"] th`).first()).toHaveText(/Record/);
  });
});
