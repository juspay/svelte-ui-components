import { expect, test } from '@playwright/test';

/**
 * DESIGN_PRINCIPLES.md's motion convention: every hardcoded transition/animation
 * duration and easing becomes a pair of CSS custom properties
 * (`--{component}-{element}-transition-duration` / `-transition-easing`, or the
 * `-animation-` equivalents for `animation:`), each falling back through a
 * library-wide `--motion-duration` / `--motion-easing` root token to the
 * component's existing literal value. This spec proves that contract for one
 * component per token shape the tokenization pass touched:
 *
 * - Carousel `.slidesDiv`   — a value with no existing token at all (new pair).
 * - BarChart `.bar`         — `--chart-transition-duration` existed alone
 *                             (duration-only shape); this adds its easing twin.
 * - TaskList `.task-row`    — `--task-list-ease` existed alone (easing-only
 *                             shape); this adds its duration twin.
 * - Toggle `.slider`        — `--toggle-slider-transition` existed as a whole
 *                             shorthand; this adds duration/easing halves
 *                             underneath it without touching the shorthand.
 *
 * Each case asserts two things: with no token set, the computed value equals
 * today's literal (byte-identical rendering); with the token set on an
 * ancestor, the computed value actually changes to match it.
 */

test.describe('motion tokens', () => {
  test('Carousel .slidesDiv: no token set renders the existing literal transition', async ({
    page
  }) => {
    await page.goto('/components/carousel');
    const track = page.locator('[data-pw="carousel-manual-demo"] .slidesDiv');
    const computed = await track.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    });
    expect(computed.duration).toBe('0.5s');
    expect(computed.easing).toBe('ease-in-out');
  });

  test('Carousel .slidesDiv: --carousel-track-transition-duration/-easing set on an ancestor change the computed transition', async ({
    page
  }) => {
    await page.goto('/components/carousel');
    await page.addStyleTag({
      content:
        '[data-pw="carousel-manual-demo"] { --carousel-track-transition-duration: 1.25s; --carousel-track-transition-easing: linear; }'
    });
    const track = page.locator('[data-pw="carousel-manual-demo"] .slidesDiv');
    const computed = await track.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    });
    expect(computed.duration).toBe('1.25s');
    expect(computed.easing).toBe('linear');
  });

  test('BarChart .bar: no token set renders the existing literal transition (duration-only alias kept, easing added)', async ({
    page
  }) => {
    await page.goto('/components/bar-chart');
    const bar = page.locator('[data-pw="bar-value-label-chart"] .bar').first();
    const computed = await bar.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    });
    expect(computed.duration).toBe('0.2s');
    expect(computed.easing).toBe('ease');
  });

  test('BarChart .bar: --chart-transition-duration/-easing set on an ancestor change the computed transition', async ({
    page
  }) => {
    await page.goto('/components/bar-chart');
    await page.addStyleTag({
      content:
        '[data-pw="bar-value-label-chart"] { --chart-transition-duration: 0.05s; --chart-transition-easing: linear; }'
    });
    const bar = page.locator('[data-pw="bar-value-label-chart"] .bar').first();
    const computed = await bar.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    });
    expect(computed.duration).toBe('0.05s');
    expect(computed.easing).toBe('linear');
  });

  test('TaskList .task-row: no token set renders the existing literal animation (easing-only alias kept, duration added)', async ({
    page
  }) => {
    await page.goto('/components/task-list');
    const row = page.locator('[data-pw="task-list-demo-row-0"]');
    const computed = await row.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.animationDuration, easing: style.animationTimingFunction };
    });
    expect(computed.duration).toBe('0.32s');
    expect(computed.easing).toBe('cubic-bezier(0.23, 1, 0.32, 1)');
  });

  test('TaskList .task-row: --task-list-row-animation-duration and the existing --task-list-ease set on an ancestor change the computed animation', async ({
    page
  }) => {
    await page.goto('/components/task-list');
    await page.addStyleTag({
      content:
        '[data-pw="task-list-demo"] { --task-list-row-animation-duration: 0.05s; --task-list-ease: linear; }'
    });
    const row = page.locator('[data-pw="task-list-demo-row-0"]');
    const computed = await row.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.animationDuration, easing: style.animationTimingFunction };
    });
    expect(computed.duration).toBe('0.05s');
    expect(computed.easing).toBe('linear');
  });

  test('Toggle .slider: no token set renders the existing literal transition (whole-shorthand alias kept, split pair added underneath)', async ({
    page
  }) => {
    await page.goto('/components/toggle');
    const slider = page.locator('[data-pw="toggle-alias"] .slider');
    const computed = await slider.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    });
    expect(computed.duration).toBe('0.4s');
    expect(computed.easing).toBe('ease');
  });

  test('Toggle .slider: --toggle-slider-transition-duration/-easing set on an ancestor change the computed transition', async ({
    page
  }) => {
    await page.goto('/components/toggle');
    await page.addStyleTag({
      content:
        '[data-pw="toggle-alias"] { --toggle-slider-transition-duration: 0.05s; --toggle-slider-transition-easing: linear; }'
    });
    const slider = page.locator('[data-pw="toggle-alias"] .slider');
    const computed = await slider.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    });
    expect(computed.duration).toBe('0.05s');
    expect(computed.easing).toBe('linear');
  });

  test('Toggle .slider: the existing whole-shorthand --toggle-slider-transition still wins over the new split pair (backward compatibility)', async ({
    page
  }) => {
    await page.goto('/components/toggle');
    await page.addStyleTag({
      content:
        '[data-pw="toggle-alias"] { --toggle-slider-transition: all 0.9s step-end; --toggle-slider-transition-duration: 0.05s; --toggle-slider-transition-easing: linear; }'
    });
    const slider = page.locator('[data-pw="toggle-alias"] .slider');
    const computed = await slider.evaluate((el) => {
      const style = getComputedStyle(el);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    });
    expect(computed.duration).toBe('0.9s');
    // Chromium normalizes the `step-end` keyword to its `steps(1)` equivalent
    // in getComputedStyle -- still proof the shorthand's own easing won, not
    // the split pair's `linear`.
    expect(computed.easing).toBe('steps(1)');
  });
});
