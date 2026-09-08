import { expect, test, type Page } from '@playwright/test';

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

type RevealTiming = { firstAt: number | null; lastAt: number | null; mutations: number };

const installRevealObserver = async (
  page: Page,
  testId: string,
  windowKey: string
): Promise<void> => {
  await page.addInitScript(
    ({ testId, windowKey }: { testId: string; windowKey: string }) => {
      const timing: RevealTiming = { firstAt: null, lastAt: null, mutations: 0 };
      (window as unknown as Record<string, RevealTiming>)[windowKey] = timing;
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
): Promise<{ mutations: number; elapsedMs: number }> => {
  return page.evaluate((key: string) => {
    const timing = (window as unknown as Record<string, RevealTiming>)[key];
    const elapsedMs =
      timing && timing.firstAt !== null && timing.lastAt !== null
        ? Math.round(timing.lastAt - timing.firstAt)
        : -1;
    return { mutations: timing ? timing.mutations : -1, elapsedMs };
  }, windowKey);
};

test('reduced motion reveals the whole string at once instead of typing it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installRevealObserver(page, BASELINE_TEST_ID, '__reducedMotionTiming');
  await page.goto('/components/typewriter-text');

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
  await page.goto('/components/typewriter-text');

  const typewriter = page.locator(`[data-pw="${PROGRESS_TEST_ID}"]`);

  // Catch it as early as possible: the default poll cadence lets ~57 of the 74 characters
  // type before it first reports, which leaves too little to distinguish the two behaviours.
  await expect
    .poll(async () => ((await typewriter.textContent()) ?? '').length, { intervals: [10] })
    .toBeGreaterThan(0);

  const revealedAtToggle = ((await typewriter.textContent()) ?? '').length;
  const remaining = PROGRESS_TEXT.length - revealedAtToggle;

  // The toggle has to land with more left to type than the bound below, or the assertion
  // would pass for the wrong reason. Fail loudly here instead of silently proving nothing.
  expect(remaining).toBeGreaterThan(12);

  const mutationsAtToggle = (await readTiming(page, '__midStreamTiming')).mutations;

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(typewriter).toHaveText(PROGRESS_TEXT);

  const mutationsAfterToggle =
    (await readTiming(page, '__midStreamTiming')).mutations - mutationsAtToggle;

  // The bound is absolute rather than scaled, because the two behaviours differ in kind:
  // disclosing is ONE mutation plus however many characters type during the CDP round-trip
  // while the emulation lands — a small constant, independent of how much text was left —
  // whereas continuing to type is one mutation per remaining character.
  expect(mutationsAfterToggle).toBeLessThanOrEqual(6);
});

// The control. Without it, `mutations === 1` would also pass if the reveal were broken
// outright or the observer never attached — this proves the measurement distinguishes the
// two states rather than always reporting "instant".
test('with motion allowed it still types character by character', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installRevealObserver(page, BASELINE_TEST_ID, '__fullMotionTiming');
  await page.goto('/components/typewriter-text');

  await expect(page.locator(`[data-pw="${BASELINE_TEST_ID}"]`)).toHaveText(BASELINE_TEXT);

  const { mutations, elapsedMs } = await readTiming(page, '__fullMotionTiming');

  expect(mutations).toBeGreaterThan(BASELINE_TEXT.length / 2);
  expect(elapsedMs).toBeGreaterThan(200);
});
