import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

async function tabTo(
  page: Page,
  target: Locator,
  backward: boolean,
  browserName: string
): Promise<void> {
  const key =
    browserName === 'webkit'
      ? backward
        ? 'Alt+Shift+Tab'
        : 'Alt+Tab'
      : backward
        ? 'Shift+Tab'
        : 'Tab';
  for (let step = 0; step < 14; step += 1) {
    if (
      await target.evaluate(
        (element) => (element.getRootNode() as Document | ShadowRoot).activeElement === element
      )
    ) {
      return;
    }
    await page.keyboard.press(key);
  }
  await expect(target).toBeFocused();
}

test('Svelte clickable Table row is named on keyboard arrival while its child action stays independent', async ({
  page,
  browserName
}) => {
  await gotoHydrated(page, '/components/table');
  const table = page.getByTestId('table-interactive-cells');
  const row = table.locator('tbody tr').filter({ hasText: 'Growth Monthly' });
  await expect(row).toHaveAccessibleName('Growth Monthly');
  await expect(table.getByRole('row', { name: 'Growth Monthly', exact: true })).toHaveCount(1);
  expect(await row.evaluate((element) => element.tagName)).toBe('TR');
  await expect(row.getByRole('cell').first()).toHaveText('Growth Monthly');
  await table.evaluate((element) => {
    const before = document.createElement('input');
    before.id = 'row-context-before';
    element.before(before);
  });
  await page.locator('#row-context-before').click();
  await tabTo(page, row, false, browserName);
  await expect(row).toBeFocused();
  const child = row.getByRole('button', { name: 'Edit Growth Monthly', exact: true });
  await tabTo(page, child, false, browserName);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('interactive-log')).toContainText('button r0');
  await expect(page.getByTestId('row-click-log')).toContainText('none');
  await tabTo(page, row, true, browserName);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('row-click-log')).toContainText('row 0');
  const staticRows = page.getByTestId('table-builtin-cells').locator('tbody tr');
  for (const staticRow of await staticRows.all()) {
    await expect(staticRow).not.toHaveAttribute('aria-label');
  }
});

test('WC localized row identity and original record survive sorting, with independent trusted row and child actions', async ({
  page,
  browserName
}) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({
    path: process.env.TABLE_ROW_WC_BUNDLE ?? 'dist-wc/index.js',
    type: 'module'
  });
  await page.waitForFunction(() => Boolean(customElements.get('sui-table')));
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main === null) {
      throw new Error('Main unavailable');
    }
    main.replaceChildren();
    const before = document.createElement('input');
    before.id = 'wc-row-before';
    const host = document.createElement('sui-table');
    host.id = 'wc-row-table';
    Object.assign(host, {
      columns: [
        { id: 'name', label: 'Name' },
        { id: 'rank', label: 'Rank' },
        {
          id: 'action',
          label: 'Action',
          type: 'button',
          sortable: false,
          onButtonClick: (rowIndex: number, originalIndex: number) => {
            host.dataset.child = JSON.stringify({ rowIndex, originalIndex });
          }
        }
      ],
      rows: [
        { name: 'Same', rank: 3, action: { text: 'Edit first' } },
        { name: 'Same', rank: 1, action: { text: 'Edit second' } },
        { name: 'Different', rank: 2, action: { text: 'Edit third' } }
      ],
      labels: { rowAction: (rowLabel: string) => `Ouvrir ${rowLabel}` },
      onrowclick: (rowIndex: number, _row: unknown[], originalIndex: number) => {
        host.dataset.row = JSON.stringify({ rowIndex, originalIndex });
      }
    });
    main.append(before, host);
  });
  const table = page.locator('#wc-row-table');
  const row = table.getByRole('row', { name: 'Ouvrir Same, record 2', exact: true });
  await expect(row).toBeVisible();
  await table.getByRole('button', { name: 'Sort by Rank', exact: true }).click();
  await expect(table.locator('tbody tr').first()).toHaveAccessibleName('Ouvrir Same, record 2');
  await table.getByRole('button', { name: 'Sort by Rank', exact: true }).click();
  await expect(table.locator('tbody tr').last()).toHaveAccessibleName('Ouvrir Same, record 2');
  await page.locator('#wc-row-before').click();
  await tabTo(page, row, false, browserName);
  await expect(row).toBeFocused();
  expect(await row.evaluate((element) => element.tagName)).toBe('TR');
  const child = row.getByRole('button', { name: 'Edit second', exact: true });
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(child).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(table).toHaveAttribute('data-child', '{"rowIndex":2,"originalIndex":1}');
  await expect(table).not.toHaveAttribute('data-row');
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab');
  await expect(row).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(table).toHaveAttribute('data-row', '{"rowIndex":2,"originalIndex":1}');
});
