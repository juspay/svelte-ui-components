import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// `.tabs-item` sets `outline: none` and, until now, had no `:focus-visible`
// rule anywhere -- the roving-focus MANAGEMENT in Tabs.svelte's script
// (focusedKey/focusedIndex/focusTabAt) really does move document.activeElement,
// which is exactly why the existing keyboard-navigation spec passed: it only
// ever asserts `toBeFocused()`. Nothing verified the focus INDICATOR, so a
// sighted keyboard user arrowing through a tablist saw no sign of where focus
// was (WCAG 2.4.7 Focus Visible). These tests assert the actual resolved
// style, not just activeElement, and pin both themes plus the mouse-click
// case that :focus-visible (as opposed to :focus) must NOT light up for.
async function hasVisibleFocusStyle(locator: import('@playwright/test').Locator): Promise<boolean> {
  const style = await locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return { outlineStyle: s.outlineStyle, boxShadow: s.boxShadow };
  });
  return style.outlineStyle !== 'none' || (style.boxShadow !== 'none' && style.boxShadow !== '');
}

test.describe('Tabs focus indicator (WCAG 2.4.7)', () => {
  test('arrow-key navigation leaves a visible focus indicator on the newly focused tab (light theme)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    await tabAt('Tab 1').focus();
    // A real keyboard event -- handleKeydown calls focusTabAt(2), whose
    // .focus() call happens synchronously inside this keydown, which is what
    // keeps the browser in keyboard input modality for :focus-visible.
    await page.keyboard.press('ArrowRight');
    await expect(tabAt('Tab 2')).toBeFocused();

    expect(await hasVisibleFocusStyle(tabAt('Tab 2'))).toBe(true);
  });

  test('arrow-key navigation leaves a visible focus indicator on the newly focused tab (dark theme)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/tabs');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    await tabAt('Tab 1').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabAt('Tab 2')).toBeFocused();

    expect(await hasVisibleFocusStyle(tabAt('Tab 2'))).toBe(true);
  });

  test('the active tab (Home) also shows the indicator, and it differs from the tabs-bar background', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    await tabAt('Tab 1').focus();
    await page.keyboard.press('End');
    await expect(tabAt('Tab 20')).toBeFocused();

    // outlineColor resolves to a real colour (currentColor's paint) even when
    // outlineStyle is 'none' and nothing is actually drawn -- so the style
    // check is load-bearing here, not the colour comparison alone.
    expect(await hasVisibleFocusStyle(tabAt('Tab 20'))).toBe(true);

    const outlineColor = await tabAt('Tab 20').evaluate((el) => getComputedStyle(el).outlineColor);
    const barBackground = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(outlineColor).not.toBe(barBackground);
  });

  test('a mouse click does not show the indicator -- :focus-visible, not :focus', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/tabs');

    const bar = page.getByTestId('tabs-overflow-demo').locator('.tabs-bar');
    const tabAt = (label: string) => bar.getByRole('tab', { name: label, exact: true });

    await tabAt('Tab 3').click();
    await expect(tabAt('Tab 3')).toBeFocused();

    const outlineStyle = await tabAt('Tab 3').evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).toBe('none');
  });
});
