import { expect, test } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight, step } from './support/narrate.js';

/**
 * The negative control for the walkthrough project itself.
 *
 * Every other spec here trusts three things: that the caption paints, that it
 * cannot be mistaken for page content, and that the clip has real length. This
 * one proves them, and it has already earned its place -- the first version of
 * `caption()` marked the overlay `aria-hidden` and set `textContent`, and this
 * spec failed, because `aria-hidden` governs the accessibility tree while
 * `getByText` reads the DOM. The caption was findable as page content, so a
 * walkthrough could have passed on its own narration.
 *
 * The two halves below have to stay together. "Unreachable by a content query"
 * is trivially satisfied by a caption that renders nothing at all, so the
 * reachability assertions are only meaningful next to the assertion that
 * something is actually painted.
 */
test('harness: captions paint, stay inert, and the clip is watchable', async ({ page }) => {
  await gotoHydrated(page, '/components/button');

  const overlay = page.locator('#sui-walkthrough-caption');

  await step(page, 'A caption paints over the page without becoming part of it.', async () => {
    await expect(overlay).toHaveCount(1);
  });

  // Painted: generated content has no text node, so its presence has to be read
  // off the property that feeds it and the box it occupies.
  const painted = await overlay.evaluate((el) => ({
    property: getComputedStyle(el).getPropertyValue('--sui-caption-text').trim(),
    height: el.getBoundingClientRect().height,
    text: el.textContent
  }));
  expect(painted.property).toContain('A caption paints over the page');
  expect(painted.height).toBeGreaterThan(0);
  expect(painted.text).toBe('');

  // Unreachable: no content query may find the narration.
  await expect(page.getByText('A caption paints over the page')).toHaveCount(0);

  // Inert: it can never be what a click lands on, nor be announced.
  expect(
    await overlay.evaluate((el) => {
      const style = getComputedStyle(el);
      return { pointer: style.pointerEvents, hidden: el.getAttribute('aria-hidden') };
    })
  ).toEqual({ pointer: 'none', hidden: 'true' });

  await step(page, 'highlight() outlines an element, then restores it exactly.', async () => {
    const target = page.getByRole('button').first();
    const before = await target.evaluate((el) =>
      el instanceof HTMLElement ? el.style.outline : ''
    );
    await highlight(target);
    const after = await target.evaluate((el) =>
      el instanceof HTMLElement ? el.style.outline : ''
    );
    expect(after).toBe(before);
  });

  await caption(page, 'Recording continues so the clip has real wall-clock length.');
  await beat(page, 2_000);
});
