import { expect, test } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight } from './support/narrate.js';

/**
 * Proves the non-finite-input contract (docs/CHART_INPUT_POLICY.md) added to
 * BarChart, DualAxisBarChart, FunnelChart, PieChart and SankeyChart with
 * recordings, not screenshots.
 *
 * These five charts are value-accumulating / no-x-position charts: a NaN
 * cannot be dropped as a gap the way LineChart/AreaChart drop one (there is
 * no position to omit a stack segment, a pie slice, a funnel stage or a
 * sankey node/link from without shifting every sibling), so the contract for
 * them is "degrade to a zero contribution" instead. Each guard's whole job is
 * to stop one bad number from reaching a shared scale/total/running-base
 * variable and poisoning every OTHER mark that shares it -- so every test
 * here asserts on both the bad mark (it degrades cleanly, it does not render
 * NaN geometry) and at least one other mark that shares the
 * corrupted-in-the-old-code variable (it stays correct). A screenshot of the
 * bad mark alone cannot show that half of the story; the recording narrates
 * it with caption() and points at both halves with highlight().
 */

test('BarChart stacked bars treat a non-finite value as a zero contribution, not a poisoned running stack', async ({
  page
}) => {
  await gotoHydrated(page, '/components/bar-chart');
  const chart = page.getByTestId('bar-stacked-gap-chart');
  await chart.scrollIntoViewIfNeeded();

  await caption(
    page,
    'Organic has no reading at Q2 -- NaN marks a gap, not a fabricated 0. Watch its segment collapse to zero height without dragging Referral, stacked above it, down with it.'
  );

  // Render order is series (Direct, Organic, Referral) outer, Q1-Q4 inner, so
  // bar-5 is Organic's Q2 (the NaN point) and bar-9 is Referral's Q2 -- the
  // segment stacked directly on top of it in the same category. stackBase is
  // a running total carried forward category-by-category across series: an
  // unguarded Math.max(0, NaN) there would poison every series above the bad
  // one too, not just the bad one's own bar.
  const organicQ2 = chart.getByTestId('bar-5');
  const referralQ2 = chart.getByTestId('bar-9');
  const directQ2 = chart.getByTestId('bar-1');

  await highlight(organicQ2);
  const organicD = (await organicQ2.getAttribute('d')) ?? '';
  expect(organicD).not.toContain('NaN');

  await caption(
    page,
    "Referral's Q2 segment still stacks at the correct height on top of it -- the NaN below did not poison the running stack base."
  );
  await highlight(referralQ2);
  const referralD = (await referralQ2.getAttribute('d')) ?? '';
  expect(referralD).not.toContain('NaN');

  await highlight(directQ2);
  const directD = (await directQ2.getAttribute('d')) ?? '';
  expect(directD).not.toContain('NaN');
  await beat(page);
});

test('DualAxisBarChart filters a non-finite value out of the axis extent instead of collapsing the whole scale', async ({
  page
}) => {
  await gotoHydrated(page, '/components/dual-axis-bar-chart');
  const chart = page.getByTestId('dual-axis-nonfinite-chart');
  await chart.scrollIntoViewIfNeeded();

  await caption(
    page,
    'Revenue has no reading for Mar -- NaN marks a gap. axisDomain() filters it out before computing the left axis extent, so the axis keeps its real ~60K scale instead of one NaN collapsing it to 0-1.'
  );

  const leftAxis = chart.getByTestId('axis-left');
  await highlight(leftAxis);
  const leftTickTexts = await leftAxis.locator('[data-pw^="tick-label-"]').allTextContents();
  expect(leftTickTexts.length).toBeGreaterThan(0);
  // A collapsed [0, 1] domain formats every tick under 1000, so none of them
  // would ever reach formatNumber's "K" suffix -- this is the real
  // differentiator, not the Mar bar's own (separately unguarded) gap.
  expect(leftTickTexts.some((text) => text.includes('K'))).toBe(true);

  await caption(
    page,
    "Orders, on the right axis, is a separate series on a separate scale -- untouched by Revenue's gap either way."
  );
  const rightAxis = chart.getByTestId('axis-right');
  await highlight(rightAxis);
  const rightTickTexts = await rightAxis.locator('[data-pw^="tick-label-"]').allTextContents();
  expect(rightTickTexts.length).toBeGreaterThan(0);
  await beat(page);
});

test('PieChart treats a non-finite slice value as a zero contribution instead of corrupting every slice angle', async ({
  page
}) => {
  await gotoHydrated(page, '/components/pie-chart');
  const chart = page.getByTestId('pie-nonfinite-chart');
  await chart.scrollIntoViewIfNeeded();

  await caption(
    page,
    "Safari has no reading this period -- NaN marks a gap. pieSliceValue() gives it a zero contribution to the total, so it renders as a zero-size slice instead of NaN propagating through the shared total and breaking every slice's angle."
  );

  const slices = chart.locator('path.slice');
  await expect(slices).toHaveCount(5);

  const safariSlice = slices.nth(1);
  await highlight(safariSlice);
  await expect(safariSlice).toHaveAttribute('aria-label', 'Safari: 0');

  const sliceDs = await slices.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('d') ?? ''));
  for (const d of sliceDs) {
    expect(d).not.toContain('NaN');
  }

  await caption(
    page,
    "Chrome's slice is still sized off the real 81-value total, and Safari's own legend row reads 0 / 0%, not NaN."
  );
  const chromeSlice = slices.nth(0);
  await highlight(chromeSlice);
  await expect(chromeSlice).toHaveAttribute('aria-label', 'Chrome: 65');

  const safariLegendValue = chart.locator('.pie-legend-row').nth(1).locator('.pie-legend-value');
  await expect(safariLegendValue).toContainText('0%');
  await beat(page);
});

test('FunnelChart treats a non-finite stage value as a zero-height bar, not a NaN that collapses the whole funnel', async ({
  page
}) => {
  await gotoHydrated(page, '/components/funnel-chart');
  const chart = page.getByTestId('funnel-nonfinite-chart');
  await chart.scrollIntoViewIfNeeded();

  await caption(
    page,
    'Product View has no reading this period -- NaN marks a gap. safeValue() gives it a zero contribution to barHeight, so it renders at the 2px floor instead of the NaN reaching Math.max and collapsing its bar to an unrenderable height.'
  );

  const productViewBar = chart.getByTestId('funnel-bar-1');
  await highlight(productViewBar);
  await expect(productViewBar).toHaveAttribute('height', '2');
  await expect(productViewBar).toHaveAttribute('aria-label', /Product View: 0/);

  await caption(
    page,
    'Visit, the stage right before it, still renders at its full real height off the correct 12000-unit maxValue -- unaffected by the gap next to it.'
  );
  const visitBar = chart.getByTestId('funnel-bar-0');
  await highlight(visitBar);
  const visitHeight = Number((await visitBar.getAttribute('height')) ?? '0');
  expect(visitHeight).toBeGreaterThan(100);
  await beat(page);
});

test('SankeyChart sanitizes a non-finite link value at a single choke point instead of NaN spreading through the whole layout', async ({
  page
}) => {
  await gotoHydrated(page, '/components/sankey-chart');
  const chart = page.getByTestId('sankey-nonfinite-chart');
  await chart.scrollIntoViewIfNeeded();

  await caption(
    page,
    'Direct to Landing Page has no reading this period -- NaN marks a gap. The sanitized-links choke point in computeSankeyLayout gives it a zero value, so it collapses to the minLinkWidth floor instead of NaN spreading through the shared px-per-value scale to every node.'
  );

  const badLink = chart.locator(
    'path.sankey-link[data-link-source="direct"][data-link-target="landing"]'
  );
  await highlight(badLink);
  await expect(badLink).toHaveAttribute('aria-label', 'Direct to Landing Page: 0');
  await expect(badLink).toHaveAttribute('stroke-width', '2');

  await caption(
    page,
    'Google shares a column with Direct but has no NaN of its own -- watch it still render at its real, full height off the shared scale, not collapsed to the same floor.'
  );
  const googleNode = chart.locator('rect.sankey-node[data-node-id="google"]');
  await highlight(googleNode);
  await expect(googleNode).toHaveAttribute('aria-label', 'Google: 50');
  const googleHeight = Number((await googleNode.getAttribute('height')) ?? '0');
  expect(googleHeight).toBeGreaterThan(20);
  await beat(page);
});
