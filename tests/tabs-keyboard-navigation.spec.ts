import { expect, test } from '@playwright/test';

// The roving tabindex (active tab 0, everything else -1) used to pair with a
// keydown handler that only covered Enter/Space — a keyboard user could Tab
// onto the active tab and never reach any other tab. These tests pin the
// WAI-ARIA APG tablist contract now implemented: orientation-aware arrow keys
// move selection with activation-follows-focus and wrap-around, Home/End jump
// to the ends, and DOM focus lands on the newly active tab so arrowing chains.
test.describe('Tabs keyboard navigation (APG tablist contract)', () => {
  test('ArrowRight/ArrowLeft move selection and focus with wrap-around (horizontal, string mode)', async ({
    page
  }) => {
    await page.goto('/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    await tabAt('Tab 1').focus();
    await expect(tabAt('Tab 1')).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(tabAt('Tab 2')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Tab 2')).toBeFocused();
    await expect(tabAt('Tab 1')).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowLeft');
    await expect(tabAt('Tab 1')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Tab 1')).toBeFocused();

    // Wrap-around: ArrowLeft from the first tab reaches the last.
    await page.keyboard.press('ArrowLeft');
    await expect(tabAt('Tab 20')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Tab 20')).toBeFocused();
  });

  test('Home/End jump to the first/last tab, scrolling the offscreen target into view', async ({
    page
  }) => {
    await page.goto('/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    await tabAt('Tab 1').focus();
    await page.keyboard.press('End');
    await expect(tabAt('Tab 20')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Tab 20')).toBeFocused();
    await expect(tabAt('Tab 20')).toBeInViewport();

    await page.keyboard.press('Home');
    await expect(tabAt('Tab 1')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Tab 1')).toBeFocused();
    await expect(tabAt('Tab 1')).toBeInViewport();
  });

  test('vertical orientation uses ArrowDown/ArrowUp and ignores ArrowRight (object mode via activeKey)', async ({
    page
  }) => {
    await page.goto('/components/tabs');

    const rail = page.getByTestId('tabs-vertical-demo');
    await expect(rail.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');

    const tabAt = (label: string) => rail.getByRole('tab', { name: label });

    await tabAt('Cart Design').focus();
    await page.keyboard.press('ArrowDown');
    await expect(tabAt('General')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('General')).toBeFocused();

    // The cross-axis arrow is not part of a vertical tablist's contract.
    await page.keyboard.press('ArrowRight');
    await expect(tabAt('General')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('General')).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(tabAt('Cart Design')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Cart Design')).toBeFocused();
  });

  test('Enter and Space still activate the focused tab', async ({ page }) => {
    await page.goto('/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    // Focus moves with selection (activation follows focus), so Enter/Space on
    // the focused active tab is a no-op that must not throw or move selection.
    await tabAt('Tab 1').focus();
    await page.keyboard.press('Enter');
    await expect(tabAt('Tab 1')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press(' ');
    await expect(tabAt('Tab 1')).toHaveAttribute('aria-selected', 'true');
  });
});
