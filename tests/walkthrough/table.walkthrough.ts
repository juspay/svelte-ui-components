import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { assertInViewport, beat, caption, highlight, step } from './support/narrate.js';

/**
 * Table's largest gap area, and the one a screenshot proves the least about.
 *
 * Every scenario below is about OWNERSHIP: who is allowed to move the page, who
 * owns a click inside a custom cell, and what the table shows for five distinct
 * data states. Each of those is a multi-step causal sequence — click, observe
 * that nothing moved (or that it moved correctly), then move it for real — and
 * a still frame cannot distinguish "the table refused the request" from "the
 * table is broken and nothing happens". The one animated gap (mobileCardLayout)
 * is even more literally unprovable from a screenshot: it is a continuous CSS
 * reflow with no single frame that means anything on its own.
 *
 * Every test still makes real `expect()` assertions against DOM state — never
 * against caption text, which is `aria-hidden` and `pointer-events: none`
 * specifically so a spec cannot pass on its own narration. The pacing exists
 * only to make the failure (and the pass) watchable.
 */

test.describe('Table walkthrough — controlled sort and search', () => {
  const TABLE = 'table-controlled-sort';
  const bodyColumn = (page: Page, colIndex: number) =>
    page.locator(`[data-pw="${TABLE}"] tbody tr td:nth-child(${colIndex + 1})`);

  test('controlled sort and search restore, clear, and survive column changes', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    await caption(
      page,
      'This table never owns its own sort — a consumer holds { columnId: "score", direction: "desc" } outside it, the way a URL or saved view would.'
    );
    await expect(page.getByTestId('ctrl-score')).toHaveAttribute('aria-sort', 'descending');
    await expect(page.getByTestId('ctrl-name')).toHaveAttribute('aria-sort', 'none');
    await expect(bodyColumn(page, 1)).toHaveText(['30', '20', '10']);

    await step(
      page,
      'Hiding the sorted column while it is active — Score should sort nothing, not silently re-point at Name, which slides into its old slot.',
      async () => {
        await highlight(page.getByTestId('ctrl-hide-score'));
        await page.getByTestId('ctrl-hide-score').click();
      }
    );
    await expect(page.getByTestId('ctrl-score')).toHaveCount(0);
    await expect(page.getByTestId('ctrl-name')).toHaveAttribute('aria-sort', 'none');
    await expect(bodyColumn(page, 0)).toHaveText(['Bob', 'Alice', 'Carol']);

    await step(
      page,
      'Bringing Score back restores the sort it still holds — the id was never lost.',
      async () => {
        await page.getByTestId('ctrl-hide-score').click();
      }
    );
    await expect(page.getByTestId('ctrl-score')).toHaveAttribute('aria-sort', 'descending');
    await expect(bodyColumn(page, 1)).toHaveText(['30', '20', '10']);

    await step(
      page,
      'Clearing the externally held sort reverts to the consumer’s own row order.',
      async () => {
        await page.getByTestId('ctrl-clear-sort').click();
      }
    );
    await expect(page.getByTestId('ctrl-score')).toHaveAttribute('aria-sort', 'none');
    await expect(page.getByTestId('ctrl-name')).toHaveAttribute('aria-sort', 'none');
    await expect(bodyColumn(page, 0)).toHaveText(['Bob', 'Alice', 'Carol']);

    await step(
      page,
      'Restoring a different field from outside moves the indicator and the rows together.',
      async () => {
        await page.getByTestId('ctrl-restore-desc').click();
      }
    );
    await expect(page.getByTestId('ctrl-name')).toHaveAttribute('aria-sort', 'descending');
    await expect(bodyColumn(page, 0)).toHaveText(['Carol', 'Bob', 'Alice']);

    await step(
      page,
      'Reversing the columns: whichever field is sorted keeps its indicator — the state tracks the FIELD, not the screen position.',
      async () => {
        await page.getByTestId('ctrl-reverse-columns').click();
      }
    );
    await expect(page.getByTestId('ctrl-name')).toHaveAttribute('aria-sort', 'descending');
    await expect(page.getByTestId('ctrl-score')).toHaveAttribute('aria-sort', 'none');
    // Score is now column 0, Name is column 1 — the sort followed Name across the swap.
    await expect(bodyColumn(page, 0)).toHaveText(['10', '20', '30']);
    await expect(bodyColumn(page, 1)).toHaveText(['Carol', 'Bob', 'Alice']);

    await step(
      page,
      'Filling the search box programmatically, not by typing — it still filters, because the box renders FROM the controlled term.',
      async () => {
        await page.getByTestId('ctrl-set-search').click();
      }
    );
    await expect(page.getByTestId('ctrl-search')).toHaveValue('Alice');
    await expect(page.locator(`[data-pw="${TABLE}"] tbody tr`)).toHaveCount(1);
    await expect(bodyColumn(page, 1)).toHaveText(['Alice']);
  });
});

test.describe('Table walkthrough — page ownership', () => {
  test('client pagination clamps to the last page that still has rows', async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    const TABLE = 'table-page-shrink';
    const rows = page.locator(`[data-pw="${TABLE}"] tbody tr`);
    const range = page.getByTestId('table-page-shrink-paginator-range');

    await step(
      page,
      'Twenty-three rows, jumping to page 5 — the last page, rows 21 to 23.',
      async () => {
        await page
          .getByTestId('shrink-paged-pages')
          .getByRole('button', { name: 'Page 5' })
          .click();
      }
    );
    await expect(range).toContainText('21-23 of 23');
    await expect(rows.first()).toContainText('Row 21');

    await step(
      page,
      'Shrinking to 12 rows while sitting on page 5 must land on the new LAST page, not a page that no longer exists.',
      async () => {
        await page.getByTestId('shrink-to-twelve').click();
      }
    );
    await expect(range).toContainText('11-12 of 12');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText('Row 11');

    await step(
      page,
      'Shrinking further to 5 rows clamps to page 1 — a blank page 5 would read "21-5 of 5".',
      async () => {
        await page.getByTestId('shrink-to-five').click();
      }
    );
    await expect(range).toContainText('1-5 of 5');
    await expect(rows).toHaveCount(5);
    await expect(rows.first()).toContainText('Row 01');

    await step(
      page,
      'Deleting every row shows the empty message, not a page past the end.',
      async () => {
        await page.getByTestId('shrink-to-none').click();
      }
    );
    await expect(page.getByTestId('shrink-empty')).toBeVisible();
    await expect(range).toHaveText('');

    await step(
      page,
      'Restoring all 23 rows returns to page 5 — the page the reader had chosen, never reset to page 1.',
      async () => {
        await page.getByTestId('shrink-restore').click();
      }
    );
    await expect(range).toContainText('21-23 of 23');
    await expect(rows.first()).toContainText('Row 21');
  });

  test('server pagination is a request the consumer may refuse', async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    const TABLE = 'table-server-refusal';
    const rows = page.locator(`[data-pw="${TABLE}"] tbody tr`);
    const range = page.getByTestId('table-server-refusal-paginator-range');
    const log = page.getByTestId('refusal-log');

    await caption(page, 'Serving page 2 of 40 — records 06 through 10.');
    await expect(rows.first()).toContainText('Record 06');
    await expect(range).toContainText('6-10 of 40');

    await step(
      page,
      'Clicking Page 3 does not move the table at all — it only reports a request the consumer may ignore.',
      async () => {
        await page
          .getByTestId('refusal-paged-pages')
          .getByRole('button', { name: 'Page 3' })
          .click();
      }
    );
    await expect(log).toContainText('Requested: 3');
    await expect(log).toContainText('Serving page 2');
    await expect(rows.first()).toContainText('Record 06');
    await expect(range).toContainText('6-10 of 40');

    await step(
      page,
      'Only Apply moves the table — to the page it actually requested.',
      async () => {
        await page.getByTestId('refusal-apply').click();
      }
    );
    await expect(rows.first()).toContainText('Record 11');
    await expect(range).toContainText('11-15 of 40');

    await step(
      page,
      'The page-size selector behaves identically: picking 10 is a request, not an instant change.',
      async () => {
        await page.getByTestId('refusal-paged-page-size').getByRole('combobox').click();
        await page.getByRole('listbox').getByText('10', { exact: true }).click();
      }
    );
    await expect(log).toContainText('/ 10');
    // Still describing the page and size actually served.
    await expect(range).toContainText('11-15 of 40');

    await step(page, 'Applying again is what actually changes what the table serves.', async () => {
      await page.getByTestId('refusal-apply').click();
    });
    await expect(rows.first()).toContainText('Record 21');
    await expect(range).toContainText('21-30 of 40');
  });
});

test.describe('Table walkthrough — custom cells and operational data states', () => {
  const TABLE = 'table-ops';
  const rowsOf = (page: Page) => page.locator(`[data-pw="${TABLE}"] tbody tr.table-row`);

  test("a custom cell's controls never steal row activation", async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    const log = page.getByTestId('ops-log');

    await step(
      page,
      'Typing "hold for review" into the Note field, spaces included — a row that stole the keystroke would eat the space or open the record mid-word.',
      async () => {
        const note = page.getByTestId('ops-note').first();
        await note.click();
        await note.pressSequentially('hold for review');
      }
    );
    await expect(page.getByTestId('ops-note').first()).toHaveValue('hold for review');
    await expect(log).toContainText('none');

    await step(
      page,
      'Approve is its own control — the row underneath does not also open.',
      async () => {
        await page.getByTestId('ops-approve').first().click();
      }
    );
    await expect(log).toContainText('approved INV-1041');

    await step(
      page,
      'Detail is a plain link inside the row, and it only follows itself.',
      async () => {
        await page.getByTestId('ops-link').first().click();
      }
    );
    await expect(log).toContainText('followed INV-1041');

    await step(
      page,
      'The ⋯ menu is portaled outside the row entirely, so its panel can never reach the row’s own click handler.',
      async () => {
        await page.getByTestId('ops-menu-trigger-INV-1041').click();
        await page.getByRole('menuitem', { name: 'Archive' }).click();
      }
    );
    await expect(log).toContainText('archive INV-1041');

    await step(
      page,
      'Outside those four controls, the row is still fully clickable — the plain record id opens it.',
      async () => {
        const firstRow = rowsOf(page).first();
        await highlight(firstRow);
        await firstRow.getByText('INV-1041').click();
      }
    );
    await expect(log).toContainText('opened INV-1041');

    await step(
      page,
      'And keyboard activation still works — Enter opens the record only when the ROW ITSELF, not a child, holds focus.',
      async () => {
        await rowsOf(page).nth(1).press('Enter');
      }
    );
    await expect(log).toContainText('opened INV-1042');
  });

  test('five data states read differently, not just as fewer rows', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    await step(
      page,
      'Loading keeps the rows mounted and marks the region busy — the paginator disables rather than the rows disappearing.',
      async () => {
        await page.getByTestId('ops-state-loading').click();
      }
    );
    await expect(page.getByTestId('ops-region')).toHaveAttribute('aria-busy', 'true');
    await expect(rowsOf(page)).toHaveCount(3);

    await step(
      page,
      'No records at all reads "No records yet." — and the header row stays put.',
      async () => {
        await page.getByTestId('ops-state-empty').click();
      }
    );
    await expect(page.getByTestId('ops-empty')).toHaveText('No records yet.');
    await expect(page.locator(`[data-pw="${TABLE}"] th`).first()).toHaveText(/Record/);

    await step(
      page,
      'Back to ready, then a search matching nothing quotes the exact term back — a different message for a different cause.',
      async () => {
        await page.getByTestId('ops-state-ready').click();
        await page.getByTestId('ops-search').fill('nothing-matches-this');
      }
    );
    await expect(page.getByTestId('ops-empty')).toHaveText(
      'No records match “nothing-matches-this”.'
    );

    await step(
      page,
      'Error is not "empty" — an alert banner sits outside the scroll area, with its own Retry.',
      async () => {
        await page.getByTestId('ops-state-error').click();
      }
    );
    const error = page.getByTestId('ops-error');
    await highlight(error);
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(rowsOf(page)).toHaveCount(0);
    await expect(page.getByTestId('ops-empty')).toHaveCount(0);

    await step(
      page,
      'Retry restores the rows and reports back through the same action log the row controls use.',
      async () => {
        await page.getByTestId('ops-retry').click();
      }
    );
    await expect(rowsOf(page)).toHaveCount(3);
    await expect(page.getByTestId('ops-log')).toContainText('retried');

    await step(
      page,
      'Partial is a real, shorter page plus a notice — not a different component.',
      async () => {
        await page.getByTestId('ops-state-partial').click();
      }
    );
    await expect(page.getByTestId('ops-partial')).toBeVisible();
    await expect(rowsOf(page)).toHaveCount(1);
  });
});

/**
 * The demo shell's own sidebar nav (src/routes/+layout.svelte) is a fixed
 * 260px CSS Grid column -- `grid-template-columns: 260px minmax(0, 1fr)` --
 * with no narrow-viewport collapse of its own. At a 375px viewport that
 * leaves only ~115px (minus the content area's own 40px side padding) for
 * everything else, nowhere near enough to read a label/value card legibly.
 * That crowding is the docs shell's gap, not the table's, and this
 * walkthrough is about `mobileCardLayout` -- so it hides the shell chrome
 * that would otherwise crowd the frame rather than film illegible cards.
 * `!important` on both declarations because the injected tag lands after
 * Svelte's own scoped stylesheet, whose selectors carry an extra scoping
 * class and would otherwise still win on specificity.
 *
 * The replacement column keeps `minmax(0, ...)`, not bare `1fr`: an `fr`
 * track's default minimum is `auto` (its content's min-content size), not
 * zero, so a bare `1fr` lets the grid stretch to fit whatever unbreakable
 * content lives elsewhere on the page -- on this route, a code sample in the
 * "Usage" docs section rendered below the demo. That measured 900px wide
 * against a 375px viewport and dragged the row along with it. `minmax(0, ...)`
 * is what the original rule relied on to keep overflowing content scrolling
 * instead of stretching the layout, and dropping it while "fixing" the
 * sidebar reintroduced the same class of bug one line over.
 */
const collapseDemoSidebar = (page: Page) =>
  page.addStyleTag({
    content:
      '.sidebar { display: none !important; } ' +
      '.app-layout { grid-template-columns: minmax(0, 1fr) !important; }'
  });

test('mobileCardLayout reflows rows into label/value cards below 640px, and back', async ({
  page
}) => {
  await gotoHydrated(page, '/components/table');
  const table = page.getByTestId('table-mobile-cards');
  await table.scrollIntoViewIfNeeded();
  const tableElement = table.locator('table');
  const firstRow = table.locator('tbody tr.table-row').first();
  const firstCell = firstRow.locator('td.table-content').first();
  const firstLabel = firstCell.locator('.table-mobile-label');

  await caption(
    page,
    'At desktop width this renders as an ordinary table. The per-row labels already exist in the DOM, just hidden.'
  );
  await expect(tableElement).toHaveAttribute('role', 'table');
  await expect(firstCell).toHaveAttribute('role', 'cell');
  await expect(firstLabel).toBeHidden();
  await expect(firstCell).toHaveCSS('display', 'table-cell');
  await expect(firstRow).toHaveCSS('display', 'table-row');

  await step(page, 'Shrinking the viewport below 640px, live —', async () => {
    await page.setViewportSize({ width: 375, height: 720 });
  });
  await beat(page, 800);

  // See collapseDemoSidebar's own doc comment: without this, the sidebar's
  // fixed 260px column leaves the card too narrow to read at 375px. Restored
  // once back at desktop width below.
  const sidebarOverride = await collapseDemoSidebar(page);

  await caption(
    page,
    'Every row is now a bordered card: the column header text reappears as a label directly beside its value.'
  );
  await expect(firstRow).toHaveCSS('display', 'block');
  await expect(firstCell).toHaveCSS('display', 'flex');
  await expect(firstLabel).toBeVisible();
  await expect(firstLabel).toHaveText('Name');
  await expect(firstRow).toContainText('Alice Johnson');

  // Narrowing the viewport can reflow everything above the table (nav, page
  // header, the preceding demo sections) and leave it scrolled out of view
  // even though scrollIntoViewIfNeeded already ran once at desktop width --
  // that scroll position does not survive the resize. Scroll to the actual
  // mobile card again now that the narrow layout has settled, and prove it
  // landed on screen: an evidence video of an empty gutter must fail the
  // spec, not just look wrong on review.
  await firstRow.scrollIntoViewIfNeeded();
  await assertInViewport(page, firstRow);
  await highlight(firstRow, 1_600);
  // The layout changed; the accessible structure did not.
  await expect(tableElement).toHaveAttribute('role', 'table');
  await expect(firstCell).toHaveAttribute('role', 'cell');

  // Restore the real shell before widening back, so the desktop half below
  // shows the genuine page rather than a still-modified one.
  await sidebarOverride.evaluate((node) => node.remove());

  await step(
    page,
    'Widening back past 640px reflows to the ordinary table again — both directions work.',
    async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  );

  // Reflowing tall narrow cards back into compact desktop rows shrinks
  // everything above the table, so the browser's own preserved scroll
  // position -- a pixel offset, not an anchor to any element -- now shows
  // whatever else happens to sit at that offset once the page is shorter.
  // On this route that lands on the "Usage" code block from docs/Table.md,
  // rendered below the demo by src/routes/components/+layout.svelte: the
  // exact gap the review caught, an "and back" that never actually appeared
  // on screen. Scroll back to the table explicitly and prove it landed on
  // screen before holding it, the same discipline the narrow-viewport pass
  // above already follows.
  await firstRow.scrollIntoViewIfNeeded();
  await assertInViewport(page, firstRow);
  await highlight(firstRow, 1_600);

  await expect(firstLabel).toBeHidden();
  await expect(firstCell).toHaveCSS('display', 'table-cell');
  await expect(firstRow).toHaveCSS('display', 'table-row');
});

test('aria-sort tracks exactly one column at a time', async ({ page }) => {
  await gotoHydrated(page, '/components/table');
  const TABLE = 'table-keyed-features';
  const nameHeader = page.getByTestId(TABLE).getByTestId('keyed-header-name');
  const statusHeader = page.locator(`[data-pw="${TABLE}"] th`).nth(2);
  const nameColumn = page.locator(`[data-pw="${TABLE}"] tbody tr td:nth-child(1)`);

  await caption(
    page,
    'Sortable but currently unsorted: aria-sort reads "none" — the control exists and is unused.'
  );
  await expect(nameHeader).toHaveAttribute('aria-sort', 'none');

  await step(
    page,
    'One click sorts ascending. The names are already alphabetical, so watch the header attribute, not the rows.',
    async () => {
      await highlight(nameHeader);
      await nameHeader.getByRole('button', { name: /sort by name/i }).click();
    }
  );
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

  await step(
    page,
    'A second click sorts descending — now the row order visibly reverses too.',
    async () => {
      await nameHeader.getByRole('button', { name: /sort by name/i }).click();
    }
  );
  await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(nameColumn).toHaveText(['Carol White', 'Bob Smith', 'Alice Johnson']);

  await step(
    page,
    'Sorting a different column returns Name to "none" — only one column may claim the attribute at a time.',
    async () => {
      await statusHeader.getByRole('button', { name: /sort by status/i }).click();
    }
  );
  await expect(statusHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
});

test.describe('Table walkthrough — <sui-table> toolbarSlot', () => {
  /**
   * No docs-site route renders `<sui-table>` directly (it is a Web Component
   * bundle, not a SvelteKit route), so this builds it live on a blank page —
   * the same way tests/table-wc-toolbar-slot.spec.ts, the assertion spec for
   * this exact fix, already does.
   */
  const loadBundle = async (page: Page): Promise<void> => {
    await page.goto('/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-table') !== 'undefined', null, {
      timeout: 15_000
    });
  };

  test('sui-table toolbarSlot reaches a light-DOM slot and a JS-assigned callback', async ({
    page
  }) => {
    await loadBundle(page);

    await caption(
      page,
      'No docs route renders <sui-table> directly — this blank page builds one live, the same way the assertion spec does.'
    );

    await step(
      page,
      'A light-DOM toolbar, slotted the ordinary way, stays hidden until a row is selected.',
      async () => {
        await page.evaluate(() => {
          type SelectableSuiTable = HTMLElement & {
            tableHeaders: string[];
            tableData: string[][];
            checkboxSelection: { enabled: boolean };
          };
          const element = document.createElement('sui-table');
          element.setAttribute('data-pw', 'wc-table-slot');
          const table: SelectableSuiTable = Object.assign(element, {
            tableHeaders: ['Name'],
            tableData: [['Alice'], ['Bob']],
            checkboxSelection: { enabled: true }
          });
          const toolbar = document.createElement('div');
          toolbar.setAttribute('slot', 'toolbar-slot');
          toolbar.setAttribute('data-pw', 'wc-toolbar-slotted');
          toolbar.textContent = 'Bulk actions';
          table.append(toolbar);
          document.body.append(table);
        });
      }
    );

    const slottedToolbar = page.getByTestId('wc-toolbar-slotted');
    await expect(slottedToolbar).toBeHidden();

    await step(
      page,
      'Checking a row reveals it — Table only renders the toolbar region while something is selected.',
      async () => {
        await page
          .getByTestId('wc-table-slot')
          .getByRole('checkbox', { name: 'Select row 0' })
          .click();
      }
    );
    await expect(slottedToolbar).toBeVisible();
    await expect(slottedToolbar).toHaveText('Bulk actions');

    await step(
      page,
      'A JS-assigned toolbarSlot used to be silently dropped. Rendering its output live, into a second panel below.',
      async () => {
        await page.evaluate(() => {
          type PropertyToolbarSuiTable = HTMLElement & {
            tableHeaders: string[];
            tableData: string[][];
            checkboxSelection: { enabled: boolean; getRowId: (row: string[]) => string };
            toolbarSlot: (anchor: unknown, args: unknown) => void;
          };
          const panel = document.createElement('div');
          panel.setAttribute('data-pw', 'wc-toolbar-live');
          panel.style.cssText =
            'margin-top:16px;padding:12px;border:2px solid #2563eb;font:600 16px system-ui;';
          panel.textContent = 'Selected: (none)';
          document.body.append(panel);

          const element = document.createElement('sui-table');
          element.setAttribute('data-pw', 'wc-table-property');
          Object.assign(element, {
            tableHeaders: ['Name'],
            tableData: [['Carol'], ['Dan']],
            checkboxSelection: { enabled: true, getRowId: (row: string[]) => row[0] },
            // Stands in for a compiled snippet: Svelte hands a snippet its anchor
            // node first, then its arguments — reactive ones wrapped in a thunk.
            toolbarSlot: (_anchor: unknown, args: unknown) => {
              const resolved = typeof args === 'function' ? args() : args;
              const ids =
                resolved === null || typeof resolved !== 'object' ? null : resolved.selectedIds;
              panel.textContent = `Selected: ${ids instanceof Set ? [...ids].join(', ') : '(none)'}`;
            }
          } satisfies Partial<PropertyToolbarSuiTable>);
          document.body.append(element);
        });
      }
    );

    await step(
      page,
      'Selecting Dan updates the panel with the real selection — the argument that used to be dropped entirely.',
      async () => {
        await page
          .getByTestId('wc-table-property')
          .getByRole('checkbox', { name: 'Select row Dan' })
          .click();
      }
    );
    await expect(page.getByTestId('wc-toolbar-live')).toHaveText('Selected: Dan');
  });
});
