import { expect, test } from '@playwright/test';

// The marker is a decorative accent bar. The two things that can silently go wrong are
// that it is not painted at all (a token resolving to nothing, a dropped class) and that
// it is exposed to assistive technology as if it carried meaning. Both are asserted
// against a marker-less message on the same page, so the comparison controls for the
// bubble's own styling rather than trusting a single absolute value.
test.describe('ChatMessage — marker', () => {
  test('paints an accent bar only on the message that asks for one', async ({ page }) => {
    await page.goto('/components/chat-message');

    const withMarker = page.locator('[data-pw="marker-demo"] .marker');
    const withoutMarker = page.locator('[data-pw="marker-demo-off"] .marker');

    await expect(withMarker).toHaveCount(1);
    await expect(withoutMarker).toHaveCount(0);

    const box = await withMarker.boundingBox();
    expect(box).not.toBeNull();
    // A zero-width or zero-height bar is "present" in the DOM and invisible on screen.
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // It spans the bubble rather than sitting at a single point.
    const bubble = page.locator('[data-pw="marker-demo"] .bubble');
    const bubbleBox = await bubble.boundingBox();
    expect(box!.height).toBeCloseTo(bubbleBox!.height, 0);

    // Painted, not transparent.
    const background = await withMarker.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    expect(background).not.toBe('transparent');
  });

  test('is hidden from assistive technology', async ({ page }) => {
    await page.goto('/components/chat-message');
    const marker = page.locator('[data-pw="marker-demo"] .marker');
    await expect(marker).toHaveAttribute('aria-hidden', 'true');
    // It must not contribute text either — a bar that reads out is worse than no bar.
    await expect(marker).toHaveText('');
  });

  test('the offset token moves it into the gutter, outside the bubble', async ({ page }) => {
    await page.goto('/components/chat-message');

    const inside = await page.locator('[data-pw="marker-demo"] .marker').boundingBox();
    const insideBubble = await page.locator('[data-pw="marker-demo"] .bubble').boundingBox();
    const gutter = await page.locator('[data-pw="marker-demo-gutter"] .marker').boundingBox();
    const gutterBubble = await page.locator('[data-pw="marker-demo-gutter"] .bubble').boundingBox();

    // Default: flush with the bubble's leading edge.
    expect(inside!.x).toBeCloseTo(insideBubble!.x, 0);
    // Overridden: fully clear of the bubble, in the space the layout reserved for it.
    expect(gutter!.x + gutter!.width).toBeLessThanOrEqual(gutterBubble!.x + 0.5);
    // And the width token applies too, so the two bars are not the same bar.
    expect(gutter!.width).toBeGreaterThan(inside!.width);
  });

  // The bar is absolutely positioned over the bubble's leading padding, which is exactly
  // where a link at the start of a message sits. With the default `pointer-events: auto`
  // it would swallow those clicks silently — the link still looks and reads fine, it just
  // stops working in a strip a few pixels wide.
  test('does not intercept clicks meant for content underneath it', async ({ page }) => {
    await page.goto('/components/chat-message');

    const marker = page.locator('[data-pw="marker-demo-link"] .marker');
    await expect(marker).toHaveCount(1);

    // Hit-test the marker's own centre: whatever is returned must not be the marker.
    const hit = await marker.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const atPoint = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        isMarker: atPoint === node,
        computed: getComputedStyle(node).pointerEvents
      };
    });
    expect(hit.computed).toBe('none');
    expect(hit.isMarker).toBe(false);

    // And the link underneath actually works.
    await page.locator('[data-pw="marker-inner-link"]').click();
    await expect(page).toHaveURL(/#marker-link-target$/);
  });
});
