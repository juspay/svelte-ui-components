import { expect, test } from '@playwright/test';

// A textarea that grows with content needs a ceiling before it scrolls, and one used as a
// paste target needs a floor. Neither was reachable through the --input-* surface.
test.describe('Input — min-height / max-height', () => {
  test('both custom properties reach the textarea', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-bounded-height');
    await expect(field).toHaveCSS('min-height', '80px');
    await expect(field).toHaveCSS('max-height', '160px');
  });

  test('fields that set neither keep the CSS initial values', async ({ page }) => {
    await page.goto('/components/input');

    // Regression guard: the declarations must fall back to the CSS initial values, not to a
    // library-chosen height that would resize every existing consumer.
    const plain = page.getByTestId('input-readonly');
    await expect(plain).toHaveCSS('min-height', 'auto');
    await expect(plain).toHaveCSS('max-height', 'none');
  });
});
