import { expect, test } from '@playwright/test';

// The use:tooltip action used to centre its bubble on the trigger with a bare
// translate(-50%) and no edge handling: a trigger near the viewport edge
// spilled its bubble off-screen, and a trigger near the bottom pushed the
// bubble out of view. The bubble now clamps to the viewport (8px margin),
// flips to the opposite side when the preferred side lacks room, and keeps
// its arrow anchored over the trigger.
test.describe('tooltip action — viewport clamping', () => {
  test('left-edge trigger keeps its bubble inside the viewport with the arrow on the trigger', async ({
    page
  }) => {
    await page.goto('/components/tooltip');

    const trigger = page.getByTestId('tooltip-edge-left');
    // Pin the trigger to the exact viewport edge so the test is independent of
    // the demo page's own gutters.
    await trigger.evaluate((el) => {
      el.style.position = 'fixed';
      el.style.left = '4px';
      el.style.top = '300px';
    });
    await trigger.hover();
    const bubble = page.locator('[role="tooltip"]');
    await expect(bubble).toBeVisible();

    const bubbleBox = await bubble.boundingBox();
    const triggerBox = await trigger.boundingBox();
    if (bubbleBox === null || triggerBox === null) {
      throw new Error('boundingBox is null');
    }
    expect(bubbleBox.x).toBeGreaterThanOrEqual(0);

    // The arrow (first child div) must still point at the trigger.
    const arrowBox = await bubble.locator('div').first().boundingBox();
    if (arrowBox === null) {
      throw new Error('arrow boundingBox is null');
    }
    const arrowCenter = arrowBox.x + arrowBox.width / 2;
    expect(arrowCenter).toBeGreaterThanOrEqual(triggerBox.x - 1);
    expect(arrowCenter).toBeLessThanOrEqual(triggerBox.x + triggerBox.width + 1);
  });

  test('right-edge trigger keeps its bubble inside the viewport', async ({ page }) => {
    await page.goto('/components/tooltip');

    const trigger = page.getByTestId('tooltip-edge-right');
    await trigger.evaluate((el) => {
      el.style.position = 'fixed';
      el.style.left = 'auto';
      el.style.right = '4px';
      el.style.top = '300px';
    });
    await trigger.hover();
    const bubble = page.locator('[role="tooltip"]');
    await expect(bubble).toBeVisible();

    const bubbleBox = await bubble.boundingBox();
    const viewport = page.viewportSize();
    if (bubbleBox === null || viewport === null) {
      throw new Error('boundingBox or viewport is null');
    }
    expect(Math.round(bubbleBox.x + bubbleBox.width)).toBeLessThanOrEqual(viewport.width);
    // The old code shrank-to-fit against the viewport's right edge instead of
    // shifting left — a degenerate ~60px-wide, 200px-tall text column. The
    // clamped bubble keeps its natural max-width shape.
    expect(bubbleBox.width).toBeGreaterThan(150);
    expect(bubbleBox.height).toBeLessThan(120);
  });

  test('bottom-positioned tooltip flips above a trigger sitting at the viewport bottom', async ({
    page
  }) => {
    await page.goto('/components/tooltip');

    const trigger = page.getByTestId('tooltip-edge-left');
    // Scroll so the trigger sits ~30px above the viewport bottom — no room below.
    await trigger.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      window.scrollBy(0, rect.bottom - window.innerHeight + 30);
    });
    await trigger.hover();
    const bubble = page.locator('[role="tooltip"]');
    await expect(bubble).toBeVisible();

    const bubbleBox = await bubble.boundingBox();
    const triggerBox = await trigger.boundingBox();
    if (bubbleBox === null || triggerBox === null) {
      throw new Error('boundingBox is null');
    }
    // Flipped: the bubble sits fully above the trigger instead of below it.
    expect(bubbleBox.y + bubbleBox.height).toBeLessThanOrEqual(triggerBox.y + 1);
  });
});
