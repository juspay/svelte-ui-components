import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Covers `resolveDelay`, added to TypewriterText for BZ-5721/F71: a fully custom,
// per-character pacing function that receives enough state (character index, running
// word count) to express a cadence that depends on POSITION, not just character class —
// something the pre-existing `variableDelay` cannot do, since it re-evaluates from
// scratch per character with no memory of where typing currently is.
//
// Every timing assertion here measures from the FIRST character mutation to the LAST,
// via a MutationObserver installed by addInitScript before navigation — never from an
// expect() poll — matching this component's existing pacing test's established pattern.

type TypewriterTiming = { firstAt: number | null; lastAt: number | null };

const installTimingObserver = async (
  page: Page,
  testId: string,
  windowKey: string
): Promise<void> => {
  await page.addInitScript(
    ({ testId, windowKey }: { testId: string; windowKey: string }) => {
      const timing: TypewriterTiming = { firstAt: null, lastAt: null };
      (window as unknown as Record<string, TypewriterTiming>)[windowKey] = timing;
      let attached = false;
      const attach = () => {
        if (attached) {
          return;
        }
        const element = document.querySelector(`[data-pw="${testId}"]`);
        if (!element) {
          return;
        }
        attached = true;
        mountObserver.disconnect();
        new MutationObserver(() => {
          if ((element.textContent || '').length === 0) {
            return;
          }
          if (timing.firstAt === null) {
            timing.firstAt = performance.now();
          }
          timing.lastAt = performance.now();
        }).observe(element, { childList: true, subtree: true, characterData: true });
      };
      const mountObserver = new MutationObserver(attach);
      mountObserver.observe(document, { childList: true, subtree: true });
      attach();
    },
    { testId, windowKey }
  );
};

const readElapsedMs = async (page: Page, windowKey: string): Promise<number> => {
  return page.evaluate((key: string) => {
    const timing = (window as unknown as Record<string, TypewriterTiming>)[key];
    return timing && timing.firstAt !== null && timing.lastAt !== null
      ? Math.round(timing.lastAt - timing.firstAt)
      : -1;
  }, windowKey);
};

test.describe('TypewriterText — resolveDelay', () => {
  test.beforeEach(async ({ page }) => {
    // Virtual timer/performance time measures the component scheduler, not CPU
    // contention. Native component DOM mutations and all original bounds remain.
    await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  });
  test('resolveDelay receives character, index and wordCount in the guaranteed order', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/typewriter-text');
    await page.clock.runFor(6000);

    const host = page.getByTestId('typewriter-resolve-delay-cyclical');
    await expect(host).toBeVisible();
    await expect(host).toHaveText('a1 b2, c d e f', { timeout: 6000 });

    const log = page.getByTestId('typewriter-resolve-delay-log');
    const callLog: unknown = JSON.parse((await log.textContent()) ?? '[]');

    // wordCount counts only whitespace, and is updated for a whitespace character
    // BEFORE that same character's own delay is resolved — every ' ' entry below
    // already reflects itself in wordCount. This proves the ordering guarantee
    // `TypewriterDelayContext` documents holds, directly, without inferring it from
    // timing the way F71's refused workaround (swapping `variableDelay` from inside
    // `onProgress`) had to.
    expect(callLog).toEqual([
      { character: 'a', index: 0, wordCount: 0 },
      { character: '1', index: 1, wordCount: 0 },
      { character: ' ', index: 2, wordCount: 1 },
      { character: 'b', index: 3, wordCount: 1 },
      { character: '2', index: 4, wordCount: 1 },
      { character: ',', index: 5, wordCount: 1 },
      { character: ' ', index: 6, wordCount: 2 },
      { character: 'c', index: 7, wordCount: 2 },
      { character: ' ', index: 8, wordCount: 3 },
      { character: 'd', index: 9, wordCount: 3 },
      { character: ' ', index: 10, wordCount: 4 },
      { character: 'e', index: 11, wordCount: 4 },
      { character: ' ', index: 12, wordCount: 5 },
      { character: 'f', index: 13, wordCount: 5 }
    ]);
  });

  test('resolveDelay actually governs pacing — a cyclical window collapses whitespace/default to a flat fast delay, digits stay slow throughout', async ({
    page
  }) => {
    await installTimingObserver(page, 'typewriter-resolve-delay-cyclical', '__cyclicalTiming');
    await gotoHydrated(page, '/components/typewriter-text');
    await page.clock.runFor(1400);

    const host = page.getByTestId('typewriter-resolve-delay-cyclical');
    await expect(host).toBeVisible();
    await expect(host).toHaveText('a1 b2, c d e f', { timeout: 6000 });
    const elapsedMs = await readElapsedMs(page, '__cyclicalTiming');

    // Fixed (non-random) delays make this exact: 20+120+60+20+120+90+60+20+10+10+60+20+60
    // = 670ms across the 13 inter-character transitions the observer can see (the 14th
    // character's own resolved delay schedules a timeout past the end of the string, so
    // it never produces a further mutation). If resolveDelay were silently ignored, this
    // demo (no `variableDelay` set, default `speed`) would fall back to the flat 15ms
    // default and finish in ~195ms (13 * 15ms) — 450 clears that false-negative floor
    // with a wide margin, and 1400 leaves headroom for CI jitter without masking a
    // regression that made every character flat-fast (e.g. the cycle check winning even
    // for digits).
    expect(elapsedMs).toBeGreaterThan(450);
    expect(elapsedMs).toBeLessThan(1400);
  });

  test('resolveDelay takes priority over variableDelay when both are set', async ({ page }) => {
    await installTimingObserver(page, 'typewriter-resolve-delay-priority', '__priorityTiming');
    await gotoHydrated(page, '/components/typewriter-text');
    await page.clock.runFor(300);

    const host = page.getByTestId('typewriter-resolve-delay-priority');
    await expect(host).toBeVisible();
    await expect(host).toHaveText('Total: 4 items, $9!', { timeout: 6000 });
    const elapsedMs = await readElapsedMs(page, '__priorityTiming');

    // This demo's resolveDelay always returns a flat 2ms regardless of character:
    // 19 transitions * 2ms = 38ms. Its variableDelay (5-200ms per class, the same
    // config as the plain variableDelay demo elsewhere on this page, which alone
    // measures ~641ms for this exact string) would need several hundred ms if it were
    // still in control instead — so this upper bound only passes when resolveDelay
    // actually won the priority described in its properties.ts doc comment.
    expect(elapsedMs).toBeGreaterThan(10);
    expect(elapsedMs).toBeLessThan(300);
  });

  test('omitting resolveDelay leaves variableDelay/speed pacing exactly as before', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/typewriter-text');
    await page.clock.runFor(6000);

    // Neither of these pre-existing demos ever sets resolveDelay — proving that adding
    // the prop, and the new branch it takes in `resolveTypingDelay`, left the
    // `variableDelay`/`speed` path those demos exercise unaffected.
    const baselineHost = page.getByTestId('typewriter-default-pacing');
    await expect(baselineHost).toBeVisible();
    await expect(baselineHost).toHaveText('Baseline pacing check text stays fast.', {
      timeout: 5000
    });

    const variableDelayHost = page.getByTestId('typewriter-variable-delay');
    await expect(variableDelayHost).toBeVisible();
    await expect(variableDelayHost).toHaveText('Total: 4 items, $9!', { timeout: 6000 });
  });
});
