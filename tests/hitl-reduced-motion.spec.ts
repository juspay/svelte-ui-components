import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * HITL.svelte carries its own explicit `@media (prefers-reduced-motion: reduce)`
 * block for its two entrance animations (a slide-in on the card itself, a
 * fade-in on the completion state) -- unlike most of this library's finite
 * motion, which relies on `--motion-duration` alone (see
 * reduced-motion-finite.spec.ts's header comment for why that chain alone does
 * nothing: nothing in this library ever assigns the token). HITL's own block
 * targeted `.hitl-container` and `.hitl-completion`, neither of which is a
 * class this component ever renders -- the root is `.hitl`, the completion
 * state is `.completion` -- so the block matched nothing and the preference
 * was silently ignored for both animations.
 *
 * `page.emulateMedia()` rather than `test.use({ reducedMotion })`, verified not
 * to reach matchMedia under this repo's config -- same rationale as
 * typewriter-text-reduced-motion.test.ts and reduced-motion-finite.spec.ts.
 */

const animationOf = (selector: string) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'SELECTOR NOT FOUND';
  const s = getComputedStyle(el);
  return s.animationName + ' / ' + s.animationDuration;
})()`;

test.describe('HITL honours prefers-reduced-motion for both entrance animations', () => {
  test('the card itself (.hitl) does not animate under the preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/hitl');

    // The premise of the assertion below; prove it landed rather than trusting it.
    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ).toBe(true);
    expect(await page.evaluate(animationOf('[data-pw="demo-confirmation"]'))).toBe('none / 0s');
  });

  test('the card still slides in without the preference', async ({ page }) => {
    // The control. Without it a card that simply never animated would pass the
    // test above, and the guard it is meant to prove would be untested.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoHydrated(page, '/components/hitl');

    const value = await page.evaluate(animationOf('[data-pw="demo-confirmation"]'));
    expect(value).toContain('hitl-slide-in');
    expect(value).not.toBe('none / 0s');
  });

  test('the completion state (.completion) does not animate under the preference', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/hitl');

    await page.click('[data-pw="demo-confirmation-confirm"]');
    await expect(page.locator('[data-pw="demo-confirmation-completion"]')).toBeVisible();
    expect(await page.evaluate(animationOf('[data-pw="demo-confirmation-completion"]'))).toBe(
      'none / 0s'
    );
  });

  test('the completion state still fades in without the preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoHydrated(page, '/components/hitl');

    await page.click('[data-pw="demo-confirmation-confirm"]');
    await expect(page.locator('[data-pw="demo-confirmation-completion"]')).toBeVisible();
    const value = await page.evaluate(animationOf('[data-pw="demo-confirmation-completion"]'));
    expect(value).toContain('hitl-fade-in');
    expect(value).not.toBe('none / 0s');
  });
});
