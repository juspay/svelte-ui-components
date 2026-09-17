import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * The companion to reduced-motion-indefinite.spec.ts, which covers animations
 * with no natural end. This one covers finite CSS transitions, and exists
 * because DESIGN_PRINCIPLES.md section 1's reasoning about them has a hole.
 *
 * It argues a finite transition needs no `@media (prefers-reduced-motion: reduce)`
 * block of its own, since a consumer can collapse it with `--motion-duration: 0s`
 * and -- unlike an indefinite animation, which lands on its 0% keyframe -- it
 * settles on its END frame. Both halves are true. What is missing is that nothing
 * in this library ever ASSIGNS `--motion-duration`: it exists purely as the middle
 * rung of a fallback chain for a consumer to reach. So for a component whose only
 * guard was that token, the OS preference did nothing at all.
 *
 * `page.emulateMedia()` rather than `test.use({ reducedMotion })`, which was
 * verified not to reach matchMedia under this repo's config and silently passes
 * for the wrong reason -- same rationale as typewriter-text-reduced-motion.test.ts.
 */

const transitionOf = (selector: string) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'SELECTOR NOT FOUND';
  const s = getComputedStyle(el);
  return s.transitionProperty + ' / ' + s.transitionDuration;
})()`;

/*
 * A component whose motion is not a CSS transition still has to answer the
 * preference, and has to do it in CSS for the same reason the others do: the
 * component's own <style> is the only sheet that reaches inside the shadow root
 * a custom-element consumer gets. AnimatedNumber resolves the two-token chain
 * into one custom property and its script reads that back before deciding
 * whether to animate at all, so the property IS the duration here, and
 * collapsing it is the same guard by a different route.
 */
const customDurationOf = (selector: string, property: string) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return 'SELECTOR NOT FOUND';
  return getComputedStyle(el).getPropertyValue(${JSON.stringify(property)}).trim();
})()`;

type Case = {
  readonly route: string;
  readonly selector: string;
  readonly moves: string;
  /** Set when the motion is driven by a scalar rather than a `transition`. */
  readonly durationProperty?: string;
};

const SILENCED: readonly Case[] = [
  // The expand/collapse is a real size change.
  { route: 'accordion', selector: '.accordion', moves: 'grid-template-rows' },
  // The slide between items is the component's motion.
  { route: 'carousel', selector: '.slidesDiv', moves: 'transform' },
  // AnimatedNumber's digit roll. Not a transition: the wheel position is
  // recomputed from an interpolated custom property, so the duration the script
  // reads is what has to go to zero.
  {
    route: 'animated-number',
    selector: '.animated-number-digit',
    moves: '--_animated-number-spin-duration',
    durationProperty: '--_animated-number-spin-duration'
  }
];

test.describe('finite transitions honour prefers-reduced-motion', () => {
  for (const { route, selector, moves, durationProperty } of SILENCED) {
    test(`${route}: ${selector} stops moving under the preference`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await gotoHydrated(page, `/components/${route}`);

      // The premise of the assertion below; prove it landed rather than trusting it.
      expect(
        await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ).toBe(true);

      if (durationProperty) {
        expect(await page.evaluate(customDurationOf(selector, durationProperty))).toBe('0s');
      } else {
        expect(await page.evaluate(transitionOf(selector))).toBe('none / 0s');
      }
    });

    test(`${route}: ${selector} still transitions ${moves} without the preference`, async ({
      page
    }) => {
      // The control. Without it a component that simply never transitioned would
      // pass the test above, and the guard it is meant to prove would be untested.
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await gotoHydrated(page, `/components/${route}`);

      if (durationProperty) {
        const duration = await page.evaluate(customDurationOf(selector, durationProperty));
        expect(duration).not.toBe('0s');
        expect(duration).toMatch(/^[\d.]+m?s$/);
        return;
      }

      const value = await page.evaluate(transitionOf(selector));
      expect(value).toContain(moves);
      expect(value).not.toBe('none / 0s');
    });
  }

  test('a colour-only transition is deliberately left alone', async ({ page }) => {
    // Carousel's dots transition `background` to show which slide is active.
    // That is feedback, not movement, and the preference does not ask for it to
    // go away -- so silencing it would be a regression, not extra safety.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/carousel');

    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ).toBe(true);
    expect(await page.evaluate(transitionOf('.dot'))).toContain('background');
  });
});
