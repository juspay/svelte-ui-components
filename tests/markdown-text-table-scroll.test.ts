import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.describe('MarkdownText — a wide table scrolls, stays a table, and can be reached', () => {
  // The scroll container is a wrapper rather than the table itself. `display: block`
  // on a `<table>` is what would make overflow-x work on the element directly, but it
  // also strips the table's semantics for assistive technology — so the box that
  // scrolls and the box that is a table have to be different elements.
  test('the wrapper overflows horizontally while the table stays a table', async ({ page }) => {
    await gotoHydrated(page, '/components/markdown-text');

    const scope = page.getByTestId('markdown-text-wide-table');
    const wrapper = scope.locator('.markdown-table-wrapper');
    await expect(wrapper).toBeVisible();

    const box = await wrapper.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      tableDisplay: getComputedStyle(el.querySelector('table') as HTMLElement).display
    }));

    expect(
      box.scrollWidth,
      `the wrapper must be wider than its visible box to scroll (got ${box.scrollWidth} vs ${box.clientWidth})`
    ).toBeGreaterThan(box.clientWidth);

    // Regression guard for the first version of this fix, which scrolled by
    // making the table itself a block box.
    expect(box.tableDisplay, 'the table must keep its table semantics').toBe('table');
  });

  // A box with overflow-x: auto cannot be scrolled with arrow keys unless it can
  // hold focus, so without a tabindex the scrolling above is mouse-only.
  test('the scroll container is keyboard reachable and really scrolls', async ({ page }) => {
    await gotoHydrated(page, '/components/markdown-text');

    const wrapper = page.getByTestId('markdown-text-wide-table').locator('.markdown-table-wrapper');
    await expect(wrapper).toHaveAttribute('tabindex', '0');

    await wrapper.focus();
    expect(await wrapper.evaluate((el) => document.activeElement === el)).toBe(true);

    expect(await wrapper.evaluate((el) => el.scrollLeft)).toBe(0);
    // A native WebKit overflow element also requires a key held through a frame;
    // the paired native-control regression below retains that platform oracle.
    await page.keyboard.press('ArrowRight', { delay: 50 });
    await expect
      .poll(async () => wrapper.evaluate((el) => el.scrollLeft), { timeout: 2000 })
      .toBeGreaterThan(0);
  });

  // A tab stop with no visible focus ring is a keyboard user's dead end: they can
  // reach the box and scroll it with no sign of where they are.
  test('the focused wrapper shows a visible focus ring', async ({ page }) => {
    await gotoHydrated(page, '/components/markdown-text');

    const wrapper = page.getByTestId('markdown-text-wide-table').locator('.markdown-table-wrapper');
    await wrapper.focus();
    // :focus-visible is a heuristic; a key press while focused settles it in every engine.
    await page.keyboard.press('ArrowRight');

    const ring = await wrapper.evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(ring.style, 'outline-style must not be none').not.toBe('none');
    expect(ring.width, 'the outline must have a width').toBeGreaterThan(0);
  });

  // The width that makes it scroll must not buy that at the cost of the column
  // model — and every row has to hold, not just the first one.
  test('header and body columns stay aligned on every row', async ({ page }) => {
    await gotoHydrated(page, '/components/markdown-text');

    const scope = page.getByTestId('markdown-text-wide-table');
    const edges = await scope.evaluate((root) => ({
      head: [...root.querySelectorAll('th')].map((el) =>
        Math.round(el.getBoundingClientRect().left)
      ),
      rows: [...root.querySelectorAll('tbody tr')].map((tr) =>
        [...tr.querySelectorAll('td')].map((el) => Math.round(el.getBoundingClientRect().left))
      )
    }));

    expect(edges.head.length).toBeGreaterThan(1);
    expect(edges.rows.length).toBeGreaterThan(1);
    for (const [index, row] of edges.rows.entries()) {
      expect(row, `row ${index} must share the header's column edges`).toEqual(edges.head);
    }
  });

  // Both demonstration recipes now author a tableLabel. The renderer unit retains
  // the independent default/empty-label contract: no named region is invented.
  test('demonstrated table regions expose the labels their callers supply', async ({ page }) => {
    await gotoHydrated(page, '/components/markdown-text');

    const labelled = page
      .getByTestId('markdown-text-labelled-table')
      .locator('.markdown-table-wrapper');
    await expect(labelled).toHaveAttribute('role', 'region');
    await expect(labelled).toHaveAttribute('aria-label', 'Recent orders');

    const wide = page.getByTestId('markdown-text-wide-table').locator('.markdown-table-wrapper');
    await expect(wide).toHaveAttribute('tabindex', '0');
    await expect(wide).toHaveAttribute('role', 'region');
    await expect(wide).toHaveAccessibleName('Wide recent orders table');
  });
});

// Trusted keyboard input, same browser and native overflow primitive. Separate
// fresh controls preserve the zero-duration observation rather than resetting
// scrollLeft in script and pretending that was a user action.
for (const delay of [0, 50]) {
  test(`native overflow ArrowRight timing oracle (${delay}ms)`, async ({ page }, testInfo) => {
    await page.setContent(
      '<button id="before">Before</button><div id="native" tabindex="0" style="width:300px;overflow:auto"><div style="width:1600px">Native wide content</div></div>'
    );
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    const native = page.locator('#native');
    await expect(native).toBeFocused();
    expect(await native.evaluate((el) => el.scrollLeft)).toBe(0);
    await page.keyboard.press('ArrowRight', { delay });
    if (delay === 50) {
      await expect.poll(() => native.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    }
    await page.waitForTimeout(250);
    await testInfo.attach('native-key-timing.json', {
      body: JSON.stringify({
        engine: testInfo.project.name,
        delay,
        scrollLeft: await native.evaluate((el) => el.scrollLeft)
      }),
      contentType: 'application/json'
    });
  });
}
