import { expect, test, type Locator, type Page } from '@playwright/test';
import { waitForIntendedFonts } from '../support/hydrated';
import { installThinkingClock, tickThinkingClock } from '../support/thinking-clock';

/*
 * ThinkingIndicator's maintained visual baselines, taken in states the host owns.
 *
 * The whole-route baseline in components.visual.ts can only ever show the page where its
 * paused clock left it (one mid-run moment). The things that actually need pinning --
 * the counter at 0s and at 3s, frozen after settlement, back to 0s on a new turn, and the
 * disclosure open versus collapsed -- are STATES, and each is reached here on demand
 * through the host-driven fixture on that route, in both themes.
 *
 * Time is controlled narrowly (tests/support/thinking-clock.ts): only the one-second
 * interval behind the counter. `page.clock.install()` is deliberately NOT used. It also
 * replaces requestAnimationFrame, and a frame loop the test has to hand-crank is what
 * stalled screenshot capture in the audit; with only the counter's interval controlled,
 * native rAF, CSS and layout run exactly as production, and the elapsed counter and the
 * trace rows stay real, visible text in every capture.
 *
 * Like every baseline in this directory these are only valid in the pinned Linux
 * container (scripts/visual-test.sh); regenerate them there, never on a laptop.
 */

const ROUTE = '/components/thinking-indicator';
const THEMES = ['light', 'dark'] as const;

/**
 * Every off-origin request is refused, as in components.visual.ts: the docs shell links a
 * web font, and a font that arrives late (or not at all, in a sealed CI runner) would
 * change glyph metrics between runs.
 */
const refuseOffOrigin = async (page: Page): Promise<void> => {
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    return hostname === 'localhost' || hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
};

const prepare = async (page: Page, theme: (typeof THEMES)[number]): Promise<void> => {
  await refuseOffOrigin(page);
  // Hold every timeout of 500ms or more: the route's two self-playing showcases would
  // otherwise re-lay the page out above the fixture mid-capture (see the matching note in
  // tests/thinking-indicator-elapsed.spec.ts). The fixture is host-driven and needs none.
  await installThinkingClock(page, { holdTimeoutsMs: 500 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.addStyleTag({
    content: `
      /* Transitions are removed before anything is measured, for the reason spelled out in
         components.visual.ts: the disclosure animates grid-template-rows, and
         animations:'disabled' would otherwise resize it during the capture. */
      *, *::before, *::after {
        transition: none !important;
        caret-color: transparent !important;
      }
    `
  });
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
  await waitForIntendedFonts(page);
  // The first screenshot of a page is also its first paint, and Chromium binds a generic
  // font family to a physical face only then: warm that up so the baselines below are all
  // taken against resolved metrics (the same reason components.visual.ts does it).
  await page.screenshot({ fullPage: true });
};

/**
 * Rasterises the expanded trace once, in a throwaway context of the same browser, before
 * any baseline is taken.
 *
 * Measured in the pinned container: the FIRST page a fresh browser paints draws the trace
 * rows' text (the 500-weight `<b>` faces, which sit in a collapsed, clipped accordion and so
 * are never painted by a collapsed-page warm-up) 617 pixels differently from every later page,
 * and the three later pages agreed with each other exactly. So whichever test happened to
 * run first in a worker wrote a baseline the rest could not reproduce -- and which test that
 * is depends on how files are spread across workers, not on the code. Opening every
 * disclosure and taking one full-page capture here makes the browser warm for all of them,
 * so a baseline no longer depends on execution order.
 */
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  try {
    const page = await context.newPage();
    await refuseOffOrigin(page);
    await page.goto(ROUTE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; }'
    });
    // A DOM click, not Playwright's: this only needs each disclosure open so its rows get
    // painted, and an actionability wait on a toggle another opening just scrolled or covered
    // would burn the hook's whole timeout for nothing.
    await page.evaluate(() => {
      for (const toggle of document.querySelectorAll('button[aria-expanded="false"]')) {
        if (toggle instanceof HTMLElement) {
          toggle.click();
        }
      }
    });
    await page.waitForTimeout(400);
    await waitForIntendedFonts(page);
    await page.screenshot({ fullPage: true });
  } finally {
    await context.close();
  }
});

for (const theme of THEMES) {
  test.describe(`thinking-indicator host-driven states (${theme})`, () => {
    test('counter progress, settlement freeze, reset and disclosure states render as baselined', async ({
      page
    }) => {
      await prepare(page, theme);

      const frame: Locator = page.getByTestId('thinking-indicator-turn-fixture');
      const counter = page.getByTestId('thinking-indicator-turn-elapsed');
      const run = page.getByTestId('thinking-indicator-turn-run');
      const toggle = page.getByTestId('thinking-indicator-turn-toggle');
      await expect(frame).toBeVisible();

      /*
       * Each state is compared to its baseline AND captured twice more: identical bytes
       * across repeats is the property the old exclusion claimed the page lacked, so it is
       * asserted here directly instead of being inferred from a single comparison passing.
       */
      const check = async (name: string): Promise<void> => {
        // Let the row entrance animations (a 320ms fade-up, staggered 120ms per row) run to
        // their natural end first. Leaving them to `animations: 'disabled'` meant a capture
        // taken mid-animation was force-finished on a layer the animation had promoted, and
        // that rasterises the row text at a different sub-pixel position than the same rows
        // after the animation has simply ended -- 617 pixels, depending only on whether a
        // retry happened to land after the 320ms. Native rAF is running, so this is just
        // waiting on the page's own animations; the infinite ones (spinner, shimmer) never
        // finish and are left to `animations: 'disabled'` as before.
        await page.evaluate(async () => {
          await Promise.all(
            document
              .getAnimations()
              .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
              .map((animation) => animation.finished.catch(() => null))
          );
          for (let frame = 0; frame < 2; frame += 1) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }
        });
        await expect
          .soft(frame)
          .toHaveScreenshot(`thinking-indicator-states-${theme}-${name}.png`, {
            animations: 'disabled',
            maxDiffPixelRatio: 0
          });
        const first = await frame.screenshot({ animations: 'disabled' });
        const second = await frame.screenshot({ animations: 'disabled' });
        expect.soft(second.equals(first), `${name}: repeated captures differ`).toBe(true);
      };

      await check('idle');

      await run.click();
      await expect(counter).toHaveText('0s');
      await check('busy-0s');

      await tickThinkingClock(page, 3);
      await expect(counter).toHaveText('3s');
      await check('busy-3s');

      await run.click();
      await tickThinkingClock(page, 10);
      await expect(counter).toHaveText('3s');
      await check('settled-3s');

      // A new busy phase resets the SAME instance: this must match the very baseline the
      // first busy-0s was compared against, byte for byte.
      await run.click();
      await expect(counter).toHaveText('0s');
      await check('busy-0s');

      await tickThinkingClock(page, 3);
      await expect(counter).toHaveText('3s');
      await run.click();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await check('collapsed-3s');
    });
  });
}
