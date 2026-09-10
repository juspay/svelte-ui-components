import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// A textarea/input takes `line-height: normal` from the UA stylesheet, which beats any
// value inherited from its container — so this was unreachable for consumers.
test.describe('Input — line-height', () => {
  test('the custom property reaches the field', async ({ page }) => {
    await gotoHydrated(page, '/components/input');

    await expect(page.getByTestId('input-line-height')).toHaveCSS('line-height', '32px');
  });

  test('fields that set nothing still compute normal', async ({ page }) => {
    await gotoHydrated(page, '/components/input');

    // Regression guard: the default must be the UA value these fields already had,
    // not a library-chosen number that would reflow every existing textarea.
    const plain = page.getByTestId('input-paste-textarea');
    const lineHeight = await plain.evaluate((el) => getComputedStyle(el).lineHeight);
    expect(lineHeight).toBe('normal');
  });
});
