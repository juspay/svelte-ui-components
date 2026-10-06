import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { measurePaintContrast, type PaintContrast } from './support/rendered-contrast';
import { installThinkingClock, releaseHeldTimeouts } from './support/thinking-clock';

/*
 * ThinkingIndicator text must read at 4.5:1 in what is actually PAINTED, in every
 * engine, in both themes, at every sampled phase of the shimmer.
 *
 * Why pixels and not tokens: the live label is `background-clip: text` over a
 * gradient, so the colour a reader sees is whatever the gradient holds under each
 * glyph at that instant. The audit measured 1.88:1 at one phase of the light-theme
 * label and 2.1:1 on the dark chip while every style token looked plausible, and
 * `pnpm run check:contrast` quarantines gradient text as INDETERMINATE rather than
 * scoring it. tests/support/rendered-contrast.ts pauses the shimmer through the
 * Web Animations API at evenly spaced phases and scores real paired captures.
 *
 * Reduced motion is its own describe: there the label must fall back to flat ink.
 */

const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];
const REQUIRED = 4.5;

const setTheme = async (page: Page, theme: Theme): Promise<void> => {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; caret-color: transparent !important; }'
  });
  await page.evaluate(() => document.fonts.ready);
};

/** Waits for finite entrance animations (row fade-up, caption fade-in); infinite ones never finish. */
const finishEntranceAnimations = async (page: Page): Promise<void> => {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
        .map((animation) => animation.finished.catch(() => null))
    )
  );
};

const report = async (testInfo: TestInfo, name: string, measured: PaintContrast): Promise<void> => {
  const worst = measured.samples.reduce((a, b) => (b.p1 < a.p1 ? b : a));
  await testInfo.attach(`${name}-worst-ink.png`, {
    body: measured.evidence.ink,
    contentType: 'image/png'
  });
  await testInfo.attach(`${name}-worst-paint.png`, {
    body: measured.evidence.paint,
    contentType: 'image/png'
  });
  await testInfo.attach(`${name}-ratios.json`, {
    body: JSON.stringify(
      {
        threshold: measured.threshold,
        worstPhase: worst.phase,
        glyphPixels: measured.glyphPixels,
        animated: measured.animated,
        p1: measured.p1,
        min: measured.min,
        samples: measured.samples
      },
      null,
      2
    ),
    contentType: 'application/json'
  });
};

const expectReadable = async (
  page: Page,
  testInfo: TestInfo,
  name: string,
  target: Locator
): Promise<PaintContrast> => {
  await expect(target).toBeVisible();
  const measured = await measurePaintContrast(page, target);
  await report(testInfo, name, measured);
  const worst = measured.samples.reduce((a, b) => (b.p1 < a.p1 ? b : a));
  expect(
    measured.p1,
    `${name}: worst phase ${String(worst.phase)} paints ${worst.worstPaint.join(',')} on ${worst.worstBackdrop.join(',')} ` +
      `(${measured.p1}:1 at the 1st percentile, ${measured.min}:1 at the worst pixel, ` +
      `${(worst.fractionBelow * 100).toFixed(1)}% of glyph pixels under ${REQUIRED}:1)`
  ).toBeGreaterThanOrEqual(REQUIRED);
  return measured;
};

/** Labels on the ThinkingIndicator example route, by what the reader is looking at. */
const showcase = {
  'busy status line': (page: Page): Locator => page.locator('.status-host .status-label').first(),
  'bare label (inside a bubble)': (page: Page): Locator =>
    page.locator('span.status-label').filter({ hasText: 'Analyzing your storefront' }),
  'settled disclosure label': (page: Page): Locator =>
    page.locator('.status-label.static-label').filter({ hasText: 'Thought for 6 seconds' }),
  'chip, busy shimmer': (page: Page): Locator =>
    page.getByTestId('thinking-indicator-chip-busy-demo').locator('.chip-label'),
  'chip, static': (page: Page): Locator =>
    page.getByTestId('thinking-indicator-chip-static-demo').locator('.chip-label'),
  'elapsed counter': (page: Page): Locator =>
    page.getByTestId('thinking-indicator-elapsed-demo-elapsed'),
  'busy trace label': (page: Page): Locator =>
    page.getByTestId('thinking-indicator-trace-demo-toggle').locator('.status-label'),
  'settled history label': (page: Page): Locator =>
    page.getByTestId('thinking-indicator-trace-history-toggle').locator('.status-label')
} as const;

test.describe('ThinkingIndicator rendered text contrast', () => {
  // Hold the demos' own long timers so the busy phases being measured stay busy for as
  // long as a multi-phase capture takes, instead of racing a 3.2s page timer.
  test.beforeEach(async ({ page }) => {
    await installThinkingClock(page, { holdTimeoutsMs: 500 });
  });
  test.setTimeout(90_000);

  for (const theme of THEMES) {
    for (const [name, locate] of Object.entries(showcase)) {
      test(`${name} reaches ${REQUIRED}:1 in the ${theme} theme`, async ({ page }, testInfo) => {
        await gotoHydrated(page, '/components/thinking-indicator');
        await setTheme(page, theme);
        await expectReadable(page, testInfo, `${theme}-${name}`, locate(page));
      });
    }
  }

  for (const theme of THEMES) {
    test(`every trace kind keeps its prose, source, diff and caption text readable (${theme})`, async ({
      page
    }, testInfo) => {
      await gotoHydrated(page, '/components/thinking-indicator');
      await setTheme(page, theme);

      const host = page.locator('.trace-host').filter({
        has: page.getByTestId('thinking-indicator-trace-demo')
      });
      for (const kind of ['reasoning', 'search', 'coding'] as const) {
        await page.getByTestId(`thinking-indicator-trace-kind-${kind}`).click();
        // Let the held wave timers fire so rows and the settled caption exist.
        for (let pass = 0; pass < 6; pass += 1) {
          await releaseHeldTimeouts(page);
          await page.waitForTimeout(120);
        }
        const toggle = page.getByTestId('thinking-indicator-trace-demo-toggle');
        if ((await toggle.getAttribute('aria-expanded')) === 'false') {
          await toggle.click();
        }
        await expect(host.locator('.trace-row').first()).toBeVisible();
        // Entrance animations (fade-up, fade-in) must have finished before pixels count.
        await finishEntranceAnimations(page);

        const text = host.locator(
          '.trace-row.prose, .row-primary, .row-secondary, .trace-more, .row-diffstat .added, .row-diffstat .removed, .trace-query-wrap'
        );
        const count = await text.count();
        expect(count, `${kind}: expected rendered trace text`).toBeGreaterThan(0);
        for (let index = 0; index < count; index += 1) {
          const node = text.nth(index);
          if (!(await node.isVisible())) {
            continue;
          }
          const label = (await node.textContent())?.trim().slice(0, 28) ?? String(index);
          await expectReadable(page, testInfo, `${theme}-${kind}-${index}-${label}`, node);
        }
      }
    });
  }

  test('the shimmer is still a shimmer: running animation, two distinct gradient endpoints', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/thinking-indicator');
    for (const theme of THEMES) {
      await setTheme(page, theme);
      for (const target of [
        showcase['busy status line'](page),
        showcase['chip, busy shimmer'](page)
      ]) {
        const facts = await target.evaluate((element) => {
          const style = getComputedStyle(element);
          const colours = style.backgroundImage.match(/rgba?\([^)]+\)/g) ?? [];
          return {
            running: element
              .getAnimations()
              .some(
                (animation) =>
                  /shimmer/.test((animation as CSSAnimation).animationName) &&
                  animation.playState === 'running'
              ),
            distinct: new Set(colours).size,
            clipped: (
              style.getPropertyValue('-webkit-background-clip') || style.backgroundClip
            ).includes('text')
          };
        });
        expect(facts.running, `${theme}: shimmer animation must keep running`).toBe(true);
        expect(facts.clipped, `${theme}: label stays clipped to its glyphs`).toBe(true);
        expect(
          facts.distinct,
          `${theme}: gradient must keep a visible sweep (base and highlight differ)`
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

test.describe('ThinkingIndicator static labels', () => {
  test('a settled or static label paints flat ink, with no gradient layer under it', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/thinking-indicator');
    for (const theme of THEMES) {
      await setTheme(page, theme);
      for (const target of [
        showcase['settled disclosure label'](page),
        showcase['chip, static'](page),
        showcase['settled history label'](page)
      ]) {
        const facts = await target.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            image: style.backgroundImage,
            animated: element.getAnimations().length > 0
          };
        });
        expect(facts.image, `${theme}: no leftover shimmer gradient on a static label`).toBe(
          'none'
        );
        expect(facts.animated, `${theme}: a static label does not animate`).toBe(false);
      }
    }
  });
});

test.describe('ThinkingIndicator composed in Chat, ChatMessage and ChatCompositions', () => {
  test.setTimeout(90_000);

  for (const theme of THEMES) {
    test(`ChatMessage and ChatCompositions settled traces are readable (${theme})`, async ({
      page
    }, testInfo) => {
      await gotoHydrated(page, '/components/chat-message');
      await setTheme(page, theme);
      await expectReadable(
        page,
        testInfo,
        `${theme}-chat-message`,
        page.getByTestId('chat-message-settled-trace-toggle').locator('.status-label')
      );

      await gotoHydrated(page, '/components/chat-compositions');
      await setTheme(page, theme);
      await expectReadable(
        page,
        testInfo,
        `${theme}-chat-compositions`,
        page.getByTestId('chat-compositions-trace-toggle').locator('.status-label')
      );
    });

    test(`Chat: busy turn label, settled label and the +N more caption are readable (${theme})`, async ({
      page
    }, testInfo) => {
      await installThinkingClock(page, { holdTimeoutsMs: 500 });
      await gotoHydrated(page, '/components/chat');
      await setTheme(page, theme);

      const label = page.getByTestId('chat-turn-trace-toggle').locator('.status-label');
      await expect(label).toHaveText('Searching the web');
      await expectReadable(page, testInfo, `${theme}-chat-busy`, label);

      for (let pass = 0; pass < 10; pass += 1) {
        await releaseHeldTimeouts(page);
        await page.waitForTimeout(150);
      }
      await expect(label).toHaveText(/^Searched \d+ sources$/);
      await expectReadable(page, testInfo, `${theme}-chat-settled`, label);

      const toggle = page.getByTestId('chat-turn-trace-toggle');
      if ((await toggle.getAttribute('aria-expanded')) === 'false') {
        await toggle.click();
      }
      const more = page.locator('.trace-more').first();
      await expect(more).toBeVisible();
      await finishEntranceAnimations(page);
      await expectReadable(page, testInfo, `${theme}-chat-more-caption`, more);
    });
  }
});

test.describe('ThinkingIndicator reduced motion', () => {
  test.setTimeout(90_000);
  // emulateMedia, not test.use({ reducedMotion }): in this config the fixture option is not
  // applied (measured: matchMedia('(prefers-reduced-motion: reduce)') stayed false), and a
  // reduced-motion test that silently runs with motion on would be a test of nothing.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  for (const theme of THEMES) {
    test(`labels fall back to flat ink that is readable (${theme})`, async ({ page }, testInfo) => {
      await installThinkingClock(page, { holdTimeoutsMs: 500 });
      await gotoHydrated(page, '/components/thinking-indicator');
      expect(
        await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
      ).toBe(true);
      await setTheme(page, theme);

      for (const name of [
        'busy status line',
        'chip, busy shimmer',
        'busy trace label',
        'settled disclosure label'
      ] as const) {
        const target = showcase[name](page);
        const measured = await expectReadable(page, testInfo, `reduced-${theme}-${name}`, target);
        expect(measured.animated, `${name}: no shimmer under reduced motion`).toBe(false);
      }
    });
  }
});
