import { expect, test } from '@playwright/test';

// autoResize derived its ceiling from maxRows alone. With the ceiling coming from
// --input-max-height instead, the computed limit stayed Infinity: the inline height grew
// past the CSS clamp and overflowY was set to 'hidden', so the box stopped at the right
// size but its overflow became unreachable rather than scrollable.
test.describe('Input — autoResize honours a CSS max-height', () => {
  test('becomes scrollable at the ceiling instead of clipping', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-autoresize-capped');
    await field.fill(Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n'));
    await page.waitForTimeout(300);

    await expect(field).toHaveCSS('overflow-y', 'auto');

    const box = await field.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      scrollHeight: el.scrollHeight
    }));
    expect(box.height).toBeLessThanOrEqual(91);
    expect(box.scrollHeight).toBeGreaterThan(box.height);
  });

  test('still hides overflow while the content fits', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-autoresize-capped');
    await field.fill('one line');
    await page.waitForTimeout(300);

    await expect(field).toHaveCSS('overflow-y', 'hidden');
  });
});
