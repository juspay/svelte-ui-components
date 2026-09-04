import { expect, test, type Locator } from '@playwright/test';

// The toggle button had a hover rule but no `:active` rule at all, so pressing it
// looked identical to hovering it and the control gave no confirmation of the press.
// Defaults: rest = transparent, hover = #f3f4f6 (rgb(243,244,246)), pressed =
// #e5e7eb (rgb(229,231,235)). All three are asserted, because a pressed state that
// resolves to the same colour as hover is the same defect wearing a new token.
//
// Every read polls rather than sleeping: `--theme-switcher-transition-duration`
// defaults to 0.3s, so a fixed wait samples a composited mid-transition colour
// (`rgba(243,244,246,0.667)` two-thirds of the way in) and fails on a value that is
// on its way to being correct.
const settlesTo = (locator: Locator, expected: string) =>
  expect
    .poll(
      () => locator.evaluate((element: HTMLElement) => getComputedStyle(element).backgroundColor),
      { timeout: 2_000 }
    )
    .toBe(expected);

test.describe('ThemeSwitcher pressed state', () => {
  test('the toggle button paints three distinct states', async ({ page }) => {
    await page.goto('/components/theme-switcher');

    const toggle = page.locator('.toggle-button').first();
    await expect(toggle).toBeVisible();

    await settlesTo(toggle, 'rgba(0, 0, 0, 0)');

    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    const centreX = box!.x + box!.width / 2;
    const centreY = box!.y + box!.height / 2;

    await page.mouse.move(centreX, centreY);
    await settlesTo(toggle, 'rgb(243, 244, 246)');

    await page.mouse.down();
    try {
      await settlesTo(toggle, 'rgb(229, 231, 235)');
    } finally {
      await page.mouse.up();
    }
  });

  test('the pressed colour is driven by --theme-switcher-bg-pressed', async ({ page }) => {
    await page.goto('/components/theme-switcher');

    const toggle = page.locator('.toggle-button').first();
    await expect(toggle).toBeVisible();
    await toggle.evaluate((element: HTMLElement) => {
      element.style.setProperty('--theme-switcher-bg-pressed', 'rgb(1, 2, 3)');
    });

    const box = await toggle.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    try {
      await settlesTo(toggle, 'rgb(1, 2, 3)');
    } finally {
      await page.mouse.up();
    }
  });
});
