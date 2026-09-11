import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * A legend toggle is an interactive control, and every bit of text inside a
 * button becomes part of its accessible name. An aggregate rendered inside the
 * button therefore makes the control's name change whenever the underlying data
 * changes -- "Revenue $6,500" today, something else after the next fetch.
 *
 * That breaks voice-control targeting ("click Revenue" stops matching) and any
 * consumer test matching the name exactly. The asymmetry is what let it survive
 * review: Testing Library's getByRole matches the whole string by default while
 * Playwright's matches a substring, so identical markup breaks one consumer's
 * suite and sails through another's.
 *
 * The bar-chart demo deliberately enables `interactiveLegend` AND `aggregate`
 * together. Nothing combined them before, which is exactly why this went
 * unnoticed until it was looked for.
 */
test.describe('legend aggregates and interactive legends together', () => {
  test('a toggle keeps the series name as its accessible name, not the figure', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/bar-chart');

    // Asserting the accessible name (not raw textContent) so an aria-label or
    // aria-labelledby regression -- which can rename a control without
    // touching its visible text -- still fails this test. Scoped to the
    // aggregate chart: other charts on this page also have interactive
    // legends, and an unscoped locator would dilute which toggles this
    // covers.
    const chart = page.getByTestId('bar-legend-aggregate-chart');
    const toggles = chart.locator('button.legend-toggle');

    await expect(toggles.nth(0)).toHaveAccessibleName('Revenue');
    await expect(toggles.nth(1)).toHaveAccessibleName('Conversion Rate');
  });

  test('the aggregate is still rendered, just beside the control', async ({ page }) => {
    await gotoHydrated(page, '/components/bar-chart');

    // Stable name AND visible figure -- the fix must not have removed it.
    // Scoped to the aggregate chart: other charts on this page also have a
    // series called Revenue, and an unscoped locator silently picks one of them.
    const chart = page.getByTestId('bar-legend-aggregate-chart');
    const item = chart.locator('.legend-item', { hasText: 'Revenue' }).first();
    await expect(item.locator('.legend-aggregate')).toHaveText('$6,500');
    await expect(item.locator('button.legend-toggle')).toHaveText('Revenue');
  });

  test('clicking the figure does not toggle the series', async ({ page }) => {
    await gotoHydrated(page, '/components/bar-chart');

    const chart = page.getByTestId('bar-legend-aggregate-chart');
    const item = chart.locator('.legend-item', { hasText: 'Revenue' }).first();
    const toggle = item.locator('button.legend-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await item.locator('.legend-aggregate').click();
    // A number is not a control. Only the button toggles the series.
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});
