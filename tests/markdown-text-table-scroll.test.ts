import { expect, test } from '@playwright/test';

test.describe('MarkdownText — a wide table scrolls, stays a table, and can be reached', () => {
  // The scroll container is a wrapper rather than the table itself. `display: block`
  // on a `<table>` is what would make overflow-x work on the element directly, but it
  // also strips the table's semantics for assistive technology — so the box that
  // scrolls and the box that is a table have to be different elements.
  test('the wrapper overflows horizontally while the table stays a table', async ({ page }) => {
    await page.goto('/components/markdown-text');

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
    await page.goto('/components/markdown-text');

    const wrapper = page.getByTestId('markdown-text-wide-table').locator('.markdown-table-wrapper');
    await expect(wrapper).toHaveAttribute('tabindex', '0');

    await wrapper.focus();
    expect(await wrapper.evaluate((el) => document.activeElement === el)).toBe(true);

    expect(await wrapper.evaluate((el) => el.scrollLeft)).toBe(0);
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(async () => wrapper.evaluate((el) => el.scrollLeft), { timeout: 2000 })
      .toBeGreaterThan(0);
  });

  // A tab stop with no visible focus ring is a keyboard user's dead end: they can
  // reach the box and scroll it with no sign of where they are.
  test('the focused wrapper shows a visible focus ring', async ({ page }) => {
    await page.goto('/components/markdown-text');

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
    await page.goto('/components/markdown-text');

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

  // An unnamed region announces a landmark the user cannot identify, so the role
  // is present only when a name is supplied.
  test('the region is named only when the caller supplies a label', async ({ page }) => {
    await page.goto('/components/markdown-text');

    const labelled = page
      .getByTestId('markdown-text-labelled-table')
      .locator('.markdown-table-wrapper');
    await expect(labelled).toHaveAttribute('role', 'region');
    await expect(labelled).toHaveAttribute('aria-label', 'Recent orders');

    const unlabelled = page
      .getByTestId('markdown-text-wide-table')
      .locator('.markdown-table-wrapper');
    await expect(unlabelled).toHaveAttribute('tabindex', '0');
    expect(await unlabelled.getAttribute('role')).toBeNull();
  });
});
