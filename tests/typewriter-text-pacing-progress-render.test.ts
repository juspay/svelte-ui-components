import { expect, test } from '@playwright/test';

// Covers three additive TypewriterText capabilities — none change behaviour
// for a consumer that doesn't opt in:
//   (a) variableDelay — per-character-class pacing instead of the flat `speed`
//   (b) onProgress — a callback fired as characters are revealed
//   (c) renderCharacter — a snippet that decorates each revealed character
//
// Every timing assertion here measures from the moment the FIRST character
// appears (not from page.goto), so navigation/hydration jitter never lands
// inside the measured window — only the component's own per-character pacing
// does.

test.describe('TypewriterText — variable pacing, progress, per-character render hook', () => {
  test('default pacing (no variableDelay) types at the flat `speed`, unchanged', async ({
    page
  }) => {
    await page.addInitScript(() => {
      const timing: TypewriterTiming = { firstAt: null, lastAt: null };
      (window as unknown as { __baselineTiming: TypewriterTiming }).__baselineTiming = timing;
      const attach = () => {
        const element = document.querySelector('[data-pw="typewriter-default-pacing"]');
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
        }).observe(element, { childList: true, subtree: true, characterData: true });
      };
      requestAnimationFrame(attach);
    });
    await page.goto('/components/typewriter-text');

    const baselineText = 'Baseline pacing check text stays fast.';
    const host = page.getByTestId('typewriter-default-pacing');
    await expect(host).toBeVisible();

    // Measured by an observer installed BEFORE navigation. Anchoring on
    // expect()'s ~100ms poll instead reports an elapsedMs of 1 on a busy
    // machine, which is indistinguishable from the very regression the lower
    // bound exists to catch (pacing collapsing to ~0).
    await expect(host).toHaveText(baselineText, { timeout: 5000 });
    const elapsedMs = await page.evaluate(() => {
      const timing = (window as unknown as { __baselineTiming?: TypewriterTiming })
        .__baselineTiming;
      return timing && timing.firstAt !== null && timing.lastAt !== null
        ? Math.round(timing.lastAt - timing.firstAt)
        : -1;
    });

    // (baselineText.length - 1) characters remained after the first one, at
    // the component's default 15ms/char => ~555ms. `startedAt` is captured
    // once the `not.toHaveText('')` assertion above resolves, not the instant
    // the first character actually rendered — Playwright's web-first-assertion
    // polling can notice the change a poll cycle late, so some characters may
    // already be typed by the time the clock starts (observed: an elapsedMs of
    // 185 under load, once, against an earlier 200ms floor). The lower bound
    // only needs to separate this from a regression that types near-instantly
    // (e.g. a duplicate-timer race, or `resolveTypingDelay` collapsing to ~0),
    // which finishes in single-digit-to-tens of ms — 60ms keeps that margin
    // while absorbing the polling slop. The upper bound still catches the
    // opposite regression — e.g. variableDelay's digit/punctuation branches
    // (120-200ms) leaking into the no-variableDelay path would blow well past it.
    // Measured 582-697ms across repeat runs, against a ~555ms target (37 characters
    // after the first, at the default 15ms). 300 sits far above the collapse-to-zero
    // signature this bound exists to catch and far below the observed floor. The old
    // 60 could not tell healthy pacing from a half-regression; it was that loose only
    // because the clock it guarded was anchored on a poll.
    expect(elapsedMs).toBeGreaterThan(300);
    expect(elapsedMs).toBeLessThan(2500);
  });

  type TypewriterTiming = { firstAt: number | null; lastAt: number | null };

  test('variableDelay paces digits, whitespace and punctuation independently of `speed`', async ({
    page
  }) => {
    await page.addInitScript(() => {
      const timing: TypewriterTiming = { firstAt: null, lastAt: null };
      (window as unknown as { __typewriterTiming: TypewriterTiming }).__typewriterTiming = timing;
      const attach = () => {
        const element = document.querySelector('[data-pw="typewriter-variable-delay"]');
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
        }).observe(element, { childList: true, subtree: true, characterData: true });
      };
      requestAnimationFrame(attach);
    });
    await page.goto('/components/typewriter-text');

    // "Total: 4 items, $9!" — 2 digits (200ms fixed), 3 spaces (10ms fixed),
    // 2 punctuation (120ms fixed), 12 default chars incl. ':' and '$' (5ms
    // fixed). Every range is min===max, so the total is deterministic:
    // 2*200 + 3*10 + 2*120 + 12*5 = 730ms.
    const variableDelayText = 'Total: 4 items, $9!';
    const host = page.getByTestId('typewriter-variable-delay');
    await expect(host).toBeVisible();

    // Timed INSIDE the page by an observer installed BEFORE navigation, so the window
    // cannot be clipped at either end. Anchoring on expect()'s ~100ms poll instead makes
    // the reading ambiguous: a late poll on a busy machine shrinks it to ~282ms, which is
    // indistinguishable from variableDelay being ignored (19 chars * the 15ms default =
    // 285ms). Attaching after `toBeVisible()` has the opposite failure — typing has often
    // already finished, and the window collapses toward zero.
    await expect(host).toHaveText(variableDelayText, { timeout: 6000 });
    const elapsedMs = await page.evaluate(() => {
      const timing = (window as unknown as { __typewriterTiming?: TypewriterTiming })
        .__typewriterTiming;
      return timing && timing.firstAt !== null && timing.lastAt !== null
        ? Math.round(timing.lastAt - timing.firstAt)
        : -1;
    });

    // If variableDelay were silently ignored, this demo (no `speed` prop set) would
    // fall back to the 15ms default and finish in ~270ms from the first character.
    // 450 clears that false-negative floor by a wide margin while sitting below the
    // 641ms this actually measures, so the bound catches the regression it exists for
    // without resting on how quickly a poll happened to fire.
    expect(elapsedMs).toBeGreaterThan(450);
    expect(elapsedMs).toBeLessThan(3000);
  });

  test('onProgress is called once per revealed character and reaches the total', async ({
    page
  }) => {
    await page.goto('/components/typewriter-text');

    const progressText =
      'Progress reporting keeps a scroll container pinned to the newest character.';
    const host = page.getByTestId('typewriter-progress-demo');
    await expect(host).toBeVisible();
    await expect(host).toHaveText(progressText, { timeout: 8000 });

    // If onProgress had fired only once (e.g. on completion) instead of once
    // per character, this would read 1, not the full character count.
    await expect(page.getByTestId('typewriter-progress-call-count')).toHaveText(
      String(progressText.length)
    );
    await expect(page.getByTestId('typewriter-progress-index')).toHaveText(
      String(progressText.length)
    );
    await expect(page.getByTestId('typewriter-progress-total')).toHaveText(
      String(progressText.length)
    );
  });

  test('renderCharacter decorates exactly the characters the snippet targets', async ({ page }) => {
    await page.goto('/components/typewriter-text');

    const host = page.getByTestId('typewriter-render-character');
    await expect(host).toBeVisible();
    // toHaveText compares textContent, so this also proves typing completed
    // even though every character now renders through the snippet.
    await expect(host).toHaveText('Order #482 shipped', { timeout: 5000 });

    // "Order #482 shipped" has exactly three digits — 4, 8, 2 — and the demo
    // snippet wraps only digits in a <strong data-pw="typewriter-digit-highlight">.
    const highlighted = host.getByTestId('typewriter-digit-highlight');
    await expect(highlighted).toHaveCount(3);
    await expect(highlighted).toHaveText(['4', '8', '2']);
    for (const tagName of await highlighted.evaluateAll((elements) =>
      elements.map((element) => element.tagName)
    )) {
      expect(tagName).toBe('STRONG');
    }
  });

  test('omitting onProgress and renderCharacter causes no runtime errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/components/typewriter-text');

    // These demos never pass onProgress/renderCharacter/variableDelay.
    await expect(page.getByTestId('typewriter-default-pacing')).toBeVisible();
    await expect(page.locator('.demo-row').first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
