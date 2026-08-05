import { expect, test } from '@playwright/test';

// .tabs-item.active bumps font-weight from --tabs-item-font-weight (400) to
// --tabs-active-font-weight (600). Before this fix that weight jump resized
// the tab itself, which reflowed every tab after it and made the tab bar
// visibly shift on every selection change -- not just an indicator timing
// issue, the whole row jumped. The fix reserves each label's active-state
// width via a hidden ::after ghost rendered at the active weight, so a tab's
// box is already as wide as it will ever need to be, in either state.
test.describe('Tabs active-state width reservation', () => {
  test('selecting a different tab does not shift an untouched sibling tab (horizontal)', async ({
    page
  }) => {
    await page.goto('/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    // Tab 1 is active by default; Tab 5 stays untouched throughout the test.
    const witness = tabAt('Tab 5');
    const before = await witness.boundingBox();
    expect(before).not.toBeNull();

    // Tab 1 (active -> inactive, loses bold) and Tab 2 (inactive -> active,
    // gains bold) both change weight here -- exactly the transition that used
    // to reflow everything after them, including the untouched Tab 5.
    await tabAt('Tab 2').click();
    await expect(tabAt('Tab 2')).toHaveAttribute('aria-selected', 'true');

    const after = await witness.boundingBox();
    expect(after).not.toBeNull();
    expect(after?.x).toBe(before?.x);
    expect(after?.width).toBe(before?.width);
  });

  test("a tab's own width is identical active vs. inactive (horizontal)", async ({ page }) => {
    await page.goto('/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    // Tab 3 starts inactive (400 weight); measure it, activate it (600
    // weight), and confirm the box didn't grow to fit the bolder glyphs.
    const tab3 = tabAt('Tab 3');
    const inactiveBox = await tab3.boundingBox();
    expect(inactiveBox).not.toBeNull();

    await tab3.click();
    await expect(tab3).toHaveAttribute('aria-selected', 'true');

    const activeBox = await tab3.boundingBox();
    expect(activeBox).not.toBeNull();
    expect(activeBox?.width).toBe(inactiveBox?.width);
  });

  test("a vertical nav item's label width is identical active vs. inactive", async ({ page }) => {
    await page.goto('/components/tabs');

    const rail = page.getByTestId('tabs-vertical-demo');
    const tabAt = (label: string) => rail.getByRole('tab', { name: label });

    // "General" starts inactive; the vertical row itself is already
    // width:100% so this isolates the label span's own reserved width.
    const label = tabAt('General').locator('.tabs-item-label');
    const inactiveWidth = (await label.boundingBox())?.width;
    expect(inactiveWidth).not.toBeUndefined();

    await tabAt('General').click();
    await expect(tabAt('General')).toHaveAttribute('aria-selected', 'true');

    const activeWidth = (await label.boundingBox())?.width;
    expect(activeWidth).toBe(inactiveWidth);
  });
});
