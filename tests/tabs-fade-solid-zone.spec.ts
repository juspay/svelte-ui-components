import { expect, test } from '@playwright/test';

// The overflow fade used to ramp from transparent at the exact edge, which
// left the clipped tab label perceptible (~20% opacity) a few px in — reading
// as a stray glyph fragment beside the scroll arrow. The mask now holds fully
// transparent for --tabs-fade-solid (8px default) before ramping to opaque at
// --tabs-fade-size.
test.describe('Tabs fade solid zone', () => {
  test('edge fades hold a fully-transparent 8px zone', async ({ page }) => {
    await page.goto('/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    await expect(bar).toHaveClass(/fade-right/);

    const maskImage = await bar.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.maskImage !== 'none' ? style.maskImage : style.webkitMaskImage;
    });
    // transparent resolves to rgba(0, 0, 0, 0) in the computed gradient; the
    // 8px stop is the solid zone resolved from --tabs-fade-solid.
    expect(maskImage).toContain('rgba(0, 0, 0, 0) 8px');
  });

  test('mid-scroll both edges fade through the double-ended mask', async ({ page }) => {
    await page.goto('/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    await bar.evaluate((el) => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    });
    await expect(bar).toHaveClass(/fade-left/);
    await expect(bar).toHaveClass(/fade-right/);

    const maskImage = await bar.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.maskImage !== 'none' ? style.maskImage : style.webkitMaskImage;
    });
    // One symmetric gradient with BOTH ends transparent — the two single-edge
    // rules alone would tie on specificity and drop one edge's fade.
    const transparentStops = maskImage.match(/rgba\(0, 0, 0, 0\)/g) ?? [];
    expect(transparentStops.length).toBeGreaterThanOrEqual(2);
    expect(maskImage).toContain('rgba(0, 0, 0, 0) 8px');
    expect(maskImage).toContain('calc(100% - 8px)');
  });
});
