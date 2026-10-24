import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

const answer =
  'Refunds are down 12% this month. Card refunds cleared fastest, UPI refunds took a median of 2.1 days, and three orders are still awaiting gateway confirmation.';

type RevealObservation = { prefixes: string[]; historicPrefixes: string[] };

const observeInitialStream = async (page: Page, theme: 'light' | 'dark'): Promise<void> => {
  await page.addInitScript((value) => {
    localStorage.setItem('theme-preference', value);
    const observation: RevealObservation = { prefixes: [], historicPrefixes: [] };
    (window as unknown as Record<string, RevealObservation>).__initialStream = observation;
    new MutationObserver(() => {
      const element = document.querySelector('.demo-row .typewriter-text');
      const prefix = element?.textContent ?? '';
      if (prefix.length > 0 && observation.prefixes.at(-1) !== prefix) {
        observation.prefixes.push(prefix);
      }
      const historic = document.querySelectorAll('.demo-row .typewriter-text')[1];
      const historicPrefix = historic?.textContent ?? '';
      if (historicPrefix.length > 0 && observation.historicPrefixes.at(-1) !== historicPrefix) {
        observation.historicPrefixes.push(historicPrefix);
      }
    }).observe(document, { childList: true, subtree: true, characterData: true });
  }, theme);
};

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 }
]) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`initial stream ${viewport.width}px ${theme}`, () => {
      test.use({ viewport, colorScheme: theme });

      test('starts with one character while historic text is immediately complete', async ({
        page
      }, testInfo) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await observeInitialStream(page, theme);
        await gotoHydrated(page, '/components/typewriter-text');
        const text = page.locator('.demo-row .typewriter-text');
        await expect(text.nth(1)).toHaveText(answer);
        await expect(text.first()).toHaveText(answer);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const observation = await page.evaluate(
          () => (window as unknown as Record<string, RevealObservation>).__initialStream
        );
        expect(observation.prefixes[0]).toBe(answer.slice(0, 1));
        expect(observation.historicPrefixes).toEqual([answer]);
        expect(observation.prefixes.length).toBeGreaterThan(1);
        expect(observation.prefixes.every((prefix) => answer.startsWith(prefix))).toBe(true);
        await page.screenshot({ path: testInfo.outputPath('initial-stream.png'), fullPage: true });
      });

      test('discloses the initially nonempty stream at once with reduced motion', async ({
        page
      }, testInfo) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await observeInitialStream(page, theme);
        await gotoHydrated(page, '/components/typewriter-text');
        await expect(page.locator('.demo-row .typewriter-text').first()).toHaveText(answer);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const observation = await page.evaluate(
          () => (window as unknown as Record<string, RevealObservation>).__initialStream
        );
        expect(observation.prefixes).toEqual([answer]);
        await page.screenshot({
          path: testInfo.outputPath('initial-reduced-motion.png'),
          fullPage: true
        });
      });
    });
  }
}
