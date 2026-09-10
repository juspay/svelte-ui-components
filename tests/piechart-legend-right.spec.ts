import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Closes #417: PieChart had `legendShowValues` (a below-chart list) but no
// right-position layout, no item cap and no expander, so Lighthouse's
// analytics page hand-rolls a bespoke legend <ul> plus a view-more modal --
// the third parallel legend implementation in that codebase.
//
// All three additions are opt-in: without legendPosition/legendMaxItems the
// legend renders exactly where and how it did.
test.describe('PieChart — right-side value legend (#417)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/pie-chart');
  });

  test('the default value legend is still below the chart', async ({ page }) => {
    // Back-compat: passes before the change and must keep passing.
    const chart = page.getByTestId('pie-legend-default');
    const legend = chart.locator('.pie-legend-values');
    await expect(legend).toBeVisible();

    const legendBox = await legend.boundingBox();
    const svg = await chart.locator('svg').first().boundingBox();
    if (legendBox === null || svg === null) {
      throw new Error('missing box');
    }

    // Below means: starts under the chart's bottom edge, not beside it.
    expect(legendBox.y).toBeGreaterThanOrEqual(svg.y + svg.height - 2);
  });

  test('the default legend shows every item, uncapped', async ({ page }) => {
    const rows = page.getByTestId('pie-legend-default').locator('.pie-legend-row');
    await expect(rows).toHaveCount(7);
  });

  test('legendPosition="right" places the legend beside the chart', async ({ page }) => {
    const chart = page.getByTestId('pie-legend-right');
    const legend = chart.locator('.pie-legend-values');
    await expect(legend).toBeVisible();

    const legendBox = await legend.boundingBox();
    const svg = await chart.locator('svg').first().boundingBox();
    if (legendBox === null || svg === null) {
      throw new Error('missing box');
    }

    // Beside means: starts to the right of the chart, and vertically overlaps
    // it rather than sitting below. Checking only the x would also be
    // satisfied by a legend pushed off below and to the right.
    expect(legendBox.x).toBeGreaterThan(svg.x + svg.width - 2);
    expect(legendBox.y).toBeLessThan(svg.y + svg.height);
  });

  test('legendMaxItems caps the visible rows', async ({ page }) => {
    const rows = page.getByTestId('pie-legend-right').locator('.pie-legend-row');
    await expect(rows).toHaveCount(5);
  });

  test('the expander names how many items are hidden', async ({ page }) => {
    // 7 items capped at 5 leaves 2 -- the count has to be computed, not a
    // generic "show more".
    const more = page.getByTestId('pie-legend-right').locator('.pie-legend-more');
    await expect(more).toHaveText(/\+2 more/);
  });

  test('clicking the expander reveals the rest in place', async ({ page }) => {
    const chart = page.getByTestId('pie-legend-right');
    const rows = chart.locator('.pie-legend-row');

    await chart.locator('.pie-legend-more').click();

    await expect(rows).toHaveCount(7);
  });

  test('the expander collapses again once expanded', async ({ page }) => {
    const chart = page.getByTestId('pie-legend-right');
    const more = chart.locator('.pie-legend-more');

    await more.click();
    await expect(chart.locator('.pie-legend-row')).toHaveCount(7);

    await more.click();
    await expect(chart.locator('.pie-legend-row')).toHaveCount(5);
  });

  test('onlegendmore takes over the expander instead of expanding in place', async ({ page }) => {
    // Lighthouse opens a modal here. If the component also expanded in place
    // it would fight the consumer's own UI, so providing the callback must
    // suppress the built-in expansion.
    const chart = page.getByTestId('pie-legend-more-callback');

    await chart.locator('.pie-legend-more').click();

    await expect(page.getByTestId('pie-legend-more-count')).toHaveText('more clicks: 1');
    await expect(chart.locator('.pie-legend-row')).toHaveCount(5);
  });

  test('the expander is a real button, reachable by keyboard', async ({ page }) => {
    const more = page.getByTestId('pie-legend-right').locator('.pie-legend-more');
    await expect(more).toHaveRole('button');

    await more.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('pie-legend-right').locator('.pie-legend-row')).toHaveCount(7);
  });

  test('keyboard focus has a themeable visible outline', async ({ page }) => {
    const more = page.getByTestId('pie-legend-right').locator('.pie-legend-more');
    await more.evaluate((element) => {
      element.style.setProperty(
        '--piechart-legend-more-focus-outline',
        '3px solid rgb(17, 34, 51)'
      );
    });
    await more.focus();
    await expect(more).toHaveCSS('outline-width', '3px');
    await expect(more).toHaveCSS('outline-style', 'solid');
  });

  test('right legend stays inside a narrow card with long labels', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const chart = page.getByTestId('pie-legend-right');
    await chart.evaluate((el) => {
      el.style.width = '280px';
      el.querySelectorAll('.pie-legend-label').forEach((label) => {
        label.textContent = 'A very long category label without a convenient short name';
      });
    });
    await chart.scrollIntoViewIfNeeded();
    const box = await chart.boundingBox();
    const rows = await chart.locator('.pie-legend-row').evaluateAll((elements) =>
      elements.map((el) => ({
        left: el.getBoundingClientRect().left,
        right: el.getBoundingClientRect().right
      }))
    );
    expect(box).not.toBeNull();
    for (const row of rows) {
      expect(row.right).toBeLessThanOrEqual((box?.x ?? 0) + (box?.width ?? 0) + 1);
    }
  });

  test('no expander appears when the cap is not exceeded', async ({ page }) => {
    // 7 items with no cap: nothing is hidden, so an expander would be a
    // control that does nothing.
    const more = page.getByTestId('pie-legend-default').locator('.pie-legend-more');
    await expect(more).toHaveCount(0);
  });
});
