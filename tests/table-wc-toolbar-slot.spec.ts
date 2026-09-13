import { expect, test, type Page } from '@playwright/test';

/**
 * Bridging `sui-table`'s `toolbarSlot`.
 *
 * Table calls that snippet WITH `{ selectedIds }`, and the wrapper used to
 * bridge it to a bare `<slot>` declared with an empty parameter list — markup
 * projection cannot carry arguments, so the selection was dropped, and because
 * a body snippet shadows the spread, a JavaScript-assigned `toolbarSlot` was
 * swallowed with it. The wrapper now renders a property-assigned snippet with
 * the real arguments and keeps the slot as the fallback.
 *
 * Both directions are measured. The slot direction is the capability that
 * already existed and must survive the fix: a light-DOM toolbar has to be
 * REACHED (Svelte captures `$slots` at connection time, so it is assigned
 * before connecting) and rendered only while the selection is non-empty, which
 * is the condition Table puts on that region.
 *
 * The property direction is what the fix adds, and it is asserted against the
 * snippet calling convention rather than a compiled snippet, because a page
 * script has no Svelte compiler: a snippet is invoked as `(anchor, ...args)`
 * with reactive arguments passed as thunks. Depending on that ABI is a real
 * coupling, and the reason it is acceptable here is that the ABI IS the
 * contract a `<sui-table>` consumer receives — if it changes, what this test
 * proves has changed too, and failing loudly is the correct outcome.
 */

const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-table') !== 'undefined', null, {
    timeout: 15_000
  });
};

test.describe('sui-table — a slotted toolbar still reaches the shadow tree', () => {
  test('renders host toolbar content once a row is selected, and not before', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      type SuiTableElement = HTMLElement & {
        tableHeaders: string[];
        tableData: string[][];
        checkboxSelection: { enabled: boolean };
      };
      const element = document.createElement('sui-table');
      const table: SuiTableElement = Object.assign(element, {
        tableHeaders: ['Name'],
        tableData: [['Alice'], ['Bob']],
        checkboxSelection: { enabled: true }
      });
      const toolbar = document.createElement('div');
      toolbar.setAttribute('slot', 'toolbar-slot');
      toolbar.setAttribute('data-pw', 'wc-toolbar');
      toolbar.textContent = 'Bulk actions';
      // Assigned BEFORE connection: Svelte captures $slots at connect time.
      table.append(toolbar);
      document.body.append(table);
    });

    const toolbar = page.getByTestId('wc-toolbar');
    // Table only renders the toolbar region while something is selected, so an
    // unslotted-and-therefore-invisible toolbar and a correctly slotted one
    // look identical here — the selection below is what separates them.
    await expect(toolbar).toBeHidden();

    await page.locator('sui-table').getByRole('checkbox', { name: 'Select row 0' }).click();

    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveText('Bulk actions');
  });

  test('a property-assigned toolbarSlot receives the selected ids', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      type SuiTableElement = HTMLElement & {
        tableHeaders: string[];
        tableData: string[][];
        checkboxSelection: { enabled: boolean; getRowId: (row: string[]) => string };
        toolbarSlot: (anchor: unknown, args: unknown) => void;
      };
      const element = document.createElement('sui-table');
      const table: SuiTableElement = Object.assign(element, {
        tableHeaders: ['Name'],
        tableData: [['Alice'], ['Bob']],
        checkboxSelection: { enabled: true, getRowId: (row: string[]) => row[0] },
        // Stands in for a compiled snippet: Svelte hands a snippet its anchor
        // node first and its arguments after, reactive ones wrapped in a thunk.
        toolbarSlot: (_anchor: unknown, args: unknown) => {
          const resolved = typeof args === 'function' ? args() : args;
          const ids =
            resolved === null || typeof resolved !== 'object' ? null : resolved.selectedIds;
          document.body.dataset.wcToolbarSaw =
            ids instanceof Set ? [...ids].join(',') : `no-set:${String(ids)}`;
        }
      });
      document.body.append(table);
    });

    await page.locator('sui-table').getByRole('checkbox', { name: 'Select row Bob' }).click();

    // The selection is the only thing a bulk-action toolbar exists to act on;
    // before the fix this callback was never invoked at all.
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.wcToolbarSaw ?? null))
      .toBe('Bob');
  });
});
