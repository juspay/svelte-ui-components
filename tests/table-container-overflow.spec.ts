import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * `.table-container` was hard-coded `overflow: hidden`, which exists to clip the
 * table's corners to the container's `border-radius`. The scrollable variant
 * adds `overflow-y: auto` on top, so the vertical axis had a seam and the
 * horizontal one had none -- a consumer wanting a wide table to scroll sideways
 * had to reach into `.table-container` from their own stylesheet, which is what
 * this replaces.
 *
 * The default stays `hidden`, so nothing about an existing table changes.
 */
test.describe('Table container overflow', () => {
  test('defaults to hidden, which is what clips the rounded corners', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    const container = page.getByTestId('table-keyed-basic');
    await expect(container).toHaveCSS('overflow-x', 'hidden');
  });

  test('a consumer can opt the container into horizontal scrolling', async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    await page.addStyleTag({
      content: '[data-pw="table-keyed-basic"] { --table-container-overflow: auto; }'
    });

    const container = page.getByTestId('table-keyed-basic');
    await expect(container).toHaveCSS('overflow-x', 'auto');
  });
});
