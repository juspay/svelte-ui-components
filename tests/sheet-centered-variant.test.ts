import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Closes #525: Sheet had no centered/floating dialog variant (edge-anchored
// left/right/top/bottom only) and always rendered its title through a plain
// <span>, with no way to reach a real heading tag. Both gaps forced TARA's
// LaunchSheet.svelte to hand-roll its own overlay/panel/heading instead of
// using this component at all.
test.describe('Sheet side="center"', () => {
  test('is a fixed-size dialog centered in the viewport, not edge-anchored', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByText('Open centered dialog').click();
    const panel = page.getByTestId('sheet-centered-panel');
    await expect(panel).toBeVisible();
    // Let the 300ms transition finish — mid-transition the panel is still
    // fading in.
    await page.waitForTimeout(400);

    const box = await panel.boundingBox();
    if (box === null) {
      throw new Error('Centered sheet panel boundingBox is null');
    }
    const viewportSize = page.viewportSize();
    if (viewportSize === null) {
      throw new Error('Viewport size is null');
    }

    // Not flush to any edge — this is what an edge-anchored side (left,
    // right, top, bottom) always is, and what "centered" must not be.
    expect(Math.round(box.y)).toBeGreaterThan(0);
    expect(Math.round(box.y + box.height)).toBeLessThan(viewportSize.height);
    expect(Math.round(box.x)).toBeGreaterThan(0);
    expect(Math.round(box.x + box.width)).toBeLessThan(viewportSize.width);

    // Centered: equal space either side, within a couple of pixels of
    // rounding/scrollbar slack.
    const leftGap = box.x;
    const rightGap = viewportSize.width - (box.x + box.width);
    expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(2);
    const topGap = box.y;
    const bottomGap = viewportSize.height - (box.y + box.height);
    expect(Math.abs(topGap - bottomGap)).toBeLessThanOrEqual(2);

    // Fixed-size: the default --sheet-center-width (480px), not stretched to
    // fill the viewport the way left/right/top/bottom panels are.
    expect(Math.round(box.width)).toBe(480);
  });

  test('an unconfigured left/right/top/bottom sheet is unaffected (still edge-to-edge)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByText('Open right', { exact: true }).click();
    const panel = page.getByTestId('sheet-right-panel');
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
    // Byte-for-byte the pre-existing behavior: flush top-to-bottom, unlike
    // the new centered variant above.
    expect(Math.round(box.y)).toBe(0);
    expect(Math.round(box.y + box.height)).toBe(viewportSize.height);
  });
});

test.describe('Sheet headingLevel', () => {
  test('renders the title through a real heading element when set', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByText('Open with headingLevel').click();
    const panel = page.getByTestId('sheet-heading-panel');
    await expect(panel).toBeVisible();

    const title = panel.locator('.sheet-title');
    await expect(title).toHaveText('Confirm action');
    expect(await title.evaluate((el) => el.tagName)).toBe('H2');
  });

  test('title stays a <span> when headingLevel is not set (default unchanged)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByText('Open right', { exact: true }).click();
    const panel = page.getByTestId('sheet-right-panel');
    await expect(panel).toBeVisible();

    const title = panel.locator('.sheet-title');
    await expect(title).toHaveText('Settings');
    expect(await title.evaluate((el) => el.tagName)).toBe('SPAN');
  });
});
