import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// `ChatController` bypasses its character-by-character reveal entirely when the user
// asks for reduced motion (`prefersReducedMotion()`, consulted by `feed()`), but
// `TypewriterText` — which exists to do the same job, and whose own tagline is "reveals
// text one character at a time, the way a streaming model answer reads" — had no such
// handling. The same OS setting therefore silenced one reveal implementation and not the
// other, so a consumer composing `TypewriterText` through `Chat`'s `messageBody` snippet
// kept the animation the setting exists to suppress. See #465.
//
// Emulation is applied with `page.emulateMedia()` rather than the more idiomatic
// `test.use({ reducedMotion: 'reduce' })`. That is deliberate and load-bearing: under
// this config `test.use` does NOT reach the page — `matchMedia('(prefers-reduced-motion:
// reduce)').matches` stays `false`, so the "reduce" test would render an un-emulated page
// and fail for a reason that has nothing to do with the component. Verified both ways
// before writing this. Do not "simplify" it back to `test.use`.
//
// Timing is measured from the FIRST text mutation to the LAST via a MutationObserver
// installed before navigation, never from an expect() poll — matching the pattern the
// component's existing pacing tests already establish.

const BASELINE_TEXT = 'Baseline pacing check text stays fast.';
const BASELINE_TEST_ID = 'typewriter-default-pacing';

// Longer and slower (74 characters at speed=20) than the baseline fixture, which leaves room
// to flip the preference while typing is genuinely still in flight.
const PROGRESS_TEXT = 'Progress reporting keeps a scroll container pinned to the newest character.';
const PROGRESS_TEST_ID = 'typewriter-progress-demo';

type RevealTiming = {
  firstAt: number | null;
  lastAt: number | null;
  mutations: number;
  mutationsAtReduceFlip: number | null;
};

const installRevealObserver = async (
  page: Page,
  testId: string,
  windowKey: string
): Promise<void> => {
  await page.addInitScript(
    ({ testId, windowKey }: { testId: string; windowKey: string }) => {
      const timing: RevealTiming = {
        firstAt: null,
        lastAt: null,
        mutations: 0,
        mutationsAtReduceFlip: null
      };
      (window as unknown as Record<string, RevealTiming>)[windowKey] = timing;
      /*
       * Recorded in the page, at the instant the preference actually flips.
       * Sampling the count from the test process instead would put the
       * `emulateMedia` CDP round-trip inside the measured window, and every
       * character that types while that round-trip is in flight would count
       * against the bound -- which is why this assertion failed under load and
       * passed in isolation.
       */
      const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reduceQuery.addEventListener('change', (event) => {
        if (event.matches && timing.mutationsAtReduceFlip === null) {
          timing.mutationsAtReduceFlip = timing.mutations;
        }
      });
      const attach = () => {
        const element = document.querySelector(`[data-pw="${testId}"]`);
        if (!element) {
          requestAnimationFrame(attach);
          return;
        }
        new MutationObserver(() => {
          if ((element.textContent || '').length === 0) {
            return;
          }
          if (timing.firstAt === null) {
            timing.firstAt = performance.now();
          }
          timing.lastAt = performance.now();
          timing.mutations += 1;
        }).observe(element, { childList: true, subtree: true, characterData: true });
      };
      requestAnimationFrame(attach);
    },
    { testId, windowKey }
  );
};

const readTiming = async (
  page: Page,
  windowKey: string
): Promise<{ mutations: number; elapsedMs: number; mutationsAtReduceFlip: number | null }> => {
  return page.evaluate((key: string) => {
    const timing = (window as unknown as Record<string, RevealTiming>)[key];
    const elapsedMs =
      timing && timing.firstAt !== null && timing.lastAt !== null
        ? Math.round(timing.lastAt - timing.firstAt)
        : -1;
    return {
      mutations: timing ? timing.mutations : -1,
      elapsedMs,
      mutationsAtReduceFlip: timing ? timing.mutationsAtReduceFlip : null
    };
  }, windowKey);
};

test('reduced motion reveals the whole string at once instead of typing it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installRevealObserver(page, BASELINE_TEST_ID, '__reducedMotionTiming');
  await gotoHydrated(page, '/components/typewriter-text');

  // The emulation is the premise of the assertion below, so prove it landed rather than
  // trusting it — an un-emulated page would type, and the failure would look like a
  // component bug.
  const emulationActive = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  expect(emulationActive).toBe(true);

  await expect(page.locator(`[data-pw="${BASELINE_TEST_ID}"]`)).toHaveText(BASELINE_TEXT);

  const { mutations, elapsedMs } = await readTiming(page, '__reducedMotionTiming');

  // One mutation carrying the entire string — not one per character. The length is what
  // makes this meaningful: typing this text at the default 15ms cadence takes well over
  // half a second and mutates the node 38 times.
  expect(mutations).toBe(1);
  expect(elapsedMs).toBeLessThan(50);
});

// Raised in review as a possible defect: because `prefersReducedMotion()` is a one-shot
// call rather than a subscription, does a reveal already in flight keep typing until the
// text changes or completes?
//
// It does not, and this is the proof rather than an argument. `typeNextCharacter()` re-enters
// through its own `setTimeout` chain and re-reads the preference at the top of every call, so
// the switch is picked up on the very next character — within one `speed` interval, 20ms on
// this fixture. A subscription would buy nothing here and would add a listener to unregister.
test('a mid-stream switch to reduced motion stops the typing immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installRevealObserver(page, PROGRESS_TEST_ID, '__midStreamTiming');
  await gotoHydrated(page, '/components/typewriter-text');

  const typewriter = page.locator(`[data-pw="${PROGRESS_TEST_ID}"]`);

  /*
   * Waiting in the page rather than polling `textContent` from here. The whole
   * string reveals in roughly 450ms, and every `expect.poll` iteration costs a
   * round-trip; on a loaded machine those spent most of the window, so the flip
   * below landed after typing had already finished and the guard on `remaining`
   * failed. `waitForFunction` evaluates in the page, so the wait ends on the
   * first revealed character and the only round-trip left in the critical path
   * is the `emulateMedia` call itself.
   */
  await page.waitForFunction(
    (key: string) => {
      const timing = (window as unknown as Record<string, RevealTiming>)[key];
      return Boolean(timing) && timing.mutations > 0;
    },
    '__midStreamTiming',
    { polling: 'raf' }
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(typewriter).toHaveText(PROGRESS_TEXT);

  const timing = await readTiming(page, '__midStreamTiming');
  // A missing count would mean the flip was never observed in the page, so the
  // number below would be measuring the whole reveal and quietly passing for the
  // wrong reason. Asserting a real number catches that, and also catches the
  // field being dropped by `readTiming`'s projection -- which is exactly the
  // mistake this guard was first written too loosely to catch.
  const flippedAt = timing.mutationsAtReduceFlip;
  expect(typeof flippedAt).toBe('number');

  // The flip has to land with more left to type than the bound below, or the
  // assertion would pass for the wrong reason. Taken from the in-page count at
  // the flip, so it measures where the reveal actually was rather than where a
  // sample taken a round-trip earlier said it was.
  expect(PROGRESS_TEXT.length - (flippedAt ?? 0)).toBeGreaterThan(12);

  const mutationsAfterToggle = timing.mutations - (flippedAt ?? 0);

  // The bound is absolute rather than scaled, because the two behaviours differ in kind:
  // disclosing is ONE mutation, whereas continuing to type is one mutation per remaining
  // character. Measuring from the in-page flip rather than from before the CDP call keeps
  // this independent of how loaded the machine is.
  expect(mutationsAfterToggle).toBeLessThanOrEqual(2);
});

// The control. Without it, `mutations === 1` would also pass if the reveal were broken
// outright or the observer never attached — this proves the measurement distinguishes the
// two states rather than always reporting "instant".
test('with motion allowed it still types character by character', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installRevealObserver(page, BASELINE_TEST_ID, '__fullMotionTiming');
  await gotoHydrated(page, '/components/typewriter-text');

  await expect(page.locator(`[data-pw="${BASELINE_TEST_ID}"]`)).toHaveText(BASELINE_TEXT);

  const { mutations, elapsedMs } = await readTiming(page, '__fullMotionTiming');

  expect(mutations).toBeGreaterThan(BASELINE_TEXT.length / 2);
  expect(elapsedMs).toBeGreaterThan(200);
});
