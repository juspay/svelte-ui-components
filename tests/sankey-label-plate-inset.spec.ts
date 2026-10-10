import { expect, test, type Locator } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { CHART_LABEL_PLATE_PADDING } from '../src/lib/_chart/types';

// A header label plate is painted CHART_LABEL_PLATE_PADDING beyond its text. A
// header clamped to a canvas edge used to sit closer to it than that, so its plate
// hung outside the SVG and was clipped there. The fixture makes each clamp bind:
// the left one with no first-column gutter and no margin, the right one with no
// last-column gutter and a long last header. A bound clamp leaves the plate within
// one padding of the edge, which is how the tests know the clamp is what they test.
const PLATE_SLACK = 0.01;

const measurePlates = (chart: Locator) =>
  chart.evaluate((root) => {
    const svg = root.querySelector('svg');
    if (svg === null) {
      throw new Error('sankey chart has no svg');
    }
    const view = svg.getBoundingClientRect();
    const plates = Array.from(root.querySelectorAll('.sankey-col-label')).flatMap((label) => {
      const plate = label.closest('.chart-label-plate')?.querySelector('.chart-label-backdrop');
      return plate ? [plate.getBoundingClientRect()] : [];
    });
    return {
      labels: root.querySelectorAll('.sankey-col-label').length,
      plates: plates.length,
      outsideLeft: plates.map((plate) => Math.max(0, view.left - plate.left)),
      outsideRight: plates.map((plate) => Math.max(0, plate.right - view.right)),
      leftGap: plates.map((plate) => plate.left - view.left),
      rightGap: plates.map((plate) => view.right - plate.right)
    };
  });

const settledPlates = async (chart: Locator) => {
  await chart.page().evaluate(() => document.fonts.ready);
  await expect(chart.locator('.sankey-col-label').first()).toBeVisible();
  let prior = '';
  let result = await measurePlates(chart);
  await expect
    .poll(async () => {
      result = await measurePlates(chart);
      const key = JSON.stringify(result);
      const stable = key === prior && result.plates === result.labels && result.plates > 0;
      prior = key;
      return stable;
    })
    .toBe(true);
  return result;
};

test.describe('SankeyChart header label plates', () => {
  test('a header clamped to the left edge keeps its plate inside the svg', async ({ page }) => {
    await page.goto(`${fixtureBaseURL}/sankey-label-plate-inset/`);
    const result = await settledPlates(page.getByTestId('sankey-plate-left-clamp'));

    // The clamp must actually bind: an unclamped first header sits far from the edge.
    expect(result.leftGap[0]).toBeLessThan(CHART_LABEL_PLATE_PADDING);
    for (const overhang of result.outsideLeft) {
      expect(overhang).toBeLessThanOrEqual(PLATE_SLACK);
    }
    for (const overhang of result.outsideRight) {
      expect(overhang).toBeLessThanOrEqual(PLATE_SLACK);
    }
  });

  test('a header clamped to the right edge keeps its plate inside the svg', async ({ page }) => {
    await page.goto(`${fixtureBaseURL}/sankey-label-plate-inset/`);
    const result = await settledPlates(page.getByTestId('sankey-plate-right-clamp'));

    const last = result.rightGap.length - 1;
    expect(result.rightGap[last]).toBeLessThan(CHART_LABEL_PLATE_PADDING);
    for (const overhang of result.outsideLeft) {
      expect(overhang).toBeLessThanOrEqual(PLATE_SLACK);
    }
    for (const overhang of result.outsideRight) {
      expect(overhang).toBeLessThanOrEqual(PLATE_SLACK);
    }
  });
});
