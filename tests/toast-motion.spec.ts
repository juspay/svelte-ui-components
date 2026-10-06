import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import {
  canHoldThroughDisplayExit,
  distance,
  expectExitOpacity,
  expectExitTransform,
  expectMs,
  firstEnd,
  onlyRun,
  parseTranslate,
  peekToastRecording,
  readToastRecording,
  startToastRecording,
  toastEnds,
  toastRuns
} from './support/motion-observers';

/**
 * Toast motion, proved from the transitions the engine actually runs.
 *
 * Toast no longer uses `in:fly`/`out:fly`. It is CSS-native: `@starting-style`
 * supplies the hidden frame the entrance reads from and the exit returns to, the
 * travel is `--distance-overlay` (60px unless a token or prop says otherwise), and
 * the durations are `--toast-open-duration` -> `--duration-slow` (400ms) on the way
 * in and `--toast-close-duration` -> `--motion-duration` (800ms) on the way out.
 *
 * Under `prefers-reduced-motion: reduce` the stylesheet zeroes the travel
 * (`--toast-enter-x/y: 0 !important`) and floors every duration at 50ms. The floor
 * is deliberate: a 0s transition never starts, so it never fires `transitionend`,
 * and `transitionend` is what calls `ontoasthide` and lets the consumer remove the
 * toast. So reduced motion is "a 50ms fade, no spatial movement", NOT "no transition
 * at all" -- an earlier walkthrough asserted the latter and failed for it.
 *
 * Each test installs its recorder before the click that mounts the toast, so the
 * entrance is observed from its real first frame, and reads the CSSTransition
 * objects (from/to/duration) rather than racing a 50ms fade with frame readings.
 *
 * The exit is a different matter from the entrance: it only runs where the engine
 * can hold the toast on screen through `display: flex -> none` with a discrete
 * transition. Firefox cannot (its closed state applies at once), so there the
 * contract is "no exit animation, but the hide is still reported and the toast
 * removed" -- asserted as such, chosen by probing the capability, not the engine
 * name.
 */

const DEFAULT_TRAVEL_PX = 60;
const OPEN_MS = 400;
const CLOSE_MS = 800;
const REDUCED_MS = 50;
// Toast.svelte's default `duration`: the auto-hide timer starts when it mounts.
const AUTO_HIDE_MS = 2_000;

const reducedMotionMatches = (page: Page): Promise<boolean> =>
  page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

const setReducedMotion = async (page: Page, reduce: boolean): Promise<void> => {
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' });
  // The `reducedMotion` fixture option has failed to reach this app before (see
  // reduced-motion-indefinite.spec.ts); probe the live query rather than trust it.
  expect(await reducedMotionMatches(page)).toBe(reduce);
};

/** Opens the demo, shows the toast and waits for it to be removed again. */
const showAndAwaitRemoval = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'Show Toast', exact: true }).click();
  const toast = page.locator('.toast');
  await expect(toast).toBeVisible();
  // ontoasthide -> the demo's `{#if}` drops the node. Auto-hide + exit is ~2.8s at
  // the default durations.
  await expect(toast).toHaveCount(0, { timeout: 10_000 });
};

test.describe('Toast motion (normal preference)', () => {
  test('enters from the 60px token position over 400ms, leaves over 800ms, and is then removed', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, false);
    const canExit = await canHoldThroughDisplayExit(page);

    const recorder = await startToastRecording(page);
    await showAndAwaitRemoval(page);
    const recording = await readToastRecording(recorder);

    const enterTransform = onlyRun(recording, 'enter', 'transform');
    expect(parseTranslate(enterTransform.from)).toEqual({ x: 0, y: -DEFAULT_TRAVEL_PX });
    expect(distance(parseTranslate(enterTransform.to))).toBe(0);
    expectMs(enterTransform.durationMs, OPEN_MS);

    const enterOpacity = onlyRun(recording, 'enter', 'opacity');
    expect(Number(enterOpacity.from)).toBe(0);
    expect(Number(enterOpacity.to)).toBe(1);
    expectMs(enterOpacity.durationMs, OPEN_MS);
    expectMs(firstEnd(recording, 'enter', 'transform').elapsedMs, OPEN_MS);

    expectExitTransform(recording, canExit, {
      to: { x: 0, y: -DEFAULT_TRAVEL_PX },
      durationMs: CLOSE_MS
    });
    expectExitOpacity(recording, canExit, CLOSE_MS);

    // Frames never exceeded the token distance (the retired 500px/400px fly would).
    expect(recording.maxFrameOffsetPx.enter).toBeLessThanOrEqual(DEFAULT_TRAVEL_PX + 0.5);
    expect(recording.maxFrameOffsetPx.exit).toBeLessThanOrEqual(DEFAULT_TRAVEL_PX + 0.5);

    // Removed by the consumer's ontoasthide handler -- after the auto-hide timer, and
    // where an exit exists, after the whole exit.
    expect(recording.removedAfterMs).not.toBeNull();
    expect(recording.removedAfterMs ?? 0).toBeGreaterThanOrEqual(
      AUTO_HIDE_MS + (canExit ? CLOSE_MS : 0) - 100
    );
  });

  test('--toast-open-duration, --toast-close-duration and --distance-overlay retune the motion', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, false);
    const canExit = await canHoldThroughDisplayExit(page);
    await page.addStyleTag({
      content:
        ':root { --distance-overlay: 140px; --toast-open-duration: 700ms; --toast-close-duration: 350ms; }'
    });

    const recorder = await startToastRecording(page);
    await showAndAwaitRemoval(page);
    const recording = await readToastRecording(recorder);

    const enter = onlyRun(recording, 'enter', 'transform');
    expect(parseTranslate(enter.from)).toEqual({ x: 0, y: -140 });
    expectMs(enter.durationMs, 700);

    expectExitTransform(recording, canExit, { to: { x: 0, y: -140 }, durationMs: 350 });
    expect(recording.removedAfterMs).not.toBeNull();
  });

  test('the shared --duration-slow and --motion-duration tiers apply when no toast token is set', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, false);
    const canExit = await canHoldThroughDisplayExit(page);
    await page.addStyleTag({
      content:
        ':root { --distance-overlay: 90px; --duration-slow: 250ms; --motion-duration: 500ms; }'
    });

    const recorder = await startToastRecording(page);
    await showAndAwaitRemoval(page);
    const recording = await readToastRecording(recorder);

    // Entry reads --duration-slow before --motion-duration; exit reads
    // --motion-duration directly.
    const enter = onlyRun(recording, 'enter', 'transform');
    expect(parseTranslate(enter.from)).toEqual({ x: 0, y: -90 });
    expectMs(enter.durationMs, 250);
    expectExitTransform(recording, canExit, { to: { x: 0, y: -90 }, durationMs: 500 });
  });
});

test.describe('Toast motion (reduced motion)', () => {
  test('keeps a 50ms fade but no spatial travel, and still hides and is removed', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, true);
    const canExit = await canHoldThroughDisplayExit(page);

    const recorder = await startToastRecording(page);
    await showAndAwaitRemoval(page);
    const recording = await readToastRecording(recorder);

    // No spatial movement: no transform transition is ever started, either way.
    expect(toastRuns(recording, 'enter', 'transform')).toHaveLength(0);
    expect(toastRuns(recording, 'exit', 'transform')).toHaveLength(0);
    expect(recording.ends.filter((end) => end.property === 'transform')).toHaveLength(0);
    expect(recording.maxFrameOffsetPx.enter).toBeLessThan(0.5);
    expect(recording.maxFrameOffsetPx.exit).toBeLessThan(0.5);

    // The 50ms fade survives: it is what fires transitionend -> ontoasthide.
    const enter = onlyRun(recording, 'enter', 'opacity');
    expect(Number(enter.from)).toBe(0);
    expect(Number(enter.to)).toBe(1);
    expectMs(enter.durationMs, REDUCED_MS);
    expectExitOpacity(recording, canExit, REDUCED_MS);

    // Eventual cleanup happened: hidden, then removed by the consumer's handler.
    expect(recording.removedAfterMs).not.toBeNull();
    expect(recording.removedAfterMs ?? 0).toBeGreaterThanOrEqual(AUTO_HIDE_MS - 100);
  });

  test('a consumer duration token cannot revive travel or slow the hide under reduced motion', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, true);
    const canExit = await canHoldThroughDisplayExit(page);
    await page.addStyleTag({
      content:
        ':root { --distance-overlay: 200px; --toast-open-duration: 900ms; --toast-close-duration: 900ms; }'
    });

    const recorder = await startToastRecording(page);
    await showAndAwaitRemoval(page);
    const recording = await readToastRecording(recorder);

    expect(toastRuns(recording, 'enter', 'transform')).toHaveLength(0);
    expect(toastRuns(recording, 'exit', 'transform')).toHaveLength(0);
    expectMs(onlyRun(recording, 'enter', 'opacity').durationMs, REDUCED_MS);
    expectExitOpacity(recording, canExit, REDUCED_MS);
  });
});

test.describe('Toast motion (preference changes on a mounted toast)', () => {
  test('switching to reduced motion while a toast is showing removes travel from its exit, and switching back restores it', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, false);
    const canExit = await canHoldThroughDisplayExit(page);

    const firstRecorder = await startToastRecording(page);
    await page.getByRole('button', { name: 'Show Toast', exact: true }).click();
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    // Wait for the entrance to finish under normal motion, then flip the
    // preference on the SAME mounted toast, well inside its 2s auto-hide.
    await expect
      .poll(
        async () => toastEnds(await peekToastRecording(firstRecorder), 'enter', 'transform').length
      )
      .toBe(1);

    // While visible the toast carries its entrance durations (400ms, per property).
    expect(
      await toast.evaluate((node) => getComputedStyle(node).transitionDuration),
      'normal motion: the visible toast carries the 400ms open duration'
    ).toBe('0.4s, 0.4s, 0.4s');
    await setReducedMotion(page, true);
    expect(
      await toast.evaluate((node) => getComputedStyle(node).transitionDuration),
      'the mounted toast picks the new preference up without remounting'
    ).toBe('0.05s');

    await expect(toast).toHaveCount(0, { timeout: 10_000 });
    const first = await readToastRecording(firstRecorder);

    // The entrance happened before the flip, with full travel; the exit after it,
    // with none.
    const enterTransform = onlyRun(first, 'enter', 'transform');
    expect(parseTranslate(enterTransform.from)).toEqual({ x: 0, y: -DEFAULT_TRAVEL_PX });
    expectMs(enterTransform.durationMs, OPEN_MS);
    expect(toastRuns(first, 'exit', 'transform')).toHaveLength(0);
    expectExitOpacity(first, canExit, REDUCED_MS);
    expect(first.maxFrameOffsetPx.exit).toBeLessThan(0.5);

    // And back: a new toast under no-preference travels the full distance again.
    await setReducedMotion(page, false);
    const secondRecorder = await startToastRecording(page);
    await page.getByRole('button', { name: 'Show Toast', exact: true }).click();
    await expect(toast).toBeVisible();
    await expect
      .poll(
        async () => toastEnds(await peekToastRecording(secondRecorder), 'enter', 'transform').length
      )
      .toBe(1);
    const second = await readToastRecording(secondRecorder);
    expect(parseTranslate(onlyRun(second, 'enter', 'transform').from)).toEqual({
      x: 0,
      y: -DEFAULT_TRAVEL_PX
    });
  });
});

test.describe('Toast motion via <sui-toast> props', () => {
  const loadToastTag = async (page: Page): Promise<void> => {
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-toast')));
  };

  const hidden = (page: Page): Promise<void> =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const host = document.querySelector('sui-toast');
          if (host === null) {
            throw new Error('no <sui-toast> mounted');
          }
          host.addEventListener('toasthide', () => resolve(), { once: true });
        })
    );

  test('direction, inAnimationOffset and the animation durations reach the transition', async ({
    page
  }) => {
    await loadToastTag(page);
    await setReducedMotion(page, false);
    const canExit = await canHoldThroughDisplayExit(page);

    const recorder = await startToastRecording(page, {
      host: {
        tag: 'sui-toast',
        attributes: {
          message: 'Saved',
          duration: '700',
          direction: 'left-to-right',
          'in-animation-offset': '200',
          'in-animation-duration': '500',
          'out-animation-duration': '300'
        }
      }
    });
    await hidden(page);
    const recording = await readToastRecording(recorder);

    const enter = onlyRun(recording, 'enter', 'transform');
    // left-to-right enters from the left: a negative x, resized to the prop.
    expect(parseTranslate(enter.from)).toEqual({ x: -200, y: 0 });
    expectMs(enter.durationMs, 500);

    // The closed position is shared: exit returns to the same offset.
    expectExitTransform(recording, canExit, { to: { x: -200, y: 0 }, durationMs: 300 });
  });

  test('a 0ms animation duration is floored at 50ms so the toast can still hide', async ({
    page
  }) => {
    await loadToastTag(page);
    await setReducedMotion(page, false);
    const canExit = await canHoldThroughDisplayExit(page);

    const recorder = await startToastRecording(page, {
      host: {
        tag: 'sui-toast',
        attributes: {
          message: 'Saved',
          duration: '700',
          'in-animation-duration': '0',
          'out-animation-duration': '0'
        }
      }
    });
    // toasthide is the hide being reported: it arrives only because the floored
    // exit ran to completion (or, where no exit can run, because the hide is
    // reported at once).
    await hidden(page);
    const recording = await readToastRecording(recorder);

    expectMs(onlyRun(recording, 'enter', 'opacity').durationMs, REDUCED_MS);
    expectExitOpacity(recording, canExit, REDUCED_MS);
  });
});
