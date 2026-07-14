import { expect, test } from '@playwright/test';

// The library's own `.choicebox:hover` rule (specificity 0,3,0) outranked
// `.choicebox.selected` (0,2,0), so hovering a selected card repainted it with
// the neutral hover border/fill until the cursor left. Excluding the selected
// state from the hover rule lets the selected look show through on hover.
// Selected border default = #2196f3 (rgb(33,150,243)); hover border default =
// #9e9e9e (rgb(158,158,158)). The demo's first radio card is selected on load.
test.describe('Choicebox selected + hover', () => {
  test('a selected card keeps its selected border while hovered', async ({ page }) => {
    await page.goto('/components/choicebox');

    const selected = page.locator('.choicebox.selected').first();
    await expect(selected).toBeVisible();

    const borderOf = () =>
      selected.evaluate((el) => getComputedStyle(el as HTMLElement).borderTopColor);

    const restingBorder = await borderOf();
    expect(restingBorder).toBe('rgb(33, 150, 243)'); // selected blue, not hovered

    await selected.hover();
    // Give :hover a frame to apply.
    await page.waitForTimeout(100);

    const hoveredBorder = await borderOf();
    // Must stay the selected blue — NOT the neutral hover grey rgb(158, 158, 158).
    expect(hoveredBorder).toBe('rgb(33, 150, 243)');
  });
});
