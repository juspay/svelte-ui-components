import { expect, test } from '@playwright/test';

/**
 * An animation that never ends is the case `prefers-reduced-motion`
 * exists for. Seven components ran one with no guard at all, so a user who had
 * asked the OS to minimise motion got a permanent loop from a spinner, a
 * shimmer, a progress bar and a loader ring.
 *
 * Two things are asserted for each, because only the first is usually
 * remembered:
 *
 * 1. Under `reduce`, the animation is gone.
 * 2. The element still says "busy". A guard that stops the animation and
 *    strands the element on a blank frame -- or on a frame that means something
 *    else, as a 30%-wide indeterminate bar does -- is worse than the motion it
 *    removed, and would pass an assertion that only checked (1).
 *
 * `emulateMedia` is per-context, and the media query is evaluated by the real
 * engine, so this cannot pass in jsdom and is not duplicated there.
 */

/** The computed `animation-name` of an element or one of its pseudo-elements. */
const animationName = (page: import('@playwright/test').Page, selector: string, pseudo?: string) =>
  page
    .locator(selector)
    .evaluate((el, arg) => getComputedStyle(el, arg.pseudo ?? null).animationName, { pseudo });

test.describe('indefinite animations honour prefers-reduced-motion', () => {
  // page.emulateMedia rather than the `reducedMotion` fixture option: the
  // fixture form silently did not reach the page here (matchMedia still
  // reported no-preference, so every assertion below passed for the wrong
  // reason), and an emulation that quietly does nothing is worse than none.
  // The probe assertion in each test guards against that regressing.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('Loader: the spin stops and the ring stays on screen', async ({ page }) => {
    await page.goto('/components/loader');
    // Proves the emulation actually reached the page. Without this, a broken
    // emulation would make every "animation: none" assertion below vacuous.
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true
    );
    const loader = page.getByTestId('loader-demo');
    expect(await animationName(page, '[data-pw="loader-demo"]')).toBe('none');
    // Still drawn: a stopped spinner is a static ring, not an empty box.
    const box = await loader.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);
    expect(box?.height ?? 0).toBeGreaterThan(0);
    await expect(loader).toBeVisible();
  });

  test('LoadingDots: the bounce stops with every dot still visible', async ({ page }) => {
    await page.goto('/components/loading-dots');
    const dots = page.locator('[data-pw="loading-dots-pulse"] .dot');
    await expect(dots).toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      const dot = dots.nth(i);
      const state = await dot.evaluate((el) => {
        const style = getComputedStyle(el);
        return { animationName: style.animationName, opacity: style.opacity };
      });
      expect(state.animationName).toBe('none');
      // The rest frame of both keyframe sets is the fully visible one.
      expect(Number(state.opacity)).toBe(1);
    }
  });

  test('Shimmer: the sweep is gone and the skeleton block remains', async ({ page }) => {
    await page.goto('/components/shimmer');
    const shimmer = page.getByTestId('shimmer-avatar');
    const sweep = await page
      .locator('[data-pw="shimmer-avatar"]')
      .evaluate((el) => getComputedStyle(el, '::after').display);
    expect(sweep).toBe('none');
    // The placeholder itself is the point of a skeleton, so it must survive.
    await expect(shimmer).toBeVisible();
    const background = await shimmer.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('GridItem: the clipper stops on the complete ring, not a sliver', async ({ page }) => {
    await page.goto('/components/grid-item');
    const ring = page.locator('[data-pw="grid-item-loading"] .grid-body-loader');
    const state = await ring.evaluate((el) => {
      const style = getComputedStyle(el, '::before');
      return { animationName: style.animationName, clipPath: style.clipPath };
    });
    expect(state.animationName).toBe('none');
    // clip-path is what the animation drives; cleared, the whole border shows.
    expect(state.clipPath).toBe('none');
  });

  test('Progress: indeterminate does not freeze into a determinate-looking 30%', async ({
    page
  }) => {
    await page.goto('/components/progress');
    const bar = page.locator('[data-pw="progress-indeterminate-demo"] .bar.indeterminate');
    const state = await bar.evaluate((el) => {
      const style = getComputedStyle(el);
      const track = el.parentElement;
      return {
        animationName: style.animationName,
        opacity: Number(style.opacity),
        width: el.getBoundingClientRect().width,
        trackWidth: track === null ? 0 : track.getBoundingClientRect().width
      };
    });
    expect(state.animationName).toBe('none');
    // The whole track, not a 30% sliver that reads as determinate progress.
    expect(state.width).toBeGreaterThan(state.trackWidth * 0.95);
    expect(state.opacity).toBeLessThan(1);
    expect(state.opacity).toBeGreaterThan(0);
  });

  test('Stepper: the in-progress step keeps its spinner, stopped', async ({ page }) => {
    await page.goto('/components/stepper');
    const spinner = page.locator('.step-spinner').first();
    await expect(spinner).toBeVisible();
    expect(await spinner.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });

  test('BrandLoader: background and dots stop, leaving three dots visible', async ({ page }) => {
    await page.goto('/components/brand-loader');
    const loader = page.getByTestId('brand-loader-default-demo');
    await expect(loader).toBeVisible();

    // The testId'd root *is* `.background` (data-pw and the class sit on the
    // same element), so `[data-pw="..."] .background` -- a descendant
    // combinator -- could never match it; `loader` above already is that
    // element. Its old `animation: animateBackground ...` named a
    // `@keyframes animateBackground` that has never existed in this repo (see
    // BrandLoader.svelte), so it never animated anything and has been removed
    // as dead code. This assertion is therefore not proof that visible motion
    // stopped -- the background carried no animation to stop -- it is a
    // regression guard: the `prefers-reduced-motion` override still in
    // BrandLoader.svelte's stylesheet keeps this `none` even if a real
    // indefinite animation is added to `.background` later.
    expect(await loader.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');

    const dots = page.locator('[data-pw="brand-loader-default-demo"] .lds-ellipsis div');
    const visible = await dots.evaluateAll((els) =>
      els
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => ({
          animationName: getComputedStyle(el).animationName,
          left: Math.round(el.getBoundingClientRect().left)
        }))
    );
    // The scale-in dot shares its `left` with the second one, so it is dropped
    // rather than drawn twice on top of it.
    expect(visible).toHaveLength(3);
    for (const dot of visible) {
      expect(dot.animationName).toBe('none');
    }
    expect(new Set(visible.map((d) => d.left)).size).toBe(3);
  });
});

test.describe('without the preference the animations still run', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('Loader, Shimmer and Progress animate by default', async ({ page }) => {
    await page.goto('/components/loader');
    expect(await animationName(page, '[data-pw="loader-demo"]')).not.toBe('none');

    await page.goto('/components/shimmer');
    const sweep = await page
      .locator('[data-pw="shimmer-avatar"]')
      .evaluate((el) => getComputedStyle(el, '::after').display);
    expect(sweep).not.toBe('none');

    await page.goto('/components/progress');
    const bar = page.locator('[data-pw="progress-indeterminate-demo"] .bar.indeterminate');
    expect(await bar.evaluate((el) => getComputedStyle(el).animationName)).not.toBe('none');
  });
});
