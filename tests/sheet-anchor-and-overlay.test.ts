import { expect, test } from '@playwright/test';

// Covers the three Sheet gaps: anchor-position tokens (turning an edge-to-edge
// slide-in into a floating anchored panel), an invisible-but-dismissible overlay
// (dismissOnOutsideClick independent of showOverlay), and reference-counted
// body scroll lock (two Sheets open at once, closing one doesn't unlock scroll
// while the other is still open).
test.describe('Sheet anchor position tokens', () => {
  test('an unconfigured sheet stays edge-to-edge (defaults unchanged)', async ({ page }) => {
    await page.goto('/components/sheet');

    await page.getByText('Open right', { exact: true }).click();
    const panel = page.locator('.sheet-panel.right').first();
    await expect(panel).toBeVisible();
    await page.waitForTimeout(400);

    const box = await panel.boundingBox();
    if (box === null) {
      throw new Error('Sheet panel boundingBox is null');
    }
    const viewportSize = page.viewportSize();
    if (viewportSize === null) {
      throw new Error('Viewport size is null');
    }
    expect(Math.round(box.y)).toBe(0);
    expect(Math.round(box.y + box.height)).toBe(viewportSize.height);
  });

  test('anchor tokens turn the panel into a floating, content-sized box', async ({ page }) => {
    await page.goto('/components/sheet');

    await page.getByText('Open account menu').click();
    const panel = page.locator('[data-pw="sheet-anchored"] .sheet-panel').first();
    await expect(panel).toBeVisible();
    // Let the 300ms fly-in transition finish — mid-transition the panel sits at
    // an intermediate translateX, not its resting position.
    await page.waitForTimeout(400);

    const box = await panel.boundingBox();
    if (box === null) {
      throw new Error('Anchored sheet panel boundingBox is null');
    }
    const viewportSize = page.viewportSize();
    if (viewportSize === null) {
      throw new Error('Viewport size is null');
    }

    // Anchored below the fixed 56px header, not flush to the top.
    expect(Math.round(box.y)).toBe(56);
    // Sized to content, not stretched to the viewport bottom.
    expect(Math.round(box.y + box.height)).toBeLessThan(viewportSize.height);
    // Inset from the right edge (--sheet-right: 16px), not flush.
    expect(Math.round(viewportSize.width - (box.x + box.width))).toBe(16);
  });
});

test.describe('Sheet dismissOnOutsideClick', () => {
  test('an invisible overlay is still click-dismissible when requested', async ({ page }) => {
    await page.goto('/components/sheet');

    await page.getByText('Open account menu').click();
    const overlay = page.locator('[data-pw="sheet-anchored"]');
    await expect(overlay).toBeVisible();

    // No dimming — the overlay is fully transparent.
    const backgroundColor = await overlay.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    expect(backgroundColor).toBe('rgba(0, 0, 0, 0)');

    // Clicking the (invisible) overlay outside the panel still dismisses it.
    await overlay.click({ position: { x: 5, y: 5 } });
    await expect(page.locator('[data-pw="sheet-anchored"]')).toHaveCount(0);
  });

  test('a visible, non-dismissible overlay blocks the page but does not close on click', async ({
    page
  }) => {
    await page.goto('/components/sheet');

    await page.getByText('Open blocking sheet').click();
    const overlay = page.locator('[data-pw="sheet-blocking"]');
    await expect(overlay).toBeVisible();
    await page.waitForTimeout(300);

    // Dimmed backdrop is present (not transparent).
    const backgroundColor = await overlay.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

    // The overlay must catch pointer events to block the page underneath —
    // otherwise the dimming backdrop is purely cosmetic and clicks fall through.
    const pointerEvents = await overlay.evaluate(
      (element) => getComputedStyle(element).pointerEvents
    );
    expect(pointerEvents).toBe('auto');

    // Clicking the overlay must NOT dismiss it (dismissOnOutsideClick=false).
    await overlay.click({ position: { x: 5, y: 5 } });
    await expect(overlay).toBeVisible();
  });
});

test.describe('Sheet reference-counted scroll lock', () => {
  test('closing one of two open sheets keeps the page scroll-locked for the other', async ({
    page
  }) => {
    await page.goto('/components/sheet');

    await page.getByText('Open right', { exact: true }).click();
    await expect(page.locator('.sheet-panel.right').first()).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    // The first sheet's full-screen overlay legitimately blocks real clicks on
    // the rest of the page (that's the point of a modal backdrop) — `force`
    // still routes through the browser's hit-testing and would hit the overlay,
    // not the button underneath it, so dispatch the click directly on the
    // element instead, simulating a second sheet opened by some other trigger
    // (e.g. a notification), the realistic multi-sheet scenario this fix covers.
    await page.getByText('Open with footer').dispatchEvent('click');
    await expect(page.locator('.sheet-panel.right').nth(1)).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    // Close the second sheet (via its own overlay/Escape) — the first is still open,
    // so the page must remain scroll-locked.
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  });
});
