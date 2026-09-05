import { expect, test } from '@playwright/test';

// <input type="range"> already gets its arrow-key/Home/End behaviour and role="slider"
// entirely free from the browser — Slider.svelte adds no custom keydown handling. What
// it was missing was any way to give the control an accessible name (see the ariaLabel
// prop added alongside this spec). aria-valuenow/min/max are accessibility-tree
// properties computed from the native min/max/value attributes, not literal DOM
// attributes themselves, so the value contract is asserted via toHaveValue/toHaveAttribute
// on those instead of trying to read aria-value* directly.
test.describe('Slider keyboard interaction (native range input)', () => {
  test('Tab reaches the slider, which exposes an accessible name via aria-label', async ({
    page
  }) => {
    await page.goto('/components/slider');

    const slider = page.getByRole('slider', { name: 'Volume' });
    await expect(slider).toBeVisible();

    // Tab has to do the reaching: focus() succeeds even on a control taken out
    // of the tab order, so asserting on it would keep this test passing through
    // the exact regression it is named for.
    //
    // Stepping back one stop and forward again, rather than walking from the
    // top of the document: the demo sits behind ~90 nav links, so a walk needs a
    // bound that depends on how much site chrome happens to render — which is
    // not the same on a laptop and on CI, and made the first version of this
    // test pass here and fail on Linux. This asks the same question locally. A
    // slider removed from the tab order would still take focus() and still let
    // Shift+Tab leave, but the Tab back would skip it for the next control.
    await slider.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(slider).not.toBeFocused();

    await page.keyboard.press('Tab');
    await expect(slider).toBeFocused();
  });

  test('Arrow keys nudge the value by one step in each direction, reflected in the displayed value', async ({
    page
  }) => {
    await page.goto('/components/slider');

    const slider = page.getByRole('slider', { name: 'Volume' });
    const display = page.locator('.slider-value');

    await slider.focus();
    await expect(slider).toHaveValue('50');
    await expect(display).toHaveText('50');

    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('51');
    await expect(display).toHaveText('51');

    await page.keyboard.press('ArrowUp');
    await expect(slider).toHaveValue('52');
    await expect(display).toHaveText('52');

    await page.keyboard.press('ArrowLeft');
    await expect(slider).toHaveValue('51');

    await page.keyboard.press('ArrowDown');
    await expect(slider).toHaveValue('50');
    await expect(display).toHaveText('50');
  });

  test('Home and End jump to the minimum and maximum', async ({ page }) => {
    await page.goto('/components/slider');

    const slider = page.getByRole('slider', { name: 'Volume' });
    await slider.focus();

    await page.keyboard.press('End');
    await expect(slider).toHaveValue('100');

    await page.keyboard.press('Home');
    await expect(slider).toHaveValue('0');
  });

  test('the min/max contract is exposed as real DOM attributes', async ({ page }) => {
    await page.goto('/components/slider');

    const slider = page.getByRole('slider', { name: 'Volume' });
    await expect(slider).toHaveAttribute('min', '0');
    await expect(slider).toHaveAttribute('max', '100');
  });
});
