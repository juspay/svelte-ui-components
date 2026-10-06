import { writeFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import {
  installThinkingClock,
  releaseHeldTimeouts,
  tickThinkingClock
} from './support/thinking-clock';

/*
 * The elapsed counter is real time, which is exactly what makes it hard to hold still
 * for a screenshot or an exact-value assertion. These specs split the question in two:
 *
 *   - CONTROLLED: only the one-second interval that drives the counter is taken over
 *     (tests/support/thinking-clock.ts), so "0s -> 3s -> frozen -> reset" is exact.
 *     Native requestAnimationFrame, the CSS shimmer and every other timer keep running.
 *   - LIVE: no controller at all; the counter has to advance and freeze on the wall
 *     clock. A controller bug that makes the controlled half pass cannot hide a broken
 *     real interval here.
 *
 * They drive the host-owned fixture on the ThinkingIndicator example route, where
 * nothing but the Start/Finish button ever flips `busy`.
 */

const ROUTE = '/components/thinking-indicator';
const THEMES = ['light', 'dark'] as const;

const fixture = (page: Page): Locator => page.getByTestId('thinking-indicator-turn');
const elapsed = (page: Page): Locator => page.getByTestId('thinking-indicator-turn-elapsed');
const toggle = (page: Page): Locator => page.getByTestId('thinking-indicator-turn-toggle');
const run = (page: Page): Locator => page.getByTestId('thinking-indicator-turn-run');

const settleLayout = async (page: Page): Promise<void> => {
  // The disclosure animates grid-template-rows; a capture or measurement mid-transition
  // would be of a box that is still moving.
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; caret-color: transparent !important; }'
  });
};

/**
 * Waits for the page's own frame loop to run twice. State changes here are applied by
 * Svelte on a microtask, but `bind:clientHeight` (the trace connector) reports the new row
 * height on the next layout pass, so a capture taken the instant a click returns can be one
 * frame ahead of the geometry it is about to settle into. The page's real requestAnimationFrame
 * is running -- that is the point of controlling only the counter's interval -- so wait on it.
 */
const nextFrames = async (page: Page, count = 2): Promise<void> => {
  await page.evaluate(async (frames) => {
    // Finite entrance animations (row fade-up) first: they run on the page's real frame loop.
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
        .map((animation) => animation.finished.catch(() => null))
    );
    for (let frame = 0; frame < frames; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }, count);
};

const setTheme = async (page: Page, theme: (typeof THEMES)[number]): Promise<void> => {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
};

test.describe('ThinkingIndicator elapsed counter -- controlled one-second clock', () => {
  test.beforeEach(async ({ page }) => {
    // The example route also runs two self-playing showcases above the fixture (rows land
    // at 0.8s/1.4s/3.2s, the disclosure collapses 2.6s after settling, the status line
    // settles at 4s). Left on the wall clock they re-lay the page out under the fixture
    // mid-measurement and shift it, which is precisely how the old whole-route baseline
    // earned its exclusion (height 2029 -> 2150px between attempts). Holding every
    // timeout of 500ms or more freezes those demos in their initial state; the fixture is
    // host-driven and needs none of them. Sub-500ms timers and every animation frame run.
    await installThinkingClock(page, { holdTimeoutsMs: 500 });
    await gotoHydrated(page, ROUTE);
    await settleLayout(page);
  });

  test('counts 0s to 3s, freezes at settlement, and resets on a new busy phase', async ({
    page
  }) => {
    // Idle: a settled history row has never ticked, so there is nothing to count.
    await expect(fixture(page)).toBeVisible();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(elapsed(page)).toHaveCount(0);

    // Busy phase begins: the disclosure opens itself and the counter starts at zero.
    await run(page).click();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(elapsed(page)).toHaveText('0s');

    for (const expected of ['1s', '2s', '3s']) {
      await tickThinkingClock(page, 1);
      await expect(elapsed(page)).toHaveText(expected);
    }

    // Settlement freezes the counter. Ten more seconds of the controlled clock must not
    // move it, and the counter must stay on screen -- frozen, not hidden.
    await run(page).click();
    await expect(run(page)).toHaveText('Start turn');
    await tickThinkingClock(page, 10);
    await expect(elapsed(page)).toBeVisible();
    await expect(elapsed(page)).toHaveText('3s');
    await expect(toggle(page)).toContainText('Thought for a moment');

    // A fresh busy phase on the SAME instance restarts from zero rather than resuming.
    const pendingIntervals = (): Promise<number> =>
      page.evaluate(() => window.__thinkingClock?.pending() ?? -1);
    const whileSettled = await pendingIntervals();
    await run(page).click();
    await expect(elapsed(page)).toHaveText('0s');
    await tickThinkingClock(page, 2);
    await expect(elapsed(page)).toHaveText('2s');

    // The settled phase's interval was cleared, not leaked: a new phase adds exactly one,
    // and finishing it again returns to where settlement left the page.
    expect(await pendingIntervals()).toBe(whileSettled + 1);
    await run(page).click();
    expect(await pendingIntervals()).toBe(whileSettled);
  });

  test('a manual collapse keeps the frozen counter visible next to the settled label', async ({
    page
  }) => {
    await run(page).click();
    await tickThinkingClock(page, 3);
    await expect(elapsed(page)).toHaveText('3s');
    await run(page).click();

    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(elapsed(page)).toHaveText('3s');
    await expect(toggle(page)).toContainText('Thought for a moment');
  });

  test('leaves native animation frames and the CSS shimmer running while it controls time', async ({
    page
  }) => {
    await run(page).click();
    await tickThinkingClock(page, 1);

    // A frozen frame loop is what stalled capture in the audit; it must stay live.
    const frame = await page.evaluate(
      () => new Promise<string>((resolve) => requestAnimationFrame(() => resolve('frame')))
    );
    expect(frame).toBe('frame');

    const shimmer = fixture(page).locator('.status-label');
    await expect(shimmer).not.toHaveClass(/static-label/);
    const running = await shimmer.evaluate((element) =>
      element
        .getAnimations()
        .some(
          (animation) =>
            /shimmer/.test((animation as CSSAnimation).animationName) &&
            animation.playState === 'running'
        )
    );
    expect(running).toBe(true);
  });

  for (const theme of THEMES) {
    test(`busy, settled and collapsed states capture identically across repeats (${theme})`, async ({
      page
    }, testInfo) => {
      await setTheme(page, theme);
      const frame = page.getByTestId('thinking-indicator-turn-fixture');

      const captureThrice = async (): Promise<Buffer[]> => {
        await nextFrames(page);
        const shots: Buffer[] = [];
        for (let i = 0; i < 3; i += 1) {
          shots.push(await frame.screenshot({ animations: 'disabled' }));
        }
        return shots;
      };
      const expectStable = async (state: string): Promise<void> => {
        const [first, ...rest] = await captureThrice();
        for (const [index, next] of rest.entries()) {
          if (!next.equals(first)) {
            // Keep both frames: "differ" alone says nothing about WHAT moved.
            const firstPath = testInfo.outputPath(`${state}-capture-1.png`);
            const nextPath = testInfo.outputPath(`${state}-capture-${index + 2}.png`);
            writeFileSync(firstPath, first);
            writeFileSync(nextPath, next);
            await testInfo.attach(`${state}-capture-1.png`, { path: firstPath });
            await testInfo.attach(`${state}-capture-${index + 2}.png`, { path: nextPath });
          }
          expect(next.equals(first), `${state}: repeated captures differ`).toBe(true);
        }
      };

      await expectStable('idle');

      await run(page).click();
      await expect(elapsed(page)).toHaveText('0s');
      await expectStable('busy at 0s');

      await tickThinkingClock(page, 3);
      await expect(elapsed(page)).toHaveText('3s');
      await expectStable('busy at 3s');

      await run(page).click();
      await tickThinkingClock(page, 10);
      await expect(elapsed(page)).toHaveText('3s');
      await expectStable('settled, frozen at 3s');

      await toggle(page).click();
      await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
      await expectStable('collapsed, frozen at 3s');
    });
  }

  test('the status-line showcase counts, freezes when its reasoning settles, and Replay restarts it', async ({
    page
  }) => {
    const counter = page.getByTestId('thinking-indicator-elapsed-demo-elapsed');
    // The showcase settles on a 4s page timer. It is held (see beforeEach) so the moment of
    // settlement is chosen here, not raced: only the counter's interval and that one timer
    // are under test control; animation frames and CSS run natively.
    await expect(counter).toHaveText('0s');
    await tickThinkingClock(page, 3);
    await expect(counter).toHaveText('3s');
    await expect(page.getByTestId('thinking-indicator-elapsed-demo-detail')).toHaveCount(0);

    await releaseHeldTimeouts(page);
    await expect(page.getByTestId('thinking-indicator-elapsed-demo-detail')).toBeAttached();
    await tickThinkingClock(page, 10);
    await expect(counter).toHaveText('3s');

    await page.getByTestId('thinking-indicator-elapsed-replay').click();
    await expect(counter).toHaveText('0s');
  });
});

test.describe('ThinkingIndicator elapsed counter -- live, no controller', () => {
  /** Whole seconds shown by the counter, e.g. "7s" -> 7. */
  const seconds = async (counter: Locator): Promise<number> => {
    const text = (await counter.textContent()) ?? '';
    const match = /^(\d+)s$/.exec(text.trim());
    if (match === null) {
      throw new Error(`counter text is not "<n>s": ${JSON.stringify(text)}`);
    }
    return Number(match[1]);
  };

  test('advances on the wall clock and freezes when the host settles it', async ({ page }) => {
    await gotoHydrated(page, ROUTE);
    await settleLayout(page);

    // No exact values below: on a loaded machine the gap between a click returning and the
    // next assertion running can itself be several real seconds, so "0s right after
    // Start" is a race. What is invariant is direction: it advances, then it stops.
    await run(page).click();
    await expect(elapsed(page)).toHaveText(/^\d+s$/);
    const started = await seconds(elapsed(page));
    await expect
      .poll(() => seconds(elapsed(page)), { timeout: 20_000 })
      .toBeGreaterThanOrEqual(started + 2);

    await run(page).click();
    await expect(run(page)).toHaveText('Start turn');
    const frozen = await seconds(elapsed(page));
    // More than two full intervals of real time: a leaked interval would move it.
    await page.waitForTimeout(2_300);
    expect(await seconds(elapsed(page))).toBe(frozen);
    await expect(elapsed(page)).toBeVisible();
  });

  test('the status-line showcase ticks in real time without any helper', async ({ page }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('thinking-indicator-elapsed-demo-elapsed');
    await expect(counter).toHaveText(/^\d+s$/);
    // It reads 0s at mount; a second of real time later it has moved (it freezes at 4s once
    // the showcase's own timer settles it, so just require it left zero).
    await expect.poll(() => seconds(counter), { timeout: 20_000 }).toBeGreaterThanOrEqual(1);
  });
});
