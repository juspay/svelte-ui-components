import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Pacing and captions for recordings a person is expected to WATCH.
 *
 * The functional suite already records every test (`video: 'on'`), and those
 * recordings are useless as evidence: an assertion-shaped test performs three
 * actions and exits, so the ten attached to this PR total 19 seconds, eight of
 * them under two. Nothing that moves -- a transition, a typewriter, a loader, a
 * focus ring travelling a menu -- survives at that length, and those are exactly
 * the behaviours a reviewer cannot check any other way.
 *
 * The fix is not a longer timeout. It is that a walkthrough has a different job
 * from a test: it must stay on screen long enough to be read, and it must say
 * what it is doing while it does it. This module supplies both, and nothing else.
 *
 * These specs still ASSERT. A recording that demonstrates a scenario but checks
 * nothing is theatre, and would rot silently the moment the behaviour regressed
 * -- the failure mode `scripts/check-test-focus.js` already warns about. Every
 * walkthrough here fails if its feature breaks; the pacing only governs how the
 * failure is filmed.
 */

/** Long enough to read a short line without padding every recording. */
const CAPTION_MS = 1_500;

/** A pause that lets the eye land on what just changed. */
const BEAT_MS = 500;

const OVERLAY_ID = 'sui-walkthrough-caption';

/**
 * Deliberately `waitForTimeout`, which is banned in the assertion suite for good
 * reason: there, waiting on a duration rather than a state is how a race gets
 * papered over. Here the duration IS the requirement -- the recording needs real
 * wall-clock time to exist on -- and no assertion depends on it.
 */
export const beat = async (page: Page, ms: number = BEAT_MS): Promise<void> => {
  await page.waitForTimeout(ms);
};

/**
 * Paints a caption over the page.
 *
 * `pointer-events: none` and a fixed position keep it out of every hit test, so
 * a caption can never be what a subsequent click lands on.
 *
 * The text is carried in a custom property and painted by `::after`, never
 * written as a text node. That is deliberate and was arrived at by measurement:
 * the obvious implementation sets `textContent` and marks the node
 * `aria-hidden`, and `tests/walkthrough/smoke.walkthrough.ts` proved that is not
 * enough -- `aria-hidden` removes a node from the accessibility tree, which is
 * what `getByRole` consults, while `getByText` is a plain DOM text matcher and
 * ignores it. The caption was therefore still findable as page content, and a
 * walkthrough could have passed on its own narration: the exact defect this
 * module exists to fix, reintroduced by the fix. Generated content belongs to no
 * text node, so no content query can reach it. `aria-hidden` stays as well, for
 * the assistive-technology case it does cover.
 */
export const caption = async (page: Page, text: string): Promise<void> => {
  await page.evaluate(
    ({ id, message }) => {
      const existing = document.getElementById(id);
      const node = existing instanceof HTMLElement ? existing : document.createElement('div');
      if (!existing) {
        node.id = id;
        node.setAttribute('aria-hidden', 'true');
        node.setAttribute('data-walkthrough-caption', '');
        const rule = document.createElement('style');
        // JSON.stringify yields a correctly quoted and escaped CSS string token.
        rule.textContent = `#${id}::after{content:var(--sui-caption-text,"")}`;
        document.head.appendChild(rule);
        node.style.cssText = [
          'position:fixed',
          'left:50%',
          'bottom:24px',
          'transform:translateX(-50%)',
          'z-index:2147483647',
          'pointer-events:none',
          'max-width:min(880px,90vw)',
          'padding:10px 18px',
          'border-radius:10px',
          'background:rgba(17,24,39,.92)',
          'color:#f9fafb',
          'font:500 15px/1.45 ui-sans-serif,system-ui,-apple-system,sans-serif',
          'text-align:center',
          'box-shadow:0 6px 24px rgba(0,0,0,.28)'
        ].join(';');
        document.body.appendChild(node);
      }
      node.style.setProperty('--sui-caption-text', JSON.stringify(message));
    },
    { id: OVERLAY_ID, message: text }
  );
  await page.waitForTimeout(CAPTION_MS);
};

/**
 * Captions an action, performs it, then pauses on the result.
 *
 * The pause after matters more than the one before: the interesting frame is
 * almost always the one *after* the click, and without it the recording cuts
 * away before the effect has rendered.
 */
export const step = async (
  page: Page,
  text: string,
  action: () => Promise<void>
): Promise<void> => {
  await caption(page, text);
  await action();
  await beat(page);
};

/**
 * Draws attention to an element by outlining it for a moment.
 *
 * Written to the element's inline style and then restored, rather than injected
 * as a stylesheet rule, so it cannot outlive the highlight or leak into a later
 * assertion about class names or computed styles.
 */
export const highlight = async (target: Locator, ms: number = 900): Promise<void> => {
  const previous = await target.evaluate((node) => {
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
      return '';
    }
    const before = node.style.outline;
    node.style.outline = '3px solid #f59e0b';
    node.style.outlineOffset = '3px';
    return before;
  });
  await target.page().waitForTimeout(ms);
  await target.evaluate((node, before: string) => {
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
      return;
    }
    node.style.outline = before;
    node.style.outlineOffset = '';
  }, previous);
};

/**
 * Asserts a target's real, on-screen bounding box sits inside the current
 * viewport -- not merely that it is attached and unclipped, which is all
 * Playwright's own `toBeVisible` requires. An element can pass `toBeVisible`
 * and `scrollIntoViewIfNeeded` can run earlier in a test and still leave it
 * off screen by the time a recording actually samples it, if anything reflows
 * the page in between (a viewport resize, a fresh navigation resetting
 * scroll, a layout shift). That gap is exactly how a walkthrough can hold a
 * caption and a highlight over an empty gutter and still pass: nothing it
 * asserted was ever "is this actually in frame". This makes that a real,
 * failing assertion instead of evidence nobody checks.
 */
export const assertInViewport = async (page: Page, target: Locator): Promise<void> => {
  const box = await target.boundingBox();
  expect(
    box,
    'target element must have a real bounding box (attached and rendered)'
  ).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport, 'page must report a viewport size').not.toBeNull();
  if (box === null || viewport === null) {
    return;
  }
  expect(box.width, 'target must have non-zero width').toBeGreaterThan(0);
  expect(box.height, 'target must have non-zero height').toBeGreaterThan(0);
  // A sliver -- fractional flex/font-metrics layout routinely lands an edge a
  // few tenths of a pixel past the boundary (observed: 720.34 against a 720
  // viewport) with nothing actually cropped. That is real geometry, not
  // rounding in this function -- `boundingBox()` already returns the exact
  // float the browser computed. The tolerance exists to separate that from an
  // actual crop, which misses by tens or hundreds of pixels, not a fraction
  // of one; it must stay far too small to hide one.
  const EDGE_TOLERANCE_PX = 1;
  expect(
    box.x,
    'target left edge must not be scrolled past the viewport’s left'
  ).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
  expect(
    box.y,
    'target top edge must not be scrolled past the viewport’s top'
  ).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
  expect(
    box.x + box.width,
    'target right edge must not extend past the viewport’s right'
  ).toBeLessThanOrEqual(viewport.width + EDGE_TOLERANCE_PX);
  expect(
    box.y + box.height,
    'target bottom edge must not extend past the viewport’s bottom'
  ).toBeLessThanOrEqual(viewport.height + EDGE_TOLERANCE_PX);
};
