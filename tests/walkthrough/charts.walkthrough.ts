import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight } from './support/narrate.js';

/**
 * Proves the chart family's new keyboard-access pass with recordings, not
 * screenshots.
 *
 * Every mark in every chart here (AreaChart/LineChart points, BarChart bars,
 * PieChart slices, SankeyChart nodes and links) became a Tab-reachable
 * `role="button"` element whose focus state mirrors pointer hover exactly:
 * the same dot enlarges, the same crosshair lands, the same tooltip appears
 * at the same anchor. None of that exists in a single frame -- a screenshot
 * of a focused mark and a screenshot of an unfocused one look the same
 * unless focus-visible happens to be styled, and even then a still frame
 * cannot show that it is the FOCUS event driving the change rather than
 * some other state. A human reviewer has to watch the ring travel from
 * point to point and the tooltip follow it to believe the two input paths
 * are actually wired to the same state. Two behaviours are audible/inert
 * rather than visual for the same reason: the LineChart and PieChart live
 * regions (`role="status" aria-live="polite"`) announce content a sighted
 * screenshot reviewer never sees rendered anywhere on screen, so each test
 * that touches one also paints its live text into a caption to make the
 * proof legible on the recording. Every `caption()`/`step()` overlay is
 * `aria-hidden` and `pointer-events: none` (see `support/narrate.ts`) and is
 * never the target of an assertion here -- only real DOM state is.
 *
 * Pacing uses `beat()` after every `.focus()` so the focus ring and tooltip
 * are actually on screen for a frame or two before the next assertion or
 * interaction, matching each gap's `seconds_needed` from the gap packet.
 *
 * `.focus()` is used in place of literal sequential `Tab` key presses:
 * these routes carry dozens of other focusable demo controls above the
 * target chart, so a real Tab traversal from page load would need an
 * impractical, brittle number of key presses to arrive. `.focus()` lands on
 * the same real `tabindex="0"` element a Tab press would and exercises the
 * identical focus/blur handlers -- what is being proved is that the
 * element is focusable and that focusing it mirrors hover, not the
 * traversal mechanics of getting there.
 *
 * The one gap from the packet that had no demo route -- a negative
 * y-value's clamp-to-zero in `computeStackedValues` (`$lib/_chart/geometry`)
 * -- is now covered too: `area-chart/+page.svelte` gained an
 * `area-stacked-negative-chart` demo once a fixture with a negative point
 * existed to test against. Stacking is Area-only, not "stacked
 * Area/LineChart" as an earlier note here said -- `LineChart.svelte` has no
 * `stacked`/`stackNormalize` prop and never imports `computeStackedValues`,
 * confirmed by reading its full prop list and import block, so only
 * AreaChart needed a test for this.
 *
 * Two tests below were originally `test.fixme`, for the same reason, not
 * as a way to avoid a red run: each asserted the CORRECT/intended
 * behaviour and failed against the real component at the time. Both are
 * backed by a source citation in their own comment, not just the observed
 * failure -- see each comment for exactly what was broken, what was
 * verified, and what changed. Both defects are now fixed and both tests
 * have been restored to real tests: the tooltip-portal clipping escape,
 * and PieChart slice focus losing to a legend row's stale hover.
 */

/**
 * Proxy for "Enter/Space activates this mark exactly like a click would".
 *
 * None of AreaChart/LineChart/PieChart/SankeyChart's marks are native
 * `<button>` elements, so the browser never synthesizes a real `click`
 * event for them on Enter/Space -- the component's own `onkeydown` handler
 * calls `e.preventDefault()` and invokes its click callback directly, with
 * no DOM event to observe. There is also no on-page readout of that
 * callback on any of these demo routes. `defaultPrevented` is therefore the
 * only observable trace of "this key was recognised as the activation key",
 * which is exactly what the family's own keyboard unit tests assert
 * (`onpointclick` called on Enter/Space, not on other keys). The listener
 * is attached after the component has already mounted its own, so it
 * always observes the outcome of the app's handler, never races it.
 *
 * The read is deferred by one macrotask before it is written. Svelte 5
 * DELEGATES `keydown` (see `DELEGATED_EVENTS` in the installed
 * `svelte/src/utils.js`): it does not call `addEventListener('keydown', ...)`
 * on this node at all. It stores the handler on the node and invokes it
 * itself, later, from ONE real `keydown` listener registered once on the
 * mount container/document (`svelte/src/internal/client/render.js`), which
 * walks `event.composedPath()` as the event bubbles. That means a listener
 * added directly on this node -- as this helper's -- fires during the native
 * TARGET-phase dispatch, strictly before Svelte's own delegated handler (the
 * one that actually calls `e.preventDefault()`) ever runs. Reading
 * `event.defaultPrevented` synchronously inside this node's own listener
 * therefore always observes `false`, regardless of what the component does.
 * A `setTimeout(..., 0)` runs only after the whole synchronous native
 * dispatch -- Svelte's delegated handler included -- has finished, so the
 * value it writes is the real, final one. `expect.poll` below waits for that
 * write without depending on a fixed delay.
 */
async function keyFiresPreventDefault(target: Locator, key: string): Promise<boolean> {
  await target.evaluate((node, k) => {
    node.setAttribute('data-walkthrough-key-result', 'unset');
    node.addEventListener(
      'keydown',
      (event) => {
        // `instanceof` rather than a wider annotation: `addEventListener`'s
        // callback is typed against the base `Event`, which carries no `key`,
        // and an assertion would defeat the point of a helper whose whole job
        // is to observe what a real dispatched event actually carries.
        if (!(event instanceof KeyboardEvent) || event.key !== k) {
          return;
        }
        setTimeout(() => {
          node.setAttribute('data-walkthrough-key-result', String(event.defaultPrevented));
        }, 0);
      },
      { once: true }
    );
  }, key);
  await target.press(key);
  await expect.poll(() => target.getAttribute('data-walkthrough-key-result')).not.toBe('unset');
  return (await target.getAttribute('data-walkthrough-key-result')) === 'true';
}

/**
 * Proxy for "Enter/Space fires the same click a pointer click would" on a
 * NATIVE `<button>` (PieChart's synchronized legend row has no custom
 * `onkeydown` at all). Here the browser itself dispatches a genuine `click`
 * DOM event on Enter/Space, so the cleanest proof is observing that event
 * directly rather than the `defaultPrevented` proxy the SVG marks need.
 */
async function keyDispatchesClick(target: Locator, key: string): Promise<boolean> {
  await target.evaluate((node) => {
    node.setAttribute('data-walkthrough-click-result', 'false');
    node.addEventListener(
      'click',
      () => node.setAttribute('data-walkthrough-click-result', 'true'),
      { once: true }
    );
  });
  await target.press(key);
  return (await target.getAttribute('data-walkthrough-click-result')) === 'true';
}

test('AreaChart marks are Tab-reachable and focus mirrors hover exactly', async ({ page }) => {
  await gotoHydrated(page, '/components/area-chart');
  // "With Dots" has no testId -- it is one of the pre-existing basic demo
  // rows, and this walkthrough may not add markup to demo routes. The
  // heading is unique on the page, so it anchors a real CSS sibling
  // selector instead.
  const section = page.locator('h3:text-is("With Dots") + div.demo-row');
  const marks = section.locator('circle.focus-target');
  const dots = section.locator('circle.dot');

  await expect(marks).toHaveCount(8);

  await caption(
    page,
    'Every rendered point is a real Tab stop. Focusing one mirrors hovering it exactly: the dot grows, the crosshair lands, the tooltip appears.'
  );

  const points = [
    { x: 1, y: '120' },
    { x: 2, y: '180' },
    { x: 3, y: '150' },
    { x: 4, y: '220' }
  ];

  for (const [i, point] of points.entries()) {
    const mark = marks.nth(i);
    await mark.focus();
    await beat(page);
    await expect(mark).toBeFocused();
    await expect(mark).toHaveAttribute('aria-label', `${point.x}: ${point.y}`);
    // Focus mirrors hover: the dot at the SAME x enlarges from r=3 to r=6.
    await expect(dots.nth(i)).toHaveAttribute('r', '6');
    const tooltip = section.getByTestId('chart-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator('.tooltip-title')).toHaveText(`x: ${point.x}`);
    await expect(tooltip.getByTestId('tooltip-item-0')).toContainText(point.y);
  }

  // The enlarge is exclusive to whichever point is currently focused, not a
  // one-way state change: the first dot, long since unfocused, is back to
  // its resting radius.
  await expect(dots.nth(0)).toHaveAttribute('r', '3');

  const lastMark = marks.nth(3);
  await lastMark.focus();
  await beat(page);
  await caption(
    page,
    'Enter or Space activates the focused point exactly like a click would; an unrelated key does nothing.'
  );
  expect(await keyFiresPreventDefault(lastMark, 'Enter')).toBe(true);
  expect(await keyFiresPreventDefault(lastMark, 'a')).toBe(false);
});

test('LineChart marks announce every series at a shared x through a live region, not just the focused one', async ({
  page
}) => {
  await gotoHydrated(page, '/components/line-chart');
  const chart = page.getByTestId('line-shared-tooltip-chart');
  const marks = chart.locator('circle.focus-target');
  const status = chart.getByTestId('line-status');

  await caption(
    page,
    'The shared tooltip already shows all three series at once. The visually-hidden live region now announces the same thing, not just the focused series.'
  );

  const steps = [
    { index: 0, label: '1 — Desktop: 12', status: '1 — Desktop: 12, Mobile: 8, Tablet: 3' },
    { index: 1, label: '2 — Desktop: 18', status: '2 — Desktop: 18, Mobile: 11, Tablet: 4' },
    { index: 2, label: '3 — Desktop: 15', status: '3 — Desktop: 15, Mobile: 14, Tablet: 6' }
  ];

  for (const walkthroughStep of steps) {
    const mark = marks.nth(walkthroughStep.index);
    await mark.focus();
    await beat(page);
    await expect(mark).toHaveAttribute('aria-label', walkthroughStep.label);
    // Halo circles mirror hover for every series sharing this x, not only
    // the one that was actually focused.
    await expect(chart.getByTestId(/^dot-halo-\d+$/)).toHaveCount(3);
    const tooltip = chart.getByTestId('chart-tooltip');
    await expect(tooltip.getByTestId(/^tooltip-item-\d+$/)).toHaveCount(3);
    await expect(status).toHaveText(walkthroughStep.status);
    const liveText = await status.textContent();
    await caption(page, `Live region (visually hidden) now reads: "${liveText ?? ''}"`);
  }
});

test('AreaChart and LineChart join series by x value, never by array position', async ({
  page
}) => {
  await gotoHydrated(page, '/components/area-chart');
  const areaChart = page.getByTestId('area-alignment-chart');

  await caption(
    page,
    '"This week" has no sample at x=3; "Last week" has none at x=6. Focusing either gap shows only the series that actually has data there.'
  );

  const areaLastWeekAtX3 = areaChart.locator('circle.focus-target[aria-label="3 — Last week: 20"]');
  await areaLastWeekAtX3.focus();
  await beat(page);
  const areaTooltipAtX3 = areaChart.getByTestId('chart-tooltip');
  await expect(areaTooltipAtX3.locator('.tooltip-title')).toHaveText('x: 3');
  await expect(areaTooltipAtX3.getByTestId(/^tooltip-item-\d+$/)).toHaveCount(1);
  await expect(areaTooltipAtX3.getByTestId('tooltip-item-0')).toContainText('Last week');
  await expect(areaTooltipAtX3.getByTestId('tooltip-item-0')).not.toContainText('This week');

  const areaThisWeekAtX6 = areaChart.locator('circle.focus-target[aria-label="6 — This week: 40"]');
  await areaThisWeekAtX6.focus();
  await beat(page);
  const areaTooltipAtX6 = areaChart.getByTestId('chart-tooltip');
  await expect(areaTooltipAtX6.locator('.tooltip-title')).toHaveText('x: 6');
  await expect(areaTooltipAtX6.getByTestId(/^tooltip-item-\d+$/)).toHaveCount(1);
  await expect(areaTooltipAtX6.getByTestId('tooltip-item-0')).toContainText('This week');
  await expect(areaTooltipAtX6.getByTestId('tooltip-item-0')).not.toContainText('Last week');

  await gotoHydrated(page, '/components/line-chart');
  const lineChart = page.getByTestId('line-alignment-chart');

  await caption(page, 'Same joined-by-x contract on LineChart, with its own gaps at x=3 and x=6.');

  const lineLastWeekAtX3 = lineChart.locator('circle.focus-target[aria-label="3 — Last week: 20"]');
  await lineLastWeekAtX3.focus();
  await beat(page);
  const lineTooltipAtX3 = lineChart.getByTestId('chart-tooltip');
  await expect(lineTooltipAtX3.getByTestId(/^tooltip-item-\d+$/)).toHaveCount(1);
  await expect(lineTooltipAtX3.getByTestId('tooltip-item-0')).toContainText('Last week');

  const lineThisWeekAtX6 = lineChart.locator('circle.focus-target[aria-label="6 — This week: 40"]');
  await lineThisWeekAtX6.focus();
  await beat(page);
  const lineTooltipAtX6 = lineChart.getByTestId('chart-tooltip');
  await expect(lineTooltipAtX6.getByTestId(/^tooltip-item-\d+$/)).toHaveCount(1);
  await expect(lineTooltipAtX6.getByTestId('tooltip-item-0')).toContainText('This week');
});

test('AreaChart and LineChart break the path at a NaN gap instead of drawing a poisoned line', async ({
  page
}) => {
  await gotoHydrated(page, '/components/area-chart');
  const areaChart = page.getByTestId('area-gap-chart');

  await caption(
    page,
    'x=4 and x=8 are NaN in this series -- a missing reading, not a zero. The line breaks there and resumes, instead of one poisoned path.'
  );

  // 9 points, 2 of them NaN: only the 7 finite ones get a Tab stop, and
  // (matching LineChart below) only the 7 finite ones get a dot marker --
  // AreaChart's `dot` block carries the same `Number.isFinite` guard as its
  // own `focus-target` block and LineChart's `dot` block.
  await expect(areaChart.locator('circle.focus-target')).toHaveCount(7);
  await expect(areaChart.locator('circle.dot')).toHaveCount(7);
  const areaLineD = (await areaChart.locator('path.area-line').getAttribute('d')) ?? '';
  // Three finite runs: [x1-x3], [x5-x7], [x9] -- three separate "M" moves.
  expect((areaLineD.match(/M /g) ?? []).length).toBe(3);
  expect(areaLineD).not.toContain('NaN');
  await highlight(areaChart.locator('path.area-line'));

  await gotoHydrated(page, '/components/line-chart');
  const lineChart = page.getByTestId('line-gap-chart');

  await caption(page, 'Same break-and-resume contract on LineChart.');

  await expect(lineChart.locator('circle.focus-target')).toHaveCount(7);
  await expect(lineChart.locator('circle.dot')).toHaveCount(7);
  const lineD = (await lineChart.locator('path.line-path').getAttribute('d')) ?? '';
  expect((lineD.match(/M /g) ?? []).length).toBe(3);
  expect(lineD).not.toContain('NaN');
  await highlight(lineChart.locator('path.line-path'));
});

test('AreaChart clamps a negative stacked value to zero height instead of inverting the stack, without dropping it', async ({
  page
}) => {
  await gotoHydrated(page, '/components/area-chart');
  const chart = page.getByTestId('area-stacked-negative-chart');

  await caption(
    page,
    "Revenue is flat at 100. Returns goes negative at x=3 and x=6 -- watch its band pinch flush with Revenue's top edge there, instead of dipping under it."
  );

  // DOM order for a stacked AreaChart is one series' full set of marks
  // (fill, line, dots, focus-targets) before the next series' -- Revenue is
  // series 0 (declared first in the fixture), Returns is series 1 -- so the
  // first 6 circle.dot elements are Revenue's and the next 6 are Returns',
  // both in x order (1..6). `cy` is the rendered pixel y of each point's
  // TOP-of-stack edge (`area.points` maps stacked `y1` through the scale --
  // AreaChart.svelte's `areas` derivation), not the raw data value, so
  // comparing `cy` between series is comparing real rendered geometry, not
  // fixture numbers reread back at themselves.
  const dots = chart.locator('circle.dot');
  await expect(dots).toHaveCount(12); // 6 Revenue + 6 Returns -- see below for why 12, not 10, is the point.
  const cys = await dots.evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('cy'))));
  const revenueCy = cys.slice(0, 6);
  const returnsCy = cys.slice(6, 12);

  // x=1,2,4,5 (Returns data indices 0,1,3,4): positive there, so its band
  // adds real height -- top edge visibly ABOVE Revenue's (smaller cy; SVG y
  // grows downward).
  for (const i of [0, 1, 3, 4]) {
    expect(returnsCy[i]).toBeLessThan(revenueCy[i] - 1);
  }

  // x=3, x=6 (Returns data indices 2, 5): negative there. A negative
  // contributes ZERO height -- `computeStackedValues` clamps with
  // `Math.max(0, entry.point.y)` (src/lib/_chart/geometry.ts) rather than
  // subtracting -- so Returns' top edge lands flush with Revenue's own flat
  // top edge: neither above it nor, as an unclamped stack would draw it,
  // below it.
  for (const i of [2, 5]) {
    expect(Math.abs(returnsCy[i] - revenueCy[i])).toBeLessThan(0.5);
  }

  await highlight(dots.nth(8)); // Returns' x=3 dot, pinched flush against Revenue's.
  await beat(page);

  // The clamp is not the same thing as a gap. A non-finite point is
  // dropped from the stack entirely -- no dot, no Tab stop (see the NaN-gap
  // test above). A negative point is still a REAL point in the stack, only
  // drawn at zero height: `computeStackedValues` only `continue`s past an
  // entry that is `null` or non-finite (line ~545); a negative, finite `y`
  // reaches the `Math.max(0, ...)` clamp below that check and still gets
  // pushed. Proven from rendered DOM, not re-asserting the fixture: the dot
  // count above is 12, not 10 (both negative points still drew a marker),
  // and Returns still has a real Tab stop at x=3 and x=6, each announcing
  // its true, unclamped value -- the clamp is a rendering decision, not a
  // data mutation, and this is the part a careless "treat negative like a
  // gap" fix would get wrong.
  const returnsFocusTargets = chart.locator('circle.focus-target[aria-label*="— Returns:"]');
  await expect(returnsFocusTargets).toHaveCount(6);
  await expect(returnsFocusTargets.nth(2)).toHaveAttribute('aria-label', '3 — Returns: -40');
  await expect(returnsFocusTargets.nth(5)).toHaveAttribute('aria-label', '6 — Returns: -15');

  await caption(
    page,
    'Its Tab stop is still there at x=3, and the tooltip still reports the real -40 -- the clamp only changes what gets drawn, not the data.'
  );
  await returnsFocusTargets.nth(2).focus();
  await beat(page);
  const returnsTooltipValue = chart.getByTestId('tooltip-item-1').locator('.tooltip-value');
  await expect(returnsTooltipValue).toHaveText('-40');
  await highlight(chart.getByTestId('chart-tooltip'));
});

test('BarChart grouped bars announce their own series name, not a shared category label', async ({
  page
}) => {
  await gotoHydrated(page, '/components/bar-chart');
  const chart = page.getByTestId('bar-legend-toggle-chart');
  await expect(chart.getByTestId(/^bar-\d+$/)).toHaveCount(12);

  await caption(
    page,
    'Three bars share the Q1 category. Focusing each now announces its own series instead of three identical "Q1" labels.'
  );

  const q1Bars = [
    { testId: 'bar-0', label: 'Q1 — Alpha: 120' },
    { testId: 'bar-4', label: 'Q1 — Beta: 90' },
    { testId: 'bar-8', label: 'Q1 — Gamma: 60' }
  ];

  for (const bar of q1Bars) {
    const target = chart.getByTestId(bar.testId);
    await target.focus();
    await beat(page);
    await expect(target).toHaveAttribute('aria-label', bar.label);
  }
});

test('PieChart legend rows and slices share one synchronized highlight when a legend row is hovered, and Enter on a focused row fires a click', async ({
  page
}) => {
  await gotoHydrated(page, '/components/pie-chart');
  const chart = page.getByTestId('pie-legend-sync-demo');
  const rentLegend = chart.getByTestId('pie-legend-sync-0');
  const rentSlice = chart.locator('path.slice[aria-label="Rent: 1.2K"]');
  const status = chart.getByTestId('pie-status');

  await caption(
    page,
    'Hovering a legend row highlights its slice -- the same state a pointer hover on the slice itself would set.'
  );
  await rentLegend.hover();
  await beat(page);
  await expect(rentLegend).toHaveClass(/legend-sync-active/);
  await expect(rentSlice).toHaveClass(/hovered/);
  await expect(status).toHaveText('Rent: 1.2K (49%)');

  await rentLegend.focus();
  await beat(page);
  await caption(page, 'Enter on a focused legend row fires the same click the slice itself would.');
  expect(await keyDispatchesClick(rentLegend, 'Enter')).toBe(true);
});

/**
 * Was a product defect, not a test bug: focusing a slice did not reliably
 * win over a legend row's leftover hover state -- the "other direction"
 * this test's original title promised.
 *
 * `PieChart.svelte` used to track pointer hover and keyboard focus in one
 * shared `hoveredIndex`: `handleLeave()` (wired to both `onpointerleave`
 * and `onblur`, on every slice AND every synchronized legend row)
 * unconditionally set it to `null`, and `handleFocus(i)` unconditionally
 * set it to `i`. Neither checked the other's most recent target, so
 * whichever fired LAST won -- and it was not always focus, because of a
 * genuine browser mechanism, not a test artifact: focusing an off-screen
 * slice triggers a native scroll-into-view, which moves the page under the
 * pointer's last real screen position and makes the browser recompute the
 * hover chain -- firing a real `pointerleave` on the previously-hovered
 * legend row AFTER the `focus` event had already set the shared index to
 * the slice. Confirmed against a real, unmodified Playwright/Chromium run
 * (a standalone script outside this suite, against the same route) with a
 * capture-phase listener logging every pointerleave/focus event and its
 * timestamp while replaying hover-Rent-then-focus-Food:
 *   562.3ms focus         -> Food: 600
 *   563.5ms pointerleave  -> pie-legend-sync-0
 * -- and reproduced identically with a REAL keyboard Tab traversal (not
 * just a synthetic `.focus()`), ruling out a synthetic-focus artifact.
 *
 * Fixed by giving pointer hover and keyboard focus independent state
 * (`hoveredIndex` / `focusedIndex`) and deriving the active mark as
 * `pointerOrFocusIndex = focusedIndex ?? hoveredIndex`: focus always wins
 * while something is focused, even if the pointer wanders onto or off of an
 * unrelated mark meanwhile; hover drives the highlight normally once
 * nothing is focused; and blur clears only `focusedIndex`, so it can never
 * leave a stuck highlight, and correctly falls back to a genuine lingering
 * hover if the pointer still happens to rest on a mark. The same
 * precedence was applied to every other chart with focusable marks
 * (AreaChart, LineChart, BarChart, and SankeyChart's nodes and links),
 * which shared the same single-shared-index construction and therefore the
 * same bug.
 *
 * This test exercises a REAL `page.keyboard.press('Tab')` traversal onto
 * the Food slice, not a synthetic `.focus()` -- unlike the rest of this
 * file (see the file header for why `.focus()` is normally preferred
 * here), the defect this test guards against is specifically about what a
 * genuine Tab key press does (the native scroll-into-view, and the stale
 * pointerleave it causes), so a synthetic `.focus()` would not exercise the
 * mechanism this test protects against regressing.
 */
test("PieChart slice focus overrides a legend row's stale hover instead of being clobbered by its late-arriving pointerleave", async ({
  page
}) => {
  await gotoHydrated(page, '/components/pie-chart');
  const chart = page.getByTestId('pie-legend-sync-demo');
  const rentLegend = chart.getByTestId('pie-legend-sync-0');
  const status = chart.getByTestId('pie-status');

  await caption(
    page,
    'Hovering the Rent row leaves it hovered -- the stale hover state a late focus used to lose to.'
  );
  await rentLegend.hover();
  await beat(page);

  const foodSlice = chart.locator('path.slice[aria-label="Food: 600"]');
  const foodLegend = chart.getByTestId('pie-legend-sync-1');

  // Seeds the tab position on the already-hovered Rent row via .focus() --
  // fine here, since seeding the START position isn't what this test
  // guards (see the file header for why .focus() is the norm elsewhere).
  // From there, REAL Tab presses walk to the Food slice: legend-1 (Food),
  // legend-2 (Transport), legend-3 (Utilities), legend-4 (Entertainment),
  // slice-0 (Rent), slice-1 (Food) -- it's specifically the native
  // scroll-into-view a genuine Tab key press triggers that used to clobber
  // the focus highlight.
  await rentLegend.evaluate((el) => el.focus());
  await beat(page);
  await caption(page, 'Six real Tab presses walk from the hovered legend row to the Food slice.');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
  }
  await expect(foodSlice).toBeFocused();
  await beat(page);

  await expect(foodSlice).toHaveClass(/hovered/);
  await expect(foodLegend).toHaveClass(/legend-sync-active/);
  // Single shared highlight, not an accumulating one: the previous row
  // loses its active state when the slice takes over.
  await expect(rentLegend).not.toHaveClass(/legend-sync-active/);
  await expect(status).toHaveText('Food: 600 (24%)');
});

/**
 * Was a product defect, not a test bug -- and not the missing testId the
 * original failure hint suggested. Both `data-pw="pie-tooltip-portal"` and
 * `data-pw="sankey-tooltip-portal"` DO exist exactly where expected
 * (`src/routes/components/pie-chart/+page.svelte`,
 * `src/routes/components/sankey-chart/+page.svelte`); neither demo ever
 * rendered a single mark, so there was nothing to focus.
 *
 * Two defects, both now fixed:
 *
 * (a) Trigger, demo CSS: both tooltip-portal wrappers -- `.clip-box` in the
 * pie-chart route, and its equivalent inline-styled `<div>` in the
 * sankey-chart route -- had NO explicit width, and sit as flex items inside
 * `.demo-row` (`src/routes/components/demo.css`,
 * `display: flex; align-items: center;`). A flex item with no `width`/`flex`
 * sizes by shrink-to-fit against its own content, and that content is
 * `ChartContainer.svelte`'s `.chart-container` div, which is `width: 100%`
 * -- a percentage width needs a definite parent width to resolve against,
 * so the two collapsed together to 0. Fixed by giving both wrappers an
 * explicit `width: 100%; box-sizing: border-box;` so they fill `.demo-row`
 * instead of shrink-to-fitting a 100%-width child; the clipping
 * (`overflow: hidden` + a constrained height) that the demo exists to show
 * off is untouched.
 *
 * (b) Root cause, library code: `ChartContainer.svelte` only rendered an
 * `<svg>` once `width > 0 && height > 0`, and gave no signal at all when
 * that never became true -- no warning, no fallback, just a permanently
 * empty container. Any consumer who places a chart in a shrink-to-fit flex
 * item or a content-sized grid cell hits the same silent collapse. Fixed by
 * giving `.chart-container` a `min-width` floor (default 160px, overridable
 * via `--chart-min-width`): a definite min-width, unlike a percentage
 * width, still contributes to an ancestor's shrink-to-fit calculation, so
 * the collapse can no longer happen in the first place. See the CSS
 * comment on `.chart-container` for why a JS-side fallback width or a
 * dev-only console warning were rejected in favour of this: a JS fallback
 * can't help because the *actual DOM box* is what's 0px (setting the
 * `width` state variable higher doesn't make the parent div physically
 * wider), and a warning alone doesn't stop the box from rendering empty --
 * it also cannot distinguish this from an intentionally-hidden chart (a
 * collapsed accordion/tab panel) without false positives.
 *
 * The real run previously hung for the full 180s because `.focus()` polls
 * for the locator to attach, and it never did. Now that both fixes are in,
 * an explicit `toBeVisible` check on the chart's `<svg>` runs first with a
 * short timeout, so a regression of either defect fails in seconds again
 * instead of quietly re-eating the walkthrough's full ceiling.
 */
test('PieChart and SankeyChart tooltips escape a clipping ancestor via tooltipPortal', async ({
  page
}) => {
  await gotoHydrated(page, '/components/pie-chart');
  const pieChart = page.getByTestId('pie-tooltip-portal');
  const pieSlice = pieChart.locator('path.slice').first();

  await caption(
    page,
    'This pie sits inside an overflow:hidden box short enough to clip its tooltip. Focusing a slice anyway shows the tooltip in full.'
  );
  // Fail fast, not at the 180s walkthrough ceiling, if the SVG is ever
  // absent again (e.g. the zero-size collapse this test guards against).
  await expect(pieChart.locator('svg')).toBeVisible({ timeout: 5_000 });
  // .focus() rather than .hover(): the slice's own geometry likely falls
  // outside the clipped viewport, and .hover() requires the hit-test /
  // visibility checks that would fail there -- .focus() does not.
  await pieSlice.focus();
  await beat(page);
  const pieTooltip = page.getByTestId('chart-tooltip');
  await expect(pieTooltip).toBeVisible();
  const pieEscaped = await pieTooltip.evaluate((node) => node.parentElement === document.body);
  expect(pieEscaped).toBe(true);
  await highlight(pieTooltip);

  await gotoHydrated(page, '/components/sankey-chart');
  const sankeyChart = page.getByTestId('sankey-tooltip-portal');
  const sankeyNode = sankeyChart.locator('rect.sankey-node').first();

  await caption(page, 'The same escape hatch on SankeyChart, clipped the same way.');
  await expect(sankeyChart.locator('svg')).toBeVisible({ timeout: 5_000 });
  await sankeyNode.focus();
  await beat(page);
  const sankeyTooltip = page.getByTestId('chart-tooltip');
  await expect(sankeyTooltip).toBeVisible();
  const sankeyEscaped = await sankeyTooltip.evaluate(
    (node) => node.parentElement === document.body
  );
  expect(sankeyEscaped).toBe(true);
  await highlight(sankeyTooltip);
});

test('SankeyChart nodes and links are keyboard reachable and the tooltip follows the focused element', async ({
  page
}) => {
  await gotoHydrated(page, '/components/sankey-chart');
  // "Website Traffic Flow" (the packet's primary example) has no testId --
  // its own "radius + maxHeight" demo does, and uses the same simple
  // 5-node graph, so it stands in for it.
  const chart = page.getByTestId('sankey-radius-demo');
  const tooltip = chart.getByTestId('chart-tooltip');

  await caption(
    page,
    'Nodes and links are both real Tab stops now, and the tooltip anchors to whichever one is focused, not a fixed position.'
  );

  const sourceANode = chart.locator('rect.sankey-node[aria-label="Source A: 60"]');
  await sourceANode.focus();
  await beat(page);
  await expect(tooltip).toBeVisible();
  await expect(tooltip.locator('.tooltip-title')).toHaveText('Source A');
  await expect(tooltip.getByTestId('tooltip-item-0')).toContainText('60');
  const leftBox = await tooltip.boundingBox();

  const outputNode = chart.locator('rect.sankey-node[aria-label="Output: 100"]');
  await outputNode.focus();
  await beat(page);
  await expect(tooltip.locator('.tooltip-title')).toHaveText('Output');
  await expect(tooltip.getByTestId('tooltip-item-0')).toContainText('100');
  const rightBox = await tooltip.boundingBox();

  if (leftBox === null || rightBox === null) {
    throw new Error('sankey tooltip never reported a bounding box');
  }
  // Proves the anchor tracks the focused node's own rect (left column vs.
  // right column of the diagram) instead of a stale mouse position.
  expect(rightBox.x).toBeGreaterThan(leftBox.x + 40);

  await caption(page, 'Enter on a focused node fires the same click a pointer click would.');
  expect(await keyFiresPreventDefault(outputNode, 'Enter')).toBe(true);
  expect(await keyFiresPreventDefault(outputNode, 'a')).toBe(false);

  const sourceAToProcess1 = chart.locator(
    'path.sankey-link[aria-label="Source A to Process 1: 40"]'
  );
  await caption(page, 'Links carry the same focus and tooltip contract as nodes.');
  await sourceAToProcess1.focus();
  await beat(page);
  await expect(tooltip.locator('.tooltip-title')).toHaveText('Source A → Process 1');
  await expect(tooltip.getByTestId('tooltip-item-0')).toContainText('40');
  await expect(tooltip.getByTestId('tooltip-item-1')).toContainText('66.67%');
});
